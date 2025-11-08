package dev.montron.pm.workday;

import jakarta.validation.constraints.NotBlank;

public record ReleaseRequest(
        @NotBlank String pin,
        Boolean forceRelease,
        String overrideReason) {
}
