package dev.montron.pm.submissions;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Form definition from the mobile form builder.
 * Describes the structure of a form (fields, types, labels, etc.)
 */
public record FormDefinitionDto(
        String id,
        String name,
        String description,
        List<FormFieldDto> fields
) {
    public record FormFieldDto(
            String id,
            String label,
            String type,  // TEXT, NUMBER, DATE, TIME, DROPDOWN, CHECKBOX, FILE, etc.
            boolean required,
            String placeholder,
            List<String> options,  // For DROPDOWN
            ValidationRules validation
    ) {}

    public record ValidationRules(
            Integer minLength,
            Integer maxLength,
            Integer min,
            Integer max,
            String pattern,
            String errorMessage
    ) {}
}

