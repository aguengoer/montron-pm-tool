package dev.montron.pm.workday;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@PreAuthorize("hasRole('ADMIN')")
public class WorkdayController {

    private final WorkdayService workdayService;

    public WorkdayController(WorkdayService workdayService) {
        this.workdayService = workdayService;
    }

    @GetMapping("/api/employees/{employeeId}/workdays")
    public List<WorkdaySummaryDto> listForEmployee(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        return workdayService.getWorkdaysForEmployee(employeeId, from, to);
    }

    @GetMapping("/api/workdays/{id}")
    public WorkdayDetailDto getDetail(@PathVariable UUID id) {
        return workdayService.getWorkdayDetail(id);
    }
}
