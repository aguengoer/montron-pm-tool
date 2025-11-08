package dev.montron.pm.workday.validation;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ValidationIssueRepository extends JpaRepository<ValidationIssueEntity, UUID> {
}
