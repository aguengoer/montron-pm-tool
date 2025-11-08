package dev.montron.pm.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FormSubmissionDto(
        UUID id,
        UUID employeeId,
        LocalDate workDate,
        SubmissionDocumentType documentType,
        LocalTime startTime,
        LocalTime endTime,
        Integer breakMinutes,
        Integer travelMinutes,
        String licensePlate,
        String department,
        Boolean overnight,
        Integer kmStart,
        Integer kmEnd,
        String comment,
        String customerId,
        String customerName,
        List<Map<String, Object>> positions,
        String pdfObjectKey,
        Map<String, Object> extra,
        List<FormSubmissionAttachmentDto> attachments,
        Instant updatedAt) {
}
