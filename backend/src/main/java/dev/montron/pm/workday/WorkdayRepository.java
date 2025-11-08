package dev.montron.pm.workday;

import dev.montron.pm.employees.EmployeeEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkdayRepository extends JpaRepository<WorkdayEntity, UUID> {

    Optional<WorkdayEntity> findByEmployeeAndWorkDate(EmployeeEntity employee, LocalDate workDate);

    List<WorkdayEntity> findByCompanyIdAndEmployee_IdAndWorkDateBetweenOrderByWorkDateAsc(
            UUID companyId,
            UUID employeeId,
            LocalDate from,
            LocalDate to);

    Optional<WorkdayEntity> findByIdAndCompanyId(UUID id, UUID companyId);
}
