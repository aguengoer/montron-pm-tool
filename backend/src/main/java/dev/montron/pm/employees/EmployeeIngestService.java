package dev.montron.pm.employees;

import dev.montron.pm.common.TenantContext;
import dev.montron.pm.integration.FormBackendClient;
import dev.montron.pm.integration.FormEmployeeDto;
import dev.montron.pm.integration.IngestCursorEntity;
import dev.montron.pm.integration.IngestCursorService;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeIngestService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeIngestService.class);

    private final FormBackendClient formBackendClient;
    private final EmployeeRepository employeeRepository;
    private final IngestCursorService ingestCursorService;

    public EmployeeIngestService(
            FormBackendClient formBackendClient,
            EmployeeRepository employeeRepository,
            IngestCursorService ingestCursorService) {
        this.formBackendClient = formBackendClient;
        this.employeeRepository = employeeRepository;
        this.ingestCursorService = ingestCursorService;
    }

    @Transactional
    public void ingestEmployeesForTenant(UUID companyId) {
        TenantContext.setCompanyId(companyId);
        try {
            IngestCursorEntity cursor = ingestCursorService.getOrCreateForTenantAndFeed(
                    companyId, IngestCursorService.Feed.EMPLOYEES);

            Instant updatedAfter = null;
            if (cursor.getCursor() != null) {
                try {
                    updatedAfter = Instant.parse(cursor.getCursor());
                } catch (Exception ex) {
                    log.warn("Invalid cursor '{}' for tenant {}. Resetting.", cursor.getCursor(), companyId);
                }
            }

            List<FormEmployeeDto> remoteEmployees = formBackendClient.fetchEmployeesIntegration(updatedAfter);

            for (FormEmployeeDto remote : remoteEmployees) {
                EmployeeEntity entity = employeeRepository.findById(remote.id())
                        .orElseGet(() -> {
                            EmployeeEntity created = new EmployeeEntity();
                            created.setId(remote.id());
                            created.setCompanyId(companyId);
                            return created;
                        });

                entity.setUsername(remote.username());
                entity.setFirstName(remote.firstName());
                entity.setLastName(remote.lastName());
                entity.setDepartment(remote.department());
                entity.setStatus(remote.status());
                entity.setEtag(remote.etag());

                employeeRepository.save(entity);
            }

            Instant cursorValue = remoteEmployees.stream()
                    .map(FormEmployeeDto::updatedAt)
                    .filter(Objects::nonNull)
                    .max(Instant::compareTo)
                    .orElseGet(Instant::now);
            ingestCursorService.updateCursor(cursor, cursorValue.toString(), Instant.now());
        } finally {
            TenantContext.clear();
        }
    }
}
