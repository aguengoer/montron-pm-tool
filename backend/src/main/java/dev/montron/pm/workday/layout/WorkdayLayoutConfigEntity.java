package dev.montron.pm.workday.layout;

import dev.montron.pm.common.AbstractTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(
        name = "workday_layout_config",
        uniqueConstraints = {
            @UniqueConstraint(name = "ux_layout_company_name", columnNames = {"company_id", "name"})
        }
)
public class WorkdayLayoutConfigEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 64)
    private String name;

    @Column(name = "document_type_tb", nullable = false, length = 48)
    private String documentTypeTb;

    @Column(name = "document_type_rs", nullable = false, length = 48)
    private String documentTypeRs;

    @Column(name = "config", nullable = false, columnDefinition = "jsonb")
    private String config;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDocumentTypeTb() {
        return documentTypeTb;
    }

    public void setDocumentTypeTb(String documentTypeTb) {
        this.documentTypeTb = documentTypeTb;
    }

    public String getDocumentTypeRs() {
        return documentTypeRs;
    }

    public void setDocumentTypeRs(String documentTypeRs) {
        this.documentTypeRs = documentTypeRs;
    }

    public String getConfig() {
        return config;
    }

    public void setConfig(String config) {
        this.config = config;
    }
}
