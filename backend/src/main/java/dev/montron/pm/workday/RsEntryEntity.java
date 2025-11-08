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
        name = "rs_entry",
        indexes = {
            @Index(name = "idx_rs_entry_workday", columnList = "workday_id")
        }
)
public class RsEntryEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workday_id", nullable = false)
    private WorkdayEntity workday;

    @Column(name = "source_submission_id", nullable = false)
    private UUID sourceSubmissionId;

    @Column(name = "customer_id", length = 64)
    private String customerId;

    @Column(name = "customer_name", length = 128)
    private String customerName;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "break_minutes")
    private Integer breakMinutes;

    @Column(name = "positions", columnDefinition = "jsonb")
    private String positions;

    @Column(name = "pdf_object_key")
    private String pdfObjectKey;

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

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
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

    public String getPositions() {
        return positions;
    }

    public void setPositions(String positions) {
        this.positions = positions;
    }

    public String getPdfObjectKey() {
        return pdfObjectKey;
    }

    public void setPdfObjectKey(String pdfObjectKey) {
        this.pdfObjectKey = pdfObjectKey;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }
}
