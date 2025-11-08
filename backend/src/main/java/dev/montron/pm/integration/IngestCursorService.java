package dev.montron.pm.integration;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class IngestCursorService {

    private final IngestCursorRepository repository;

    public enum Feed {
        EMPLOYEES,
        SUBMISSIONS
    }

    public IngestCursorService(IngestCursorRepository repository) {
        this.repository = repository;
    }

    public Optional<IngestCursorEntity> findForTenantAndFeed(UUID companyId, Feed feed) {
        return repository.findByCompanyIdAndFeed(companyId, feed.name());
    }

    public IngestCursorEntity getOrCreateForTenantAndFeed(UUID companyId, Feed feed) {
        return findForTenantAndFeed(companyId, feed)
                .orElseGet(() -> {
                    IngestCursorEntity entity = new IngestCursorEntity();
                    entity.setFeed(feed.name());
                    entity.setCompanyId(companyId);
                    return repository.save(entity);
                });
    }

    public void updateCursor(IngestCursorEntity cursor, String newCursor, Instant lastRunAt) {
        cursor.setCursor(newCursor);
        cursor.setLastRunAt(lastRunAt);
        repository.save(cursor);
    }
}
