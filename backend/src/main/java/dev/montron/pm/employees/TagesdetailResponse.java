package dev.montron.pm.employees;

import dev.montron.pm.submissions.FormWithSubmissionDto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Complete data for the Tagesdetail view (3-column layout).
 * Contains Tagesbericht, Regiescheine, and Streetwatch data.
 */
public record TagesdetailResponse(
        // Employee info
        UUID employeeId,
        String employeeName,
        LocalDate date,
        
        // Column 1: Tagesbericht (dynamic form)
        FormWithSubmissionDto tagesbericht,
        
        // Column 2: Regiescheine (list of dynamic forms)
        List<FormWithSubmissionDto> regiescheine,
        
        // Column 3: Streetwatch (read-only data)
        StreetwatchData streetwatch,
        
        // Validation issues
        List<ValidationIssue> validationIssues
) {
    public record StreetwatchData(
            List<StreetwatchEntry> entries
    ) {}
    
    public record StreetwatchEntry(
            String zeit,
            String ereignis,
            String ort,
            Integer kilometerstand
    ) {}
    
    public record ValidationIssue(
            String type,        // success, warning, error
            String icon,        // ✓, !, ✕
            String message,
            String fieldId,     // For scrolling to field
            String formType     // tagesbericht, regieschein
    ) {}
}

