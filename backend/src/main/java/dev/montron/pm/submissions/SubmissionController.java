package dev.montron.pm.submissions;

import dev.montron.pm.integration.FormBackendClient;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/submissions")
@PreAuthorize("hasRole('ADMIN')")
public class SubmissionController {

    private final SubmissionService submissionService;
    private final FormBackendClient formBackendClient;

    public SubmissionController(SubmissionService submissionService, FormBackendClient formBackendClient) {
        this.submissionService = submissionService;
        this.formBackendClient = formBackendClient;
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

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateSubmission(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> fieldUpdates) {
        
        // Save corrections in PM tool database (NOT in mobile app!)
        submissionService.saveFieldCorrections(id, fieldUpdates);
        return ResponseEntity.ok(Map.of("success", true, "updatedFields", fieldUpdates.size()));
    }
}
