package dev.montron.pm.workday;

import dev.montron.pm.common.AbstractTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "streetwatch_day",
        indexes = {
            @Index(name = "idx_sw_day_workday", columnList = "workday_id")
        }
)
public class StreetwatchDayEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workday_id", nullable = false)
    private WorkdayEntity workday;

    @Column(name = "license_plate", length = 32)
    private String licensePlate;

    @Column(name = "sw_date", nullable = false)
    private LocalDate swDate;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public WorkdayEntity getWorkday() {
        return workday;
    }

    public void setWorkday(WorkdayEntity workday) {
        this.workday = workday;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public LocalDate getSwDate() {
        return swDate;
    }

    public void setSwDate(LocalDate swDate) {
        this.swDate = swDate;
    }
}
