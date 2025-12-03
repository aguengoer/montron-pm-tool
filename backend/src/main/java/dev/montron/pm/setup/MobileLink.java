package dev.montron.pm.setup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing the link between PM Tool and Mobile App backend.
 * Stores the service token and company information.
 */
@Entity
@Table(
        name = "mobile_link",
        indexes = {
                @Index(name = "idx_mobile_link_company", columnList = "mobile_company_id")
        }
)
public class MobileLink {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "mobile_company_id", nullable = false, unique = true)
    private UUID mobileCompanyId;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "service_token_enc", nullable = false, length = 512)
    private String serviceTokenEnc;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMobileCompanyId() {
        return mobileCompanyId;
    }

    public void setMobileCompanyId(UUID mobileCompanyId) {
        this.mobileCompanyId = mobileCompanyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getServiceTokenEnc() {
        return serviceTokenEnc;
    }

    public void setServiceTokenEnc(String serviceTokenEnc) {
        this.serviceTokenEnc = serviceTokenEnc;
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

