package dev.montron.pm.submissions;

import java.time.Instant;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/submissions")
@PreAuthorize("hasRole('ADMIN')")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping
    public SubmissionPageResponse list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) UUID formId,
            @RequestParam(required = false) Boolean hasAttachments,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return submissionService.listSubmissions(
                from, to, employeeId, formId, hasAttachments, page, size);
    }

    @GetMapping("/by-date")
    public SubmissionPageResponse listByDate(
            @RequestParam UUID employeeId,
            @RequestParam String date) {
        
        return submissionService.listSubmissionsByDate(employeeId, date);
    }
}
