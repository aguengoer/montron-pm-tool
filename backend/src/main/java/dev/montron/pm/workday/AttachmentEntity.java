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
import java.util.UUID;

@Entity
@Table(
        name = "attachment",
        indexes = {
            @Index(name = "idx_attachment_workday", columnList = "workday_id")
        }
)
public class AttachmentEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workday_id", nullable = false)
    private WorkdayEntity workday;

    @Column(name = "kind", nullable = false, length = 32)
    private String kind;

    @Column(name = "s3_key", nullable = false)
    private String s3Key;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "bytes")
    private Long bytes;

    @Column(name = "source_submission_id")
    private UUID sourceSubmissionId;

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

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getS3Key() {
        return s3Key;
    }

    public void setS3Key(String s3Key) {
        this.s3Key = s3Key;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public Long getBytes() {
        return bytes;
    }

    public void setBytes(Long bytes) {
        this.bytes = bytes;
    }

    public UUID getSourceSubmissionId() {
        return sourceSubmissionId;
    }

    public void setSourceSubmissionId(UUID sourceSubmissionId) {
        this.sourceSubmissionId = sourceSubmissionId;
    }
}
