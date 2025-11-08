package dev.montron.pm.workday;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkdayRepository extends JpaRepository<WorkdayEntity, UUID> {
}
