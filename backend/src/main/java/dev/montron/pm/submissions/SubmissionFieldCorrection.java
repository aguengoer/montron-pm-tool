package dev.montron.pm.submissions;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Stores field-level corrections made in PM tool.
 * Original data stays in mobile app DB, corrections are stored here.
 */
@Entity
@Table(name = "submission_field_correction",
    indexes = {
        @Index(name = "idx_correction_submission_id", columnList = "submission_id"),
        @Index(name = "idx_correction_submission_field", columnList = "submission_id,field_id", unique = true)
    }
)
public class SubmissionFieldCorrection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the submission in the mobile app (not a foreign key, just a reference)
     */
    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    /**
     * The field ID that was corrected
     */
    @Column(name = "field_id", nullable = false)
    private String fieldId;

    /**
     * The corrected value (stored as text, can represent any type)
     */
    @Column(name = "corrected_value", columnDefinition = "TEXT")
    private String correctedValue;

    /**
     * The original value (for audit trail)
     */
    @Column(name = "original_value", columnDefinition = "TEXT")
    private String originalValue;

    /**
     * User who made the correction
     */
    @Column(name = "corrected_by", nullable = false)
    private UUID correctedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

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

    public String getFieldId() {
        return fieldId;
    }

    public void setFieldId(String fieldId) {
        this.fieldId = fieldId;
    }

    public String getCorrectedValue() {
        return correctedValue;
    }

    public void setCorrectedValue(String correctedValue) {
        this.correctedValue = correctedValue;
    }

    public String getOriginalValue() {
        return originalValue;
    }

    public void setOriginalValue(String originalValue) {
        this.originalValue = originalValue;
    }

    public UUID getCorrectedBy() {
        return correctedBy;
    }

    public void setCorrectedBy(UUID correctedBy) {
        this.correctedBy = correctedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

