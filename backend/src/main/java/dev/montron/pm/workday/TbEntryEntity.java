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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(
        name = "tb_entry",
        indexes = {
            @Index(name = "idx_tb_entry_workday", columnList = "workday_id")
        }
)
public class TbEntryEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workday_id", nullable = false)
    private WorkdayEntity workday;

    @Column(name = "source_submission_id", nullable = false)
    private UUID sourceSubmissionId;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "break_minutes")
    private Integer breakMinutes;

    @Column(name = "travel_minutes")
    private Integer travelMinutes;

    @Column(name = "license_plate", length = 32)
    private String licensePlate;

    @Column(name = "department", length = 64)
    private String department;

    @Column(name = "overnight")
    private Boolean overnight;

    @Column(name = "km_start")
    private Integer kmStart;

    @Column(name = "km_end")
    private Integer kmEnd;

    @Column(name = "comment", columnDefinition = "text")
    private String comment;

    @Column(name = "extra", columnDefinition = "jsonb")
    private String extra;

    @Column(name = "version", nullable = false)
    private Integer version;

    @PrePersist
    protected void initializeVersion() {
        if (this.version == null) {
            this.version = 1;
        }
    }

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

    public UUID getSourceSubmissionId() {
        return sourceSubmissionId;
    }

    public void setSourceSubmissionId(UUID sourceSubmissionId) {
        this.sourceSubmissionId = sourceSubmissionId;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Integer getBreakMinutes() {
        return breakMinutes;
    }

    public void setBreakMinutes(Integer breakMinutes) {
        this.breakMinutes = breakMinutes;
    }

    public Integer getTravelMinutes() {
        return travelMinutes;
    }

    public void setTravelMinutes(Integer travelMinutes) {
        this.travelMinutes = travelMinutes;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Boolean getOvernight() {
        return overnight;
    }

    public void setOvernight(Boolean overnight) {
        this.overnight = overnight;
    }

    public Integer getKmStart() {
        return kmStart;
    }

    public void setKmStart(Integer kmStart) {
        this.kmStart = kmStart;
    }

    public Integer getKmEnd() {
        return kmEnd;
    }

    public void setKmEnd(Integer kmEnd) {
        this.kmEnd = kmEnd;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getExtra() {
        return extra;
    }

    public void setExtra(String extra) {
        this.extra = extra;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }
}
