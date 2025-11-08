package dev.montron.pm.workday;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TbEntryRepository extends JpaRepository<TbEntryEntity, UUID> {

    Optional<TbEntryEntity> findByWorkday(WorkdayEntity workday);
}
