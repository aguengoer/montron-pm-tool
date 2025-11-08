package dev.montron.pm.common;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "idempotency_key")
public class IdempotencyKeyEntity extends AbstractTenantEntity {

    @Id
    @Column(name = "key", nullable = false, length = 80)
    private String key;

    @Column(name = "request_hash", nullable = false, length = 128)
    private String requestHash;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getRequestHash() {
        return requestHash;
    }

    public void setRequestHash(String requestHash) {
        this.requestHash = requestHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
