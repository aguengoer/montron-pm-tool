package dev.montron.pm.employees;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final FormBackendClient formBackendClient;
    private final EmployeeService employeeService;
    private final dev.montron.pm.submissions.SubmissionService submissionService;

    public TagesdetailService(
            FormBackendClient formBackendClient, 
            EmployeeService employeeService,
            dev.montron.pm.submissions.SubmissionService submissionService) {
        this.formBackendClient = formBackendClient;
        this.employeeService = employeeService;
        this.submissionService = submissionService;
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
        List<FormWithSubmissionDto> tagesberichte = new ArrayList<>();
        List<FormWithSubmissionDto> regiescheine = new ArrayList<>();

        for (FormSubmissionListItem item : submissionsPage.content()) {
            String formNameLower = item.formName().toLowerCase();
            log.debug("Processing submission: id={}, formName={}", item.id(), item.formName());
            
            // Check if it's a Tagesbericht (case-insensitive, contains check)
            // Matches: BAUTAGESBERICHT, Tagesbericht, tagesbericht, etc.
            if (formNameLower.contains("tagesbericht") || formNameLower.contains("tb")) {
                log.info("Found Tagesbericht: {}", item.formName());
                tagesberichte.add(buildFormWithSubmission(item));
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
        var validationIssues = calculateValidationIssues(tagesberichte, regiescheine, streetwatch);

        return new TagesdetailResponse(
                employeeId,
                employee.firstName() + " " + employee.lastName(),
                date,
                tagesberichte,
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

        // Extract fields from UI_FORM_JSON_START if present, otherwise use outer fields
        List<FormBackendClient.FormField> fieldsToUse = extractFieldsFromDescription(formDef);
        if (fieldsToUse.isEmpty()) {
            log.warn("No fields found in UI_FORM_JSON_START for form {}, using outer fields", formDef.id());
            fieldsToUse = formDef.fields();
        } else {
            log.debug("Using {} fields from UI_FORM_JSON_START for form {}", fieldsToUse.size(), formDef.id());
        }

        // Convert to DTOs
        FormDefinitionDto formDefDto = new FormDefinitionDto(
                formDef.id(),
                formDef.name(),
                formDef.description(),
                fieldsToUse.stream()
                        .map(f -> new FormDefinitionDto.FormFieldDto(
                                f.id(),
                                f.label(),
                                f.type(),
                                f.required() != null && f.required(),
                                f.placeholder(),
                                convertOptionsToStringList(f.options()),
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

        // Get corrections from PM tool database
        Map<String, Object> corrections = submissionService.getCorrections(submissionId);
        
        // Convert JsonNode data to Map<String, Object>
        Map<String, Object> dataMap = new HashMap<>();
        if (detail.data() != null && detail.data().isObject()) {
            detail.data().fieldNames().forEachRemaining(key -> {
                JsonNode valueNode = detail.data().get(key);
                // Convert JsonNode to appropriate Java type
                Object value;
                if (valueNode.isTextual()) {
                    value = valueNode.asText();
                } else if (valueNode.isNumber()) {
                    if (valueNode.isInt()) {
                        value = valueNode.asInt();
                    } else if (valueNode.isLong()) {
                        value = valueNode.asLong();
                    } else {
                        value = valueNode.asDouble();
                    }
                } else if (valueNode.isBoolean()) {
                    value = valueNode.asBoolean();
                } else if (valueNode.isNull()) {
                    value = null;
                } else if (valueNode.isArray()) {
                    // Convert array to List<Object>
                    List<Object> list = new ArrayList<>();
                    for (JsonNode arrayItem : valueNode) {
                        if (arrayItem.isTextual()) {
                            list.add(arrayItem.asText());
                        } else if (arrayItem.isNumber()) {
                            list.add(arrayItem.asDouble());
                        } else if (arrayItem.isBoolean()) {
                            list.add(arrayItem.asBoolean());
                        } else if (arrayItem.isObject()) {
                            // For complex objects in array, convert to Map
                            Map<String, Object> objectMap = new HashMap<>();
                            arrayItem.fieldNames().forEachRemaining(objKey -> {
                                JsonNode objValue = arrayItem.get(objKey);
                                if (objValue.isTextual()) {
                                    objectMap.put(objKey, objValue.asText());
                                } else if (objValue.isNumber()) {
                                    objectMap.put(objKey, objValue.asDouble());
                                } else {
                                    objectMap.put(objKey, objValue.toString());
                                }
                            });
                            list.add(objectMap);
                        }
                    }
                    value = list;
                } else {
                    // For complex types, keep as JsonNode or convert to String
                    value = valueNode.toString();
                }
                dataMap.put(key, value);
            });
        }
        
        // Merge corrections into displayed data
        Map<String, Object> displayedData = new HashMap<>(dataMap);
        displayedData.putAll(corrections); // Overwrite with corrections
        
        boolean hasChanges = !corrections.isEmpty();
        
        // Get latest PDF URL (corrected version if exists, otherwise original)
        String latestPdfUrl = submissionService.getLatestPdfUrl(submissionId, detail.pdfUrl());
        
        log.debug("Submission {} - Form: {}, PDF URL: {}", submissionId, formDef.name(), latestPdfUrl);
        log.debug("Submission {} - Data keys: {}", submissionId, dataMap.keySet());
        log.debug("Submission {} - Field IDs: {}", submissionId, formDef.fields().stream().map(f -> f.id()).toList());
        
        // Check for field ID mismatches
        Set<String> fieldIds = formDef.fields().stream().map(f -> f.id()).collect(java.util.stream.Collectors.toSet());
        Set<String> dataKeys = new HashSet<>(dataMap.keySet());
        
        // Find fields without data
        List<String> missingInData = formDef.fields().stream()
                .filter(f -> !dataKeys.contains(f.id()))
                .map(f -> f.id() + " (" + f.label() + ")")
                .toList();
        if (!missingInData.isEmpty()) {
            log.warn("Submission {} - Fields without data: {}", submissionId, missingInData);
        }
        
        // Find data keys without fields
        List<String> extraInData = dataKeys.stream()
                .filter(k -> !fieldIds.contains(k))
                .toList();
        if (!extraInData.isEmpty()) {
            log.warn("Submission {} - Data keys without fields: {}", submissionId, extraInData);
        }
        
        return new FormWithSubmissionDto(
                formDefDto,
                submissionId,
                displayedData, // Displayed data (original + corrections)
                dataMap, // Original data from mobile app (unchanged, converted from JsonNode)
                hasChanges,
                formId,
                String.valueOf(formDef.version()),
                detail.submittedAt(),
                detail.employeeUsername(),
                mapStatus(detail.status()),
                latestPdfUrl // Latest PDF URL (corrected version or original)
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
            List<FormWithSubmissionDto> tagesberichte,
            List<FormWithSubmissionDto> regiescheine,
            TagesdetailResponse.StreetwatchData streetwatch) {

        List<TagesdetailResponse.ValidationIssue> issues = new ArrayList<>();

        if (tagesberichte.isEmpty() || streetwatch == null) {
            return issues;
        }

        // Example validation: Zeit-Diff TB ↔ SW (check first Tagesbericht)
        try {
            FormWithSubmissionDto firstTb = tagesberichte.get(0);
            Object arbeitszeitVon = firstTb.data().get("arbeitszeit_von");
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

        // Example validation: TB ↔ RS Pause matching (check all Tagesberichte)
        try {
            for (FormWithSubmissionDto tagesbericht : tagesberichte) {
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
            }
        } catch (Exception e) {
            log.warn("Error calculating pause validation", e);
        }

        return issues;
    }

    /**
     * Extract field definitions from UI_FORM_JSON_START in the description.
     * The mobile backend embeds the actual form structure in the description between 
     * UI_FORM_JSON_START and UI_FORM_JSON_END markers.
     */
    private List<FormBackendClient.FormField> extractFieldsFromDescription(FormDefinition formDef) {
        String description = formDef.description();
        if (description == null || description.isBlank()) {
            return List.of();
        }

        try {
            // Find the JSON between <!--UI_FORM_JSON_START--> and <!--UI_FORM_JSON_END-->
            String startMarker = "<!--UI_FORM_JSON_START-->";
            String endMarker = "<!--UI_FORM_JSON_END-->";
            int startIdx = description.indexOf(startMarker);
            int endIdx = description.indexOf(endMarker);
            
            if (startIdx == -1 || endIdx == -1 || startIdx >= endIdx) {
                log.debug("No UI_FORM_JSON_START/END markers found in description for form {}", formDef.id());
                return List.of();
            }

            // Extract the JSON string
            String jsonStr = description.substring(startIdx + startMarker.length(), endIdx).trim();
            
            log.debug("Extracted UI_FORM_JSON string (first 200 chars): {}", 
                    jsonStr.length() > 200 ? jsonStr.substring(0, 200) + "..." : jsonStr);
            
            // Parse the JSON
            JsonNode uiFormJson = objectMapper.readTree(jsonStr);
            JsonNode fieldsNode = uiFormJson.get("fields");
            
            if (fieldsNode == null || !fieldsNode.isArray()) {
                log.warn("No fields array found in UI_FORM_JSON for form {}", formDef.id());
                return List.of();
            }

            // Convert JSON fields to FormField objects
            List<FormBackendClient.FormField> fields = new ArrayList<>();
            for (JsonNode fieldNode : fieldsNode) {
                try {
                    FormBackendClient.FormField field = objectMapper.treeToValue(fieldNode, FormBackendClient.FormField.class);
                    fields.add(field);
                } catch (Exception e) {
                    log.warn("Failed to parse field from UI_FORM_JSON: {}", fieldNode, e);
                }
            }

            log.info("Extracted {} fields from UI_FORM_JSON for form {}", fields.size(), formDef.id());
            return fields;
            
        } catch (Exception e) {
            log.error("Error extracting fields from UI_FORM_JSON for form {}", formDef.id(), e);
            return List.of();
        }
    }

    /**
     * Convert JsonNode options to List<String>
     * Supports both formats:
     * - Array of strings: ["option1", "option2"]
     * - Array of objects: [{"value":"option1","label":"Option 1"}, {"value":"option2","label":"Option 2"}]
     */
    private List<String> convertOptionsToStringList(JsonNode options) {
        if (options == null || options.isNull() || !options.isArray()) {
            return null;
        }

        List<String> result = new ArrayList<>();
        for (JsonNode option : options) {
            if (option.isTextual()) {
                // Simple string value
                result.add(option.asText());
            } else if (option.isObject()) {
                // Object with value/label - extract value
                if (option.has("value")) {
                    result.add(option.get("value").asText());
                } else if (option.has("label")) {
                    // Fallback: use label if value not present
                    result.add(option.get("label").asText());
                }
            }
        }
        return result.isEmpty() ? null : result;
    }
}

