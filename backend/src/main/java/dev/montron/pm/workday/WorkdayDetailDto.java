package dev.montron.pm.workday;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record WorkdayDetailDto(
        UUID id,
        LocalDate date,
        String status,
        WorkdayEmployeeDto employee,
        TbDto tb,
        RsDto rs,
        StreetwatchDto streetwatch,
        List<AttachmentDto> attachments,
        List<ValidationIssueDto> validationIssues) {
}
