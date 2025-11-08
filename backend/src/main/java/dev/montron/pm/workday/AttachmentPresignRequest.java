package dev.montron.pm.workday;

import java.util.List;
import java.util.UUID;

public record AttachmentPresignRequest(List<UUID> attachmentIds) {
}
