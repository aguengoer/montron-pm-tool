package dev.montron.pm.integration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "form-api")
public class FormApiProperties {

    private String baseUrl;
    /**
     * @deprecated Use serviceToken instead. This is kept for backward compatibility.
     */
    @Deprecated
    private String technicalToken;
    private String serviceToken;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * @deprecated Use getServiceToken() instead.
     */
    @Deprecated
    public String getTechnicalToken() {
        return technicalToken;
    }

    /**
     * @deprecated Use setServiceToken() instead.
     */
    @Deprecated
    public void setTechnicalToken(String technicalToken) {
        this.technicalToken = technicalToken;
    }

    public String getServiceToken() {
        return serviceToken;
    }

    public void setServiceToken(String serviceToken) {
        this.serviceToken = serviceToken;
    }
}
