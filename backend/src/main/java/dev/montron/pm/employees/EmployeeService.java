package dev.montron.pm.employees;

import dev.montron.pm.integration.FormBackendClient;
import dev.montron.pm.integration.FormBackendClient.FormEmployeeCreateRequest;
import dev.montron.pm.integration.FormBackendClient.FormEmployeePage;
import dev.montron.pm.integration.FormBackendClient.FormEmployeeResponse;
import dev.montron.pm.integration.FormBackendClient.FormEmployeeUpdateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class EmployeeService {

    private final FormBackendClient formBackendClient;

    public EmployeeService(FormBackendClient formBackendClient) {
        this.formBackendClient = formBackendClient;
    }

    public EmployeePageResponse listEmployees(int page, int size, String q, String department, String status) {
        // Proxy request directly to form builder backend
        FormEmployeePage formPage = formBackendClient.listEmployees(page, size, q, status);
        
        // Map form builder response to PM tool format
        List<EmployeeDto> content = formPage.content().stream()
                .map(this::toDto)
                .toList();

        return new EmployeePageResponse(
                content,
                formPage.page(),
                formPage.size(),
                formPage.totalElements(),
                formPage.totalPages());
    }

    public EmployeeDto getEmployee(UUID id) {
        // Fetch directly from form builder backend
        FormEmployeeResponse response = formBackendClient.getEmployee(id);
        return toDto(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public EmployeeDto createEmployee(EmployeeCreateRequest request) {
        FormEmployeeCreateRequest formRequest = new FormEmployeeCreateRequest(
                request.username(),
                request.firstName(),
                request.lastName(),
                request.department(),
                request.status());

        FormEmployeeResponse response = formBackendClient.createEmployeeInFormBackend(formRequest);
        return toDto(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public EmployeeDto updateEmployee(UUID id, EmployeeUpdateRequest request) {
        FormEmployeeUpdateRequest formRequest = new FormEmployeeUpdateRequest(
                request.firstName(),
                request.lastName(),
                request.department(),
                request.status());

        FormEmployeeResponse response = formBackendClient.updateEmployeeInFormBackend(id, formRequest);
        return toDto(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void activateEmployee(UUID id) {
        formBackendClient.activateEmployeeInFormBackend(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deactivateEmployee(UUID id) {
        formBackendClient.deactivateEmployeeInFormBackend(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void resetPassword(UUID id) {
        formBackendClient.resetPasswordInFormBackend(id);
    }

    private EmployeeDto toDto(FormEmployeeResponse response) {
        return new EmployeeDto(
                UUID.fromString(response.id()),
                response.username(),
                response.firstName(),
                response.lastName(),
                response.team(), // Map 'team' from form builder to 'department' in PM tool
                response.status());
    }
}
