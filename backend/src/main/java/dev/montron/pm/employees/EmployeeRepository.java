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

    @Query(value = """
            select e.* from employee e
            where e.company_id = CAST(:companyId AS uuid)
              and (CAST(:status AS varchar) is null or e.status = CAST(:status AS varchar))
              and (
                  CAST(:q AS varchar) is null
                  or lower(CAST(e.username AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
                  or lower(CAST(e.first_name AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
                  or lower(CAST(e.last_name AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
              )
              and (CAST(:department AS varchar) is null or lower(CAST(e.department AS varchar)) like lower(concat('%', CAST(:department AS varchar), '%')))
            """, 
            countQuery = """
            select count(*) from employee e
            where e.company_id = CAST(:companyId AS uuid)
              and (CAST(:status AS varchar) is null or e.status = CAST(:status AS varchar))
              and (
                  CAST(:q AS varchar) is null
                  or lower(CAST(e.username AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
                  or lower(CAST(e.first_name AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
                  or lower(CAST(e.last_name AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
              )
              and (CAST(:department AS varchar) is null or lower(CAST(e.department AS varchar)) like lower(concat('%', CAST(:department AS varchar), '%')))
            """,
            nativeQuery = true)
    Page<EmployeeEntity> search(
            @Param("companyId") UUID companyId,
            @Param("status") String status,
            @Param("q") String q,
            @Param("department") String department,
            Pageable pageable);

    Optional<EmployeeEntity> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<EmployeeEntity> findByUsername(String username);
}
