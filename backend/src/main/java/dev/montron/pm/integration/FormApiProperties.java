package dev.montron.pm.integration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "form-api")
public class FormApiProperties {

    private String baseUrl;
    private String technicalToken;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getTechnicalToken() {
        return technicalToken;
    }

    public void setTechnicalToken(String technicalToken) {
        this.technicalToken = technicalToken;
    }
}
