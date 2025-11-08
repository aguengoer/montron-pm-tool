package dev.montron.pm.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditEntryRepository auditEntryRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public AuditService(
            AuditEntryRepository auditEntryRepository,
            CurrentUserService currentUserService,
            ObjectMapper objectMapper) {
        this.auditEntryRepository = auditEntryRepository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    public void auditChange(String entityType, UUID entityId, String field, Object oldValue, Object newValue) {
        if (Objects.equals(oldValue, newValue)) {
            return;
        }

        CurrentUser user = currentUserService.getCurrentUser();

        AuditEntryEntity entry = new AuditEntryEntity();
        entry.setEntity(entityType);
        entry.setEntityId(entityId);
        entry.setField(field);
        entry.setUserId(user.userId());
        entry.setAt(Instant.now());
        entry.setOldValue(writeValue(oldValue));
        entry.setNewValue(writeValue(newValue));

        auditEntryRepository.save(entry);
    }

    private String writeValue(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "\"" + value + "\"";
        }
    }
}
