package dev.montron.pm.workday.layout;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkdayLayoutService {

    private static final String DEFAULT_NAME = "default";

    private final WorkdayLayoutConfigRepository repository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public WorkdayLayoutService(
            WorkdayLayoutConfigRepository repository,
            CurrentUserService currentUserService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public WorkdayLayoutResponse getCurrentLayout() {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        WorkdayLayoutConfigEntity entity = repository.findByCompanyIdAndName(companyId, DEFAULT_NAME)
                .orElseGet(() -> createDefaultInMemory(companyId));

        return new WorkdayLayoutResponse(
                entity.getName(),
                entity.getDocumentTypeTb(),
                entity.getDocumentTypeRs(),
                parseConfig(entity.getConfig()));
    }

    @Transactional
    public WorkdayLayoutResponse upsertLayout(WorkdayLayoutPayload payload) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        validatePayload(payload);

        WorkdayLayoutConfigEntity entity = repository.findByCompanyIdAndName(companyId, DEFAULT_NAME)
                .orElseGet(() -> {
                    WorkdayLayoutConfigEntity e = new WorkdayLayoutConfigEntity();
                    e.setCompanyId(companyId);
                    e.setName(DEFAULT_NAME);
                    return e;
                });

        entity.setDocumentTypeTb(payload.documentTypeTb());
        entity.setDocumentTypeRs(payload.documentTypeRs());
        entity.setConfig(writeConfig(payload.config()));

        WorkdayLayoutConfigEntity saved = repository.save(entity);

        return new WorkdayLayoutResponse(
                saved.getName(),
                saved.getDocumentTypeTb(),
                saved.getDocumentTypeRs(),
                parseConfig(saved.getConfig()));
    }

    private WorkdayLayoutConfigEntity createDefaultInMemory(UUID companyId) {
        WorkdayLayoutConfigEntity entity = new WorkdayLayoutConfigEntity();
        entity.setCompanyId(companyId);
        entity.setName(DEFAULT_NAME);
        entity.setDocumentTypeTb("BAUTAGESBERICHT");
        entity.setDocumentTypeRs("REGIESCHEIN");

        Map<String, Object> defaultConfig = Map.of(
                "tbFields", List.of(
                        Map.of("key", "startTime", "label", "Start", "editorType", "time15", "order", 1),
                        Map.of("key", "endTime", "label", "End", "editorType", "time15", "order", 2),
                        Map.of("key", "breakMinutes", "label", "Break", "editorType", "number", "order", 3),
                        Map.of("key", "licensePlate", "label", "License", "editorType", "text", "order", 4)
                ),
                "rsFields", List.of(
                        Map.of("key", "customerName", "label", "Customer", "editorType", "text", "order", 1),
                        Map.of("key", "startTime", "label", "Start", "editorType", "time15", "order", 2),
                        Map.of("key", "endTime", "label", "End", "editorType", "time15", "order", 3),
                        Map.of("key", "breakMinutes", "label", "Break", "editorType", "number", "order", 4)
                ),
                "streetwatchColumns", List.of(
                        Map.of("key", "time", "label", "Time", "order", 1),
                        Map.of("key", "km", "label", "Km", "order", 2)
                )
        );

        entity.setConfig(writeConfig(defaultConfig));
        return entity;
    }

    private void validatePayload(WorkdayLayoutPayload payload) {
        if (payload.documentTypeTb() == null || payload.documentTypeTb().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "documentTypeTb is required");
        }
        if (payload.documentTypeRs() == null || payload.documentTypeRs().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "documentTypeRs is required");
        }
        Map<String, Object> cfg = payload.config();
        if (cfg == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "config is required");
        }
        if (!cfg.containsKey("tbFields") || !cfg.containsKey("rsFields") || !cfg.containsKey("streetwatchColumns")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "config must contain tbFields, rsFields and streetwatchColumns");
        }
    }

    private Map<String, Object> parseConfig(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private String writeConfig(Map<String, Object> config) {
        try {
            return objectMapper.writeValueAsString(config != null ? config : Map.of());
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid layout config JSON", e);
        }
    }
}
