package dev.montron.pm.employees;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<EmployeeEntity, UUID> {

    Page<EmployeeEntity> findByCompanyIdAndStatus(UUID companyId, String status, Pageable pageable);

    Page<EmployeeEntity> findByCompanyIdAndStatusAndDepartmentContainingIgnoreCase(
            UUID companyId,
            String status,
            String department,
            Pageable pageable);

    @Query("""
            select e from EmployeeEntity e
            where e.companyId = :companyId
              and (:status is null or e.status = :status)
              and (
                  :q is null
                  or lower(e.username) like lower(concat('%', :q, '%'))
                  or lower(e.firstName) like lower(concat('%', :q, '%'))
                  or lower(e.lastName) like lower(concat('%', :q, '%'))
              )
              and (:department is null or lower(e.department) like lower(concat('%', :department, '%')))
            """)
    Page<EmployeeEntity> search(
            @Param("companyId") UUID companyId,
            @Param("status") String status,
            @Param("q") String q,
            @Param("department") String department,
            Pageable pageable);

    Optional<EmployeeEntity> findByIdAndCompanyId(UUID id, UUID companyId);
}
