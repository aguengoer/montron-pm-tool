package dev.montron.pm.workday.validation;

import dev.montron.pm.workday.WorkdayEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ValidationIssueRepository extends JpaRepository<ValidationIssueEntity, UUID> {

    List<ValidationIssueEntity> findByWorkday(WorkdayEntity workday);

    void deleteByWorkday(WorkdayEntity workday);
}
