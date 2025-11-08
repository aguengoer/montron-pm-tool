package dev.montron.pm.workday;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StreetwatchDayRepository extends JpaRepository<StreetwatchDayEntity, UUID> {

    Optional<StreetwatchDayEntity> findByWorkday(WorkdayEntity workday);
}
