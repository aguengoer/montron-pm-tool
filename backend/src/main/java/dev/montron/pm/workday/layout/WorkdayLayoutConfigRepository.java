package dev.montron.pm.workday.layout;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkdayLayoutConfigRepository extends JpaRepository<WorkdayLayoutConfigEntity, UUID> {
}
