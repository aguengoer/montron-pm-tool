package dev.montron.pm.workday;

import dev.montron.pm.common.AbstractTenantEntity;
import dev.montron.pm.employees.EmployeeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "workday",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "ux_workday_company_employee_date",
                    columnNames = {"company_id", "employee_id", "work_date"})
        },
        indexes = {
            @Index(name = "idx_workday_company_employee_date", columnList = "company_id, employee_id, work_date")
        }
)
public class WorkdayEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private EmployeeEntity employee;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "has_tb", nullable = false)
    private boolean hasTb;

    @Column(name = "has_rs", nullable = false)
    private boolean hasRs;

    @Column(name = "has_streetwatch", nullable = false)
    private boolean hasStreetwatch;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public EmployeeEntity getEmployee() {
        return employee;
    }

    public void setEmployee(EmployeeEntity employee) {
        this.employee = employee;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isHasTb() {
        return hasTb;
    }

    public void setHasTb(boolean hasTb) {
        this.hasTb = hasTb;
    }

    public boolean isHasRs() {
        return hasRs;
    }

    public void setHasRs(boolean hasRs) {
        this.hasRs = hasRs;
    }

    public boolean isHasStreetwatch() {
        return hasStreetwatch;
    }

    public void setHasStreetwatch(boolean hasStreetwatch) {
        this.hasStreetwatch = hasStreetwatch;
    }
}
