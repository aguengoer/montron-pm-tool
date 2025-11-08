package dev.montron.pm.workday;

import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import dev.montron.pm.employees.EmployeeEntity;
import dev.montron.pm.pdf.PdfService;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkdayPdfService {

    private final CurrentUserService currentUserService;
    private final WorkdayRepository workdayRepository;
    private final TbEntryRepository tbEntryRepository;
    private final RsEntryRepository rsEntryRepository;
    private final PdfService pdfService;

    public WorkdayPdfService(
            CurrentUserService currentUserService,
            WorkdayRepository workdayRepository,
            TbEntryRepository tbEntryRepository,
            RsEntryRepository rsEntryRepository,
            PdfService pdfService) {
        this.currentUserService = currentUserService;
        this.workdayRepository = workdayRepository;
        this.tbEntryRepository = tbEntryRepository;
        this.rsEntryRepository = rsEntryRepository;
        this.pdfService = pdfService;
    }

    @Transactional(readOnly = true)
    public byte[] generateTbPdfForWorkday(UUID workdayId) {
        WorkdayEntity workday = loadWorkdayForCurrentTenant(workdayId);
        TbEntryEntity tb = tbEntryRepository.findByWorkday(workday)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TB entry not found"));
        EmployeeEntity employee = workday.getEmployee();
        return pdfService.generateTbPdf(workday, tb, employee);
    }

    @Transactional(readOnly = true)
    public byte[] generateRsPdfForWorkday(UUID workdayId) {
        WorkdayEntity workday = loadWorkdayForCurrentTenant(workdayId);
        RsEntryEntity rs = rsEntryRepository.findByWorkday(workday)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RS entry not found"));
        EmployeeEntity employee = workday.getEmployee();
        return pdfService.generateRsPdf(workday, rs, employee);
    }

    private WorkdayEntity loadWorkdayForCurrentTenant(UUID workdayId) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();
        return workdayRepository.findByIdAndCompanyId(workdayId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workday not found"));
    }
}
