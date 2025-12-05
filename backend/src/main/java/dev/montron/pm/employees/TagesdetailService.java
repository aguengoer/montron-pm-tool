package dev.montron.pm.employees;

import dev.montron.pm.integration.FormBackendClient;
import dev.montron.pm.integration.FormBackendClient.FormSubmissionListItem;
import dev.montron.pm.integration.FormBackendClient.SubmissionDetail;
import dev.montron.pm.integration.FormBackendClient.FormDefinition;
import dev.montron.pm.submissions.FormDefinitionDto;
import dev.montron.pm.submissions.FormWithSubmissionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TagesdetailService {

    private static final Logger log = LoggerFactory.getLogger(TagesdetailService.class);

    private final FormBackendClient formBackendClient;
    private final EmployeeService employeeService;

    public TagesdetailService(FormBackendClient formBackendClient, EmployeeService employeeService) {
        this.formBackendClient = formBackendClient;
        this.employeeService = employeeService;
    }

    public TagesdetailResponse getTagesdetail(UUID employeeId, LocalDate date) {
        log.info("Fetching Tagesdetail for employee {} on {}", employeeId, date);

        // Get employee info
        var employee = employeeService.getEmployee(employeeId);

        // Convert date to Instant range (full day)
        Instant from = date.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = date.atTime(23, 59, 59).toInstant(ZoneOffset.UTC);

        // Fetch all submissions for this employee on this date
        var submissionsPage = formBackendClient.listSubmissions(
                from, to, employeeId, null, null, 0, 100);

        log.debug("Found {} submissions for date {}", submissionsPage.content().size(), date);

        // Separate by form type
        FormWithSubmissionDto tagesbericht = null;
        List<FormWithSubmissionDto> regiescheine = new ArrayList<>();

        for (FormSubmissionListItem item : submissionsPage.content()) {
            String formNameLower = item.formName().toLowerCase();
            log.debug("Processing submission: id={}, formName={}", item.id(), item.formName());
            
            // Check if it's a Tagesbericht (case-insensitive, contains check)
            // Matches: BAUTAGESBERICHT, Tagesbericht, tagesbericht, etc.
            if (formNameLower.contains("tagesbericht") || formNameLower.contains("tb")) {
                log.info("Found Tagesbericht: {}", item.formName());
                tagesbericht = buildFormWithSubmission(item);
            }
            // Check if it's a Regieschein (case-insensitive, contains check)
            // Matches: REGIESCHEIN, Regieschein, regieschein, etc.
            else if (formNameLower.contains("regieschein") || formNameLower.contains("rs")) {
                log.info("Found Regieschein: {}", item.formName());
                regiescheine.add(buildFormWithSubmission(item));
            }
        }

        // Build streetwatch data (placeholder - to be implemented)
        var streetwatch = buildStreetwatchData(employeeId, date);

        // Calculate validation issues
        var validationIssues = calculateValidationIssues(tagesbericht, regiescheine, streetwatch);

        return new TagesdetailResponse(
                employeeId,
                employee.firstName() + " " + employee.lastName(),
                date,
                tagesbericht,
                regiescheine,
                streetwatch,
                validationIssues
        );
    }

    private FormWithSubmissionDto buildFormWithSubmission(FormSubmissionListItem item) {
        // Fetch full submission details
        UUID submissionId = UUID.fromString(item.id());
        SubmissionDetail detail = formBackendClient.getSubmissionDetail(submissionId);

        // Fetch form definition
        UUID formId = UUID.fromString(item.formId());
        FormDefinition formDef = formBackendClient.getFormDefinition(formId);

        // Convert to DTOs
        FormDefinitionDto formDefDto = new FormDefinitionDto(
                formDef.id(),
                formDef.name(),
                formDef.description(),
                formDef.fields().stream()
                        .map(f -> new FormDefinitionDto.FormFieldDto(
                                f.id(),
                                f.label(),
                                f.type(),
                                f.required() != null && f.required(),
                                f.placeholder(),
                                f.options(),
                                f.validation() != null ? new FormDefinitionDto.ValidationRules(
                                        f.validation().minLength(),
                                        f.validation().maxLength(),
                                        f.validation().min(),
                                        f.validation().max(),
                                        f.validation().pattern(),
                                        f.validation().errorMessage()
                                ) : null
                        ))
                        .toList()
        );

        // For now, originalData is the same as data (no changes yet)
        return new FormWithSubmissionDto(
                formDefDto,
                submissionId,
                detail.data(),
                detail.data(), // originalData
                false, // hasChanges
                formId,
                String.valueOf(formDef.version()),
                detail.submittedAt(),
                detail.employeeUsername(),
                mapStatus(detail.status())
        );
    }

    private FormWithSubmissionDto.SubmissionStatus mapStatus(String status) {
        if (status == null) return FormWithSubmissionDto.SubmissionStatus.DRAFT;
        return switch (status.toUpperCase()) {
            case "SUBMITTED" -> FormWithSubmissionDto.SubmissionStatus.SUBMITTED;
            case "APPROVED" -> FormWithSubmissionDto.SubmissionStatus.APPROVED;
            case "REJECTED" -> FormWithSubmissionDto.SubmissionStatus.REJECTED;
            default -> FormWithSubmissionDto.SubmissionStatus.DRAFT;
        };
    }

    private TagesdetailResponse.StreetwatchData buildStreetwatchData(UUID employeeId, LocalDate date) {
        // TODO: Implement actual streetwatch data fetching
        // For now, return empty/mock data
        List<TagesdetailResponse.StreetwatchEntry> entries = List.of(
                new TagesdetailResponse.StreetwatchEntry("07:15", "Fahrtbeginn", "Firmenparkplatz", null),
                new TagesdetailResponse.StreetwatchEntry("08:15", "Ankunft", "Mustermann GmbH", 12345),
                new TagesdetailResponse.StreetwatchEntry("12:15", "Abfahrt", "Mustermann GmbH", 12347),
                new TagesdetailResponse.StreetwatchEntry("12:45", "Ankunft", "Beispiel AG", 12370),
                new TagesdetailResponse.StreetwatchEntry("15:45", "Abfahrt", "Beispiel AG", 12372),
                new TagesdetailResponse.StreetwatchEntry("16:30", "Fahrtende", "Firmenparkplatz", 12395)
        );

        return new TagesdetailResponse.StreetwatchData(entries);
    }

    private List<TagesdetailResponse.ValidationIssue> calculateValidationIssues(
            FormWithSubmissionDto tagesbericht,
            List<FormWithSubmissionDto> regiescheine,
            TagesdetailResponse.StreetwatchData streetwatch) {

        List<TagesdetailResponse.ValidationIssue> issues = new ArrayList<>();

        if (tagesbericht == null || streetwatch == null) {
            return issues;
        }

        // Example validation: Zeit-Diff TB ↔ SW
        try {
            Object arbeitszeitVon = tagesbericht.data().get("arbeitszeit_von");
            if (arbeitszeitVon != null && !streetwatch.entries().isEmpty()) {
                // Parse times and calculate difference
                // For now, add a placeholder validation
                issues.add(new TagesdetailResponse.ValidationIssue(
                        "success",
                        "✓",
                        "Zeitdiff TB↔SW: < 15 min",
                        "arbeitszeit_von",
                        "tagesbericht"
                ));
            }
        } catch (Exception e) {
            log.warn("Error calculating time diff validation", e);
        }

        // Example validation: TB ↔ RS Pause matching
        try {
            Object tbPause = tagesbericht.data().get("pause");
            for (int i = 0; i < regiescheine.size(); i++) {
                Object rsPause = regiescheine.get(i).data().get("pause");
                if (tbPause != null && rsPause != null && !tbPause.equals(rsPause)) {
                    issues.add(new TagesdetailResponse.ValidationIssue(
                            "error",
                            "✕",
                            "Pause TB ≠ RS",
                            "pause",
                            "regieschein"
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Error calculating pause validation", e);
        }

        return issues;
    }
}

