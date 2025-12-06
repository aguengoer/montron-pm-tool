package dev.montron.pm.submissions;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Tracks PDF versions for submissions that have been corrected in PM tool.
 * Original PDF (v1) stays in mobile app, corrected versions (v2, v3, ...) are tracked here.
 */
@Entity
@Table(name = "submission_pdf_version",
    indexes = {
        @Index(name = "idx_pdf_submission_id", columnList = "submission_id")
    }
)
public class SubmissionPdfVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the submission in the mobile app (not a foreign key, just a reference)
     */
    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    /**
     * Current version number (starts at 2, since v1 is the original in mobile app)
     */
    @Column(name = "version", nullable = false)
    private Integer version;

    /**
     * S3 object key for the corrected PDF
     */
    @Column(name = "pdf_object_key", nullable = false, length = 512)
    private String pdfObjectKey;

    /**
     * Presigned URL (temporary, regenerated on request)
     */
    @Transient
    private String pdfUrl;

    /**
     * User who triggered this PDF regeneration
     */
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(UUID submissionId) {
        this.submissionId = submissionId;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public String getPdfObjectKey() {
        return pdfObjectKey;
    }

    public void setPdfObjectKey(String pdfObjectKey) {
        this.pdfObjectKey = pdfObjectKey;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

