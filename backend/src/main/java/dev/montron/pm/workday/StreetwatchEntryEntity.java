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
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(
        name = "streetwatch_entry",
        indexes = {
            @Index(name = "idx_sw_entry_day", columnList = "streetwatch_day_id")
        }
)
public class StreetwatchEntryEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "streetwatch_day_id", nullable = false)
    private StreetwatchDayEntity streetwatchDay;

    @Column(name = "time", nullable = false)
    private LocalTime time;

    @Column(name = "km", nullable = false)
    private Integer km;

    @Column(name = "lat", precision = 9, scale = 6)
    private BigDecimal lat;

    @Column(name = "lon", precision = 9, scale = 6)
    private BigDecimal lon;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public StreetwatchDayEntity getStreetwatchDay() {
        return streetwatchDay;
    }

    public void setStreetwatchDay(StreetwatchDayEntity streetwatchDay) {
        this.streetwatchDay = streetwatchDay;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public Integer getKm() {
        return km;
    }

    public void setKm(Integer km) {
        this.km = km;
    }

    public BigDecimal getLat() {
        return lat;
    }

    public void setLat(BigDecimal lat) {
        this.lat = lat;
    }

    public BigDecimal getLon() {
        return lon;
    }

    public void setLon(BigDecimal lon) {
        this.lon = lon;
    }
}
