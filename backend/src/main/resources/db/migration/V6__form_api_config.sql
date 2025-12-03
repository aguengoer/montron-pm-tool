CREATE TABLE form_api_config (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    service_token_encrypted VARCHAR(512) NOT NULL,
    form_api_base_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ux_form_api_config_company
  ON form_api_config (company_id);

