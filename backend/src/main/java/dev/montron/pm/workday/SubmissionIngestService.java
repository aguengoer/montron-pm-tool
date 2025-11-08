package dev.montron.pm.workday;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.montron.pm.common.TenantContext;
import dev.montron.pm.employees.EmployeeEntity;
import dev.montron.pm.employees.EmployeeRepository;
import dev.montron.pm.integration.FormBackendClient;
import dev.montron.pm.integration.FormSubmissionAttachmentDto;
import dev.montron.pm.integration.FormSubmissionDto;
import dev.montron.pm.integration.IngestCursorEntity;
import dev.montron.pm.integration.IngestCursorService;
import dev.montron.pm.integration.SubmissionDocumentType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubmissionIngestService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionIngestService.class);

    private final FormBackendClient formBackendClient;
    private final EmployeeRepository employeeRepository;
    private final WorkdayRepository workdayRepository;
    private final TbEntryRepository tbEntryRepository;
    private final RsEntryRepository rsEntryRepository;
    private final AttachmentRepository attachmentRepository;
    private final IngestCursorService ingestCursorService;
    private final ObjectMapper objectMapper;

    public SubmissionIngestService(
            FormBackendClient formBackendClient,
            EmployeeRepository employeeRepository,
            WorkdayRepository workdayRepository,
            TbEntryRepository tbEntryRepository,
            RsEntryRepository rsEntryRepository,
            AttachmentRepository attachmentRepository,
            IngestCursorService ingestCursorService,
            ObjectMapper objectMapper) {
        this.formBackendClient = formBackendClient;
        this.employeeRepository = employeeRepository;
        this.workdayRepository = workdayRepository;
        this.tbEntryRepository = tbEntryRepository;
        this.rsEntryRepository = rsEntryRepository;
        this.attachmentRepository = attachmentRepository;
        this.ingestCursorService = ingestCursorService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void ingestSubmissionsForTenant(UUID companyId, LocalDate from, LocalDate to) {
        TenantContext.setCompanyId(companyId);
        try {
            IngestCursorEntity cursor = ingestCursorService.getOrCreateForTenantAndFeed(
                    companyId, IngestCursorService.Feed.SUBMISSIONS);

            Instant updatedAfter = null;
            if (cursor.getCursor() != null) {
                try {
                    updatedAfter = Instant.parse(cursor.getCursor());
                } catch (Exception ex) {
                    log.warn("Invalid submissions cursor '{}' for tenant {}. Resetting.", cursor.getCursor(), companyId);
                }
            }

            List<FormSubmissionDto> tbSubmissions = formBackendClient.fetchSubmissionsIntegration(
                    SubmissionDocumentType.TB, from, to, updatedAfter);
            List<FormSubmissionDto> rsSubmissions = formBackendClient.fetchSubmissionsIntegration(
                    SubmissionDocumentType.RS, from, to, updatedAfter);

            tbSubmissions.forEach(sub -> upsertWorkdayAndTb(companyId, sub));
            rsSubmissions.forEach(sub -> upsertWorkdayAndRs(companyId, sub));

            Instant latestUpdated = determineLatestUpdated(tbSubmissions, rsSubmissions).orElse(Instant.now());
            ingestCursorService.updateCursor(cursor, latestUpdated.toString(), Instant.now());
        } finally {
            TenantContext.clear();
        }
    }

    private Optional<Instant> determineLatestUpdated(List<FormSubmissionDto> tbSubmissions, List<FormSubmissionDto> rsSubmissions) {
        return List.of(tbSubmissions, rsSubmissions).stream()
                .flatMap(List::stream)
                .map(FormSubmissionDto::updatedAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder());
    }

    private void upsertWorkdayAndTb(UUID companyId, FormSubmissionDto sub) {
        EmployeeEntity employee = employeeRepository.findById(sub.employeeId()).orElse(null);
        if (employee == null) {
            log.warn("Skipping TB submission {} for tenant {} because employee {} is missing", sub.id(), companyId, sub.employeeId());
            return;
        }

        WorkdayEntity workday = resolveWorkday(employee, sub.workDate());
        TbEntryEntity tb = tbEntryRepository.findByWorkday(workday).orElseGet(() -> {
            TbEntryEntity entity = new TbEntryEntity();
            entity.setWorkday(workday);
            return entity;
        });

        tb.setSourceSubmissionId(sub.id());
        tb.setStartTime(sub.startTime());
        tb.setEndTime(sub.endTime());
        tb.setBreakMinutes(sub.breakMinutes());
        tb.setTravelMinutes(sub.travelMinutes());
        tb.setLicensePlate(sub.licensePlate());
        tb.setDepartment(sub.department());
        tb.setOvernight(sub.overnight());
        tb.setKmStart(sub.kmStart());
        tb.setKmEnd(sub.kmEnd());
        tb.setComment(sub.comment());
        tb.setExtra(writeJson(sub.extra()));

        tbEntryRepository.save(tb);

        workday.setHasTb(true);
        workdayRepository.save(workday);

        replaceAttachments(workday, sub);
    }

    private void upsertWorkdayAndRs(UUID companyId, FormSubmissionDto sub) {
        EmployeeEntity employee = employeeRepository.findById(sub.employeeId()).orElse(null);
        if (employee == null) {
            log.warn("Skipping RS submission {} for tenant {} because employee {} is missing", sub.id(), companyId, sub.employeeId());
            return;
        }

        WorkdayEntity workday = resolveWorkday(employee, sub.workDate());
        RsEntryEntity rs = rsEntryRepository.findByWorkday(workday).orElseGet(() -> {
            RsEntryEntity entity = new RsEntryEntity();
            entity.setWorkday(workday);
            return entity;
        });

        rs.setSourceSubmissionId(sub.id());
        rs.setCustomerId(sub.customerId());
        rs.setCustomerName(sub.customerName());
        rs.setStartTime(sub.startTime());
        rs.setEndTime(sub.endTime());
        rs.setBreakMinutes(sub.breakMinutes());
        rs.setPositions(writeJsonList(sub.positions()));
        rs.setPdfObjectKey(sub.pdfObjectKey());

        rsEntryRepository.save(rs);

        workday.setHasRs(true);
        workdayRepository.save(workday);

        replaceAttachments(workday, sub);
    }

    private WorkdayEntity resolveWorkday(EmployeeEntity employee, LocalDate workDate) {
        return workdayRepository.findByEmployeeAndWorkDate(employee, workDate).orElseGet(() -> {
            WorkdayEntity workday = new WorkdayEntity();
            workday.setEmployee(employee);
            workday.setWorkDate(workDate);
            workday.setStatus("DRAFT");
            workday.setHasTb(false);
            workday.setHasRs(false);
            workday.setHasStreetwatch(false);
            return workdayRepository.save(workday);
        });
    }

    private void replaceAttachments(WorkdayEntity workday, FormSubmissionDto submission) {
        attachmentRepository.deleteByWorkdayAndSourceSubmissionId(workday, submission.id());
        if (submission.attachments() == null || submission.attachments().isEmpty()) {
            return;
        }

        for (FormSubmissionAttachmentDto attachmentDto : submission.attachments()) {
            AttachmentEntity attachment = new AttachmentEntity();
            attachment.setWorkday(workday);
            attachment.setKind(attachmentDto.kind());
            attachment.setS3Key(attachmentDto.s3Key());
            attachment.setFilename(attachmentDto.filename());
            attachment.setBytes(attachmentDto.bytes());
            attachment.setSourceSubmissionId(submission.id());
            attachmentRepository.save(attachment);
        }
    }

    private String writeJson(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize map to JSON, ignoring extra payload", e);
            return null;
        }
    }

    private String writeJsonList(List<Map<String, Object>> data) {
        if (data == null || data.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize list to JSON, ignoring positions payload", e);
            return null;
        }
    }
}
