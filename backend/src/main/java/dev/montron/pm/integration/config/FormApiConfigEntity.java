package dev.montron.pm.integration.config;

import dev.montron.pm.common.AbstractTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/**
 * Entity to store the Form API service token configuration per company.
 * The token is stored encrypted in the database.
 */
@Entity
@Table(
        name = "form_api_config",
        uniqueConstraints = {
                @UniqueConstraint(name = "ux_form_api_config_company", columnNames = {"company_id"})
        }
)
public class FormApiConfigEntity extends AbstractTenantEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "service_token_encrypted", nullable = false, length = 512)
    private String serviceTokenEncrypted;

    @Column(name = "form_api_base_url", length = 512)
    private String formApiBaseUrl;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getServiceTokenEncrypted() {
        return serviceTokenEncrypted;
    }

    public void setServiceTokenEncrypted(String serviceTokenEncrypted) {
        this.serviceTokenEncrypted = serviceTokenEncrypted;
    }

    public String getFormApiBaseUrl() {
        return formApiBaseUrl;
    }

    public void setFormApiBaseUrl(String formApiBaseUrl) {
        this.formApiBaseUrl = formApiBaseUrl;
    }
}

