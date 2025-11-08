package dev.montron.pm.workday.layout;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workday-layout")
@PreAuthorize("hasRole('ADMIN')")
public class WorkdayLayoutController {

    private final WorkdayLayoutService workdayLayoutService;

    public WorkdayLayoutController(WorkdayLayoutService workdayLayoutService) {
        this.workdayLayoutService = workdayLayoutService;
    }

    @GetMapping
    public WorkdayLayoutResponse getLayout() {
        return workdayLayoutService.getCurrentLayout();
    }

    @PutMapping
    public WorkdayLayoutResponse updateLayout(@RequestBody WorkdayLayoutPayload payload) {
        return workdayLayoutService.upsertLayout(payload);
    }
}
