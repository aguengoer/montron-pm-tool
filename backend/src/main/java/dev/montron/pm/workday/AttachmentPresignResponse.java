package dev.montron.pm.workday;

import java.util.Map;
import java.util.UUID;

public record AttachmentPresignResponse(Map<UUID, String> urls) {
}
