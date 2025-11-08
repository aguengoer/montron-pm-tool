package dev.montron.pm.workday;

public record RsPositionDto(
        String code,
        String description,
        Double hours,
        Double quantity,
        String unit,
        Double pricePerUnit) {
}
