package dev.montron.pm.setup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.Instant;

/**
 * Entity representing the installation state of the PM Tool.
 * This is a singleton entity - only one row should exist.
 */
@Entity
@Table(name = "installation_state")
public class InstallationState {

    @Id
    @Column(name = "id", nullable = false)
    private String id = "INSTALLATION_STATE"; // Singleton pattern

    @Column(name = "state", nullable = false, length = 20)
    private String state; // UNCONFIGURED or CONFIGURED

    @Column(name = "configured_at")
    private Instant configuredAt;

    @Column(name = "configured_by_ip", length = 45)
    private String configuredByIp;

    @Column(name = "configured_by_user_agent", length = 512)
    private String configuredByUserAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.state == null) {
            this.state = "UNCONFIGURED";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Instant getConfiguredAt() {
        return configuredAt;
    }

    public void setConfiguredAt(Instant configuredAt) {
        this.configuredAt = configuredAt;
    }

    public String getConfiguredByIp() {
        return configuredByIp;
    }

    public void setConfiguredByIp(String configuredByIp) {
        this.configuredByIp = configuredByIp;
    }

    public String getConfiguredByUserAgent() {
        return configuredByUserAgent;
    }

    public void setConfiguredByUserAgent(String configuredByUserAgent) {
        this.configuredByUserAgent = configuredByUserAgent;
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

    public boolean isConfigured() {
        return "CONFIGURED".equals(state);
    }

    public boolean isUnconfigured() {
        return "UNCONFIGURED".equals(state);
    }
}

