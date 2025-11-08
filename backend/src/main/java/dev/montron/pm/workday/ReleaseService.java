package dev.montron.pm.workday;

import dev.montron.pm.audit.ReleaseActionEntity;
import dev.montron.pm.audit.ReleaseActionRepository;
import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import dev.montron.pm.employees.EmployeeEntity;
import dev.montron.pm.pdf.PdfService;
import dev.montron.pm.security.pin.PinService;
import dev.montron.pm.storage.StorageService;
import dev.montron.pm.workday.validation.ValidationIssueEntity;
import dev.montron.pm.workday.validation.ValidationIssueRepository;
import dev.montron.pm.workday.validation.ValidationService;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReleaseService {

    private final CurrentUserService currentUserService;
    private final WorkdayRepository workdayRepository;
    private final TbEntryRepository tbEntryRepository;
    private final RsEntryRepository rsEntryRepository;
    private final AttachmentRepository attachmentRepository;
    private final ValidationIssueRepository validationIssueRepository;
    private final ValidationService validationService;
    private final PinService pinService;
    private final PdfService pdfService;
    private final StorageService storageService;
    private final ReleaseActionRepository releaseActionRepository;

    public ReleaseService(
            CurrentUserService currentUserService,
            WorkdayRepository workdayRepository,
            TbEntryRepository tbEntryRepository,
            RsEntryRepository rsEntryRepository,
            AttachmentRepository attachmentRepository,
            ValidationIssueRepository validationIssueRepository,
            ValidationService validationService,
            PinService pinService,
            PdfService pdfService,
            StorageService storageService,
            ReleaseActionRepository releaseActionRepository) {
        this.currentUserService = currentUserService;
        this.workdayRepository = workdayRepository;
        this.tbEntryRepository = tbEntryRepository;
        this.rsEntryRepository = rsEntryRepository;
        this.attachmentRepository = attachmentRepository;
        this.validationIssueRepository = validationIssueRepository;
        this.validationService = validationService;
        this.pinService = pinService;
        this.pdfService = pdfService;
        this.storageService = storageService;
        this.releaseActionRepository = releaseActionRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ReleaseResponse releaseWorkday(UUID workdayId, ReleaseRequest request) {
        Objects.requireNonNull(request, "release request must not be null");

        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID companyId = currentUser.companyId();

        WorkdayEntity workday = workdayRepository.findByIdAndCompanyId(workdayId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workday not found"));

        if ("RELEASED".equalsIgnoreCase(workday.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Workday already released");
        }

        pinService.verifyPinForCurrentUser(request.pin());

        validationService.recalculateForWorkday(workday.getId());
        List<ValidationIssueEntity> issues = validationIssueRepository.findByWorkday(workday);
        boolean hasError = issues.stream().anyMatch(issue -> "ERROR".equalsIgnoreCase(issue.getSeverity()));

        boolean forceRelease = Boolean.TRUE.equals(request.forceRelease());
        if (hasError && !forceRelease) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Cannot release workday due to error-level validation issues");
        }
        if (hasError && forceRelease && (request.overrideReason() == null || request.overrideReason().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "overrideReason is required when forcing release");
        }

        TbEntryEntity tb = tbEntryRepository.findByWorkday(workday).orElse(null);
        RsEntryEntity rs = rsEntryRepository.findByWorkday(workday).orElse(null);
        List<AttachmentEntity> attachments = attachmentRepository.findByWorkday(workday);
        EmployeeEntity employee = workday.getEmployee();

        byte[] tbPdf = tb != null ? pdfService.generateTbPdf(workday, tb, employee) : null;
        byte[] rsPdf = rs != null ? pdfService.generateRsPdf(workday, rs, employee) : null;

        Path exportPath = storageService.exportWorkdayFiles(workday, employee, tbPdf, rsPdf, attachments);

        ReleaseActionEntity action = new ReleaseActionEntity();
        action.setWorkday(workday);
        action.setUserId(currentUser.userId());
        action.setPinLast4(extractLast4(request.pin()));
        action.setReleasedAt(Instant.now());
        action.setTargetPath(exportPath.toString());
        releaseActionRepository.save(action);

        workday.setStatus("RELEASED");
        workdayRepository.save(workday);

        return new ReleaseResponse(workday.getId(), workday.getStatus(), action.getReleasedAt(), action.getTargetPath());
    }

    private String extractLast4(String pin) {
        if (pin == null) {
            return null;
        }
        return pin.length() <= 4 ? pin : pin.substring(pin.length() - 4);
    }
}
