package dev.montron.pm.employees;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasRole('ADMIN')")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final TagesdetailService tagesdetailService;

    public EmployeeController(EmployeeService employeeService, TagesdetailService tagesdetailService) {
        this.employeeService = employeeService;
        this.tagesdetailService = tagesdetailService;
    }

    @GetMapping
    public EmployeePageResponse list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status) {
        return employeeService.listEmployees(page, size, q, department, status);
    }

    @GetMapping("/{id}")
    public EmployeeDto get(@PathVariable UUID id) {
        return employeeService.getEmployee(id);
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> create(@Valid @RequestBody EmployeeCreateRequest request) {
        EmployeeDto created = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public EmployeeDto update(@PathVariable UUID id, @Valid @RequestBody EmployeeUpdateRequest request) {
        return employeeService.updateEmployee(id, request);
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable UUID id) {
        employeeService.activateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable UUID id) {
        employeeService.resetPassword(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get complete Tagesdetail view data (3-column layout)
     * GET /api/employees/{employeeId}/tagesdetail/{date}
     */
    @GetMapping("/{employeeId}/tagesdetail/{date}")
    public TagesdetailResponse getTagesdetail(
            @PathVariable UUID employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return tagesdetailService.getTagesdetail(employeeId, date);
    }
}
