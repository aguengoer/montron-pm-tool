package dev.montron.pm.integration;

import dev.montron.pm.employees.EmployeeIngestService;
import dev.montron.pm.workday.SubmissionIngestService;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class IngestScheduler {

    private static final Logger log = LoggerFactory.getLogger(IngestScheduler.class);

    private final EmployeeIngestService employeeIngestService;
    private final SubmissionIngestService submissionIngestService;

    public IngestScheduler(
            EmployeeIngestService employeeIngestService,
            SubmissionIngestService submissionIngestService) {
        this.employeeIngestService = employeeIngestService;
        this.submissionIngestService = submissionIngestService;
    }

    // TODO: Replace with actual tenant resolution (e.g., dedicated tenant repository or configuration)
    private List<UUID> resolveTenants() {
        return List.of();
    }

    @Scheduled(fixedDelayString = "${pm.ingest.fixed-delay:300000}")
    public void runIngest() {
        List<UUID> tenants = resolveTenants();
        if (tenants.isEmpty()) {
            log.debug("No tenants configured for ingest yet");
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(7); // TODO: make configurable

        for (UUID companyId : tenants) {
            try {
                employeeIngestService.ingestEmployeesForTenant(companyId);
                submissionIngestService.ingestSubmissionsForTenant(companyId, from, today);
            } catch (Exception ex) {
                log.warn("Ingest failed for tenant {}", companyId, ex);
            }
        }
    }
}
