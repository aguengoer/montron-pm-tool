package dev.montron.pm.workday.validation;

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
import java.util.UUID;

@Entity
@Table(
        name = "validation_issue",
        indexes = {
            @Index(name = "idx_validation_workday", columnList = "workday_id")
        }
)
public class ValidationIssueEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workday_id", nullable = false)
    private WorkdayEntity workday;

    @Column(name = "code", nullable = false, length = 64)
    private String code;

    @Column(name = "severity", nullable = false, length = 16)
    private String severity;

    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "field_ref", length = 128)
    private String fieldRef;

    @Column(name = "delta", columnDefinition = "jsonb")
    private String delta;

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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getFieldRef() {
        return fieldRef;
    }

    public void setFieldRef(String fieldRef) {
        this.fieldRef = fieldRef;
    }

    public String getDelta() {
        return delta;
    }

    public void setDelta(String delta) {
        this.delta = delta;
    }
}
