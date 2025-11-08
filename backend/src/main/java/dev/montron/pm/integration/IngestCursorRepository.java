package dev.montron.pm.integration;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IngestCursorRepository extends JpaRepository<IngestCursorEntity, UUID> {
}
