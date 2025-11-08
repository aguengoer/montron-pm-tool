package dev.montron.pm.employees;

import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import dev.montron.pm.integration.FormBackendClient;
import dev.montron.pm.integration.FormBackendClient.FormEmployeeCreateRequest;
import dev.montron.pm.integration.FormBackendClient.FormEmployeeUpdateRequest;
import dev.montron.pm.integration.FormEmployeeDto;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final FormBackendClient formBackendClient;
    private final CurrentUserService currentUserService;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            FormBackendClient formBackendClient,
            CurrentUserService currentUserService) {
        this.employeeRepository = employeeRepository;
        this.formBackendClient = formBackendClient;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public EmployeePageResponse listEmployees(int page, int size, String q, String department, String status) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        String normalizedStatus = StringUtils.hasText(status) ? status.trim().toUpperCase(Locale.ROOT) : null;
        String normalizedDepartment = StringUtils.hasText(department) ? department.trim() : null;
        String normalizedQuery = StringUtils.hasText(q) ? q.trim() : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()));

        Page<EmployeeEntity> result = employeeRepository.search(
                companyId,
                normalizedStatus,
                normalizedQuery,
                normalizedDepartment,
                pageable);

        List<EmployeeDto> content = result.getContent().stream()
                .map(this::toDto)
                .toList();

        return new EmployeePageResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployee(UUID id) {
        EmployeeEntity entity = requireEmployeeForTenant(id);
        return toDto(entity);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public EmployeeDto createEmployee(EmployeeCreateRequest request) {
        FormEmployeeCreateRequest formRequest = new FormEmployeeCreateRequest(
                request.username(),
                request.firstName(),
                request.lastName(),
                request.department(),
                request.status());

        FormEmployeeDto remote = formBackendClient.createEmployeeInFormBackend(formRequest);
        return upsertMirrorFromRemote(remote);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public EmployeeDto updateEmployee(UUID id, EmployeeUpdateRequest request) {
        requireEmployeeForTenant(id);

        FormEmployeeUpdateRequest formRequest = new FormEmployeeUpdateRequest(
                request.firstName(),
                request.lastName(),
                request.department(),
                request.status());

        FormEmployeeDto remote = formBackendClient.updateEmployeeInFormBackend(id, formRequest);
        return upsertMirrorFromRemote(remote);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void activateEmployee(UUID id) {
        EmployeeEntity entity = requireEmployeeForTenant(id);
        formBackendClient.activateEmployeeInFormBackend(id);
        entity.setStatus("ACTIVE");
        employeeRepository.save(entity);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivateEmployee(UUID id) {
        EmployeeEntity entity = requireEmployeeForTenant(id);
        formBackendClient.deactivateEmployeeInFormBackend(id);
        entity.setStatus("INACTIVE");
        employeeRepository.save(entity);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void resetPassword(UUID id) {
        requireEmployeeForTenant(id);
        formBackendClient.resetPasswordInFormBackend(id);
    }

    private EmployeeDto upsertMirrorFromRemote(FormEmployeeDto remote) {
        Objects.requireNonNull(remote, "Remote employee must not be null");
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        EmployeeEntity entity = employeeRepository.findById(remote.id())
                .orElseGet(() -> {
                    EmployeeEntity e = new EmployeeEntity();
                    e.setId(remote.id());
                    e.setCompanyId(companyId);
                    return e;
                });

        entity.setUsername(remote.username());
        entity.setFirstName(remote.firstName());
        entity.setLastName(remote.lastName());
        entity.setDepartment(remote.department());
        entity.setStatus(remote.status());
        entity.setEtag(remote.etag());

        EmployeeEntity saved = employeeRepository.save(entity);
        return toDto(saved);
    }

    private EmployeeEntity requireEmployeeForTenant(UUID id) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();
        return employeeRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
    }

    private EmployeeDto toDto(EmployeeEntity entity) {
        return new EmployeeDto(
                entity.getId(),
                entity.getUsername(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getDepartment(),
                entity.getStatus());
    }
}
