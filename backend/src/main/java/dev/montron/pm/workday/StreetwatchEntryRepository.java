package dev.montron.pm.workday;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StreetwatchEntryRepository extends JpaRepository<StreetwatchEntryEntity, UUID> {

    List<StreetwatchEntryEntity> findByStreetwatchDayOrderByTimeAsc(StreetwatchDayEntity day);
}
