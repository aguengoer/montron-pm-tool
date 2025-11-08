package dev.montron.pm.audit;

import dev.montron.pm.common.AbstractTenantEntity;
import dev.montron.pm.workday.WorkdayEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "release_action",
        indexes = {
            @Index(name = "idx_release_workday", columnList = "workday_id")
        }
)
public class ReleaseActionEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workday_id", nullable = false)
    private WorkdayEntity workday;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "pin_last4", length = 4, nullable = false)
    private String pinLast4;

    @Column(name = "released_at", nullable = false)
    private Instant releasedAt;

    @Column(name = "target_path", nullable = false)
    private String targetPath;

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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getPinLast4() {
        return pinLast4;
    }

    public void setPinLast4(String pinLast4) {
        this.pinLast4 = pinLast4;
    }

    public Instant getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(Instant releasedAt) {
        this.releasedAt = releasedAt;
    }

    public String getTargetPath() {
        return targetPath;
    }

    public void setTargetPath(String targetPath) {
        this.targetPath = targetPath;
    }
}
