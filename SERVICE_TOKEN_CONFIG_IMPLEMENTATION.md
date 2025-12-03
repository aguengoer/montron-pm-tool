# Service Token Configuration Implementation

## Overview

This document describes the implementation of a database-backed service token configuration system for the PM Tool. This allows administrators to configure the Form API service token through the UI instead of using environment variables.

## Architecture

### Backend Components

1. **Database Entity** (`FormApiConfigEntity`)
   - Stores encrypted service token and base URL per company
   - Located in: `backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigEntity.java`
   - Table: `form_api_config`

2. **Encryption Service** (`TokenEncryptionService`)
   - Encrypts/decrypts service tokens using AES-256
   - Encryption key can be configured via `form-api.encryption-key` property
   - If not configured, generates a random key (warning logged)
   - Located in: `backend/src/main/java/dev/montron/pm/integration/config/TokenEncryptionService.java`

3. **Config Service** (`FormApiConfigService`)
   - Manages CRUD operations for Form API configuration
   - Handles encryption/decryption of tokens
   - Per-company isolation using `AbstractTenantEntity`
   - Located in: `backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigService.java`

4. **REST Controller** (`FormApiConfigController`)
   - Exposes API endpoints for configuration management
   - Endpoints:
     - `GET /api/config/form-api` - Get current configuration
     - `PUT /api/config/form-api` - Update configuration
   - Requires `ADMIN` role
   - Located in: `backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigController.java`

5. **Updated FormBackendClient**
   - Updated token resolution priority:
     1. Database configuration (per-company)
     2. Environment variable (`form-api.service-token`)
     3. Legacy technical token (deprecated)
     4. User JWT token (for user-initiated requests)
   - Located in: `backend/src/main/java/dev/montron/pm/integration/FormBackendClient.java`

### Frontend Components

1. **React Hook** (`useFormApiConfig`)
   - Fetches and updates Form API configuration
   - Located in: `pm-web-frontend/hooks/useFormApiConfig.ts`

2. **Settings UI**
   - Added Form API configuration section to Settings page
   - Allows input of:
     - Base URL (optional)
     - Service Token (required)
   - Shows configuration status badge
   - Located in: `pm-web-frontend/app/einstellungen/page.tsx`

## Database Migration

**Migration File**: `V6__form_api_config.sql`

Creates the `form_api_config` table with:
- `id` (UUID, primary key)
- `company_id` (UUID, for multi-tenancy)
- `service_token_encrypted` (VARCHAR(512), encrypted token)
- `form_api_base_url` (VARCHAR(512), optional base URL)
- `created_at`, `updated_at` (timestamps)
- Unique constraint on `company_id` (one config per company)

## Configuration

### Backend Configuration

#### Encryption Key (Optional but Recommended)

Add to `application.yml` or environment variables:

```yaml
form-api:
  encryption-key: ${FORM_API_ENCRYPTION_KEY:} # At least 32 characters recommended
```

**Important**: In production, set a persistent encryption key via environment variable. If not set, a random key is generated on each startup, making decryption of existing tokens impossible.

#### Base URL (Still Supported)

The base URL can still be configured via properties:

```yaml
form-api:
  base-url: ${FORM_API_BASE_URL:http://localhost:8090/api}
```

However, if configured via UI, it takes precedence for that company.

### Token Resolution Priority

The `FormBackendClient` resolves tokens in this order:

1. **Database Config** (highest priority)
   - Per-company configuration from UI
   - Encrypted in database

2. **Environment Variable**
   - `form-api.service-token` property
   - Global for all companies

3. **Legacy Technical Token** (deprecated)
   - `form-api.technical-token` property
   - Kept for backward compatibility

4. **User JWT Token** (lowest priority)
   - For user-initiated requests from frontend
   - Only when no service token is available

## Usage

### Setting Up Service Token

1. **Generate Token in Form Builder Admin UI**
   - Navigate to Form Builder Admin: `http://localhost:3000/settings` (or `/service-tokens`)
   - Create a new service token
   - Copy the token (shown only once!)

2. **Configure in PM Tool**
   - Navigate to PM Tool Settings: `http://localhost:3001/einstellungen`
   - Scroll to "Form API-Konfiguration" section
   - Paste the service token
   - Optionally set the base URL (defaults to property value)
   - Click "Konfiguration speichern"

### Security Features

1. **Encryption at Rest**
   - Tokens are encrypted using AES-256 before storage
   - Encryption key should be set via environment variable in production

2. **Per-Company Isolation**
   - Each company has its own configuration
   - Uses `AbstractTenantEntity` for multi-tenancy

3. **Never Exposed in API Responses**
   - Service token is never returned in GET responses
   - Only a boolean `serviceTokenConfigured` is shown

4. **Admin-Only Access**
   - Configuration endpoints require `ADMIN` role
   - Protected by Spring Security

## Migration from Environment Variables

### Step 1: Set Encryption Key

```bash
export FORM_API_ENCRYPTION_KEY="your-32-character-encryption-key-here"
```

Or in `application.yml`:

```yaml
form-api:
  encryption-key: your-32-character-encryption-key-here
```

### Step 2: Start Backend

The migration will automatically create the `form_api_config` table.

### Step 3: Configure via UI

1. Log in to PM Tool as admin
2. Go to Settings (`/einstellungen`)
3. Enter the service token from Form Builder
4. Save configuration

### Step 4: (Optional) Remove Environment Variable

Once configured via UI, you can remove the `FORM_API_SERVICE_TOKEN` environment variable. The database configuration takes precedence.

## Troubleshooting

### Token Not Working

1. **Check Encryption Key**
   - Ensure the encryption key is the same as when the token was saved
   - Check logs for encryption/decryption errors

2. **Verify Token**
   - Ensure the token copied from Form Builder is correct
   - Check for extra spaces or line breaks

3. **Check Company Context**
   - Ensure you're viewing the correct company's configuration
   - Service tokens are per-company

4. **Review Logs**
   - Check backend logs for authentication errors
   - Look for "Failed to decrypt token" or similar messages

### Database Migration Issues

If the migration fails:

1. Check Flyway migration status:
   ```sql
   SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;
   ```

2. Verify table exists:
   ```sql
   SELECT * FROM form_api_config;
   ```

### Encryption Issues

- **Random Key Warning**: If you see "No encryption key configured", set `form-api.encryption-key`
- **Cannot Decrypt**: Ensure the encryption key matches the one used when encrypting
- **Key Too Short**: Encryption key should be at least 32 characters (will be padded/trimmed to 32 bytes)

## API Endpoints

### GET /api/config/form-api

Get current company's Form API configuration.

**Response**:
```json
{
  "baseUrl": "http://localhost:8090/api",
  "serviceToken": null,
  "serviceTokenConfigured": true
}
```

### PUT /api/config/form-api

Update Form API configuration.

**Request**:
```json
{
  "baseUrl": "http://localhost:8090/api",
  "serviceToken": "your-service-token-here"
}
```

**Response**:
```json
{
  "baseUrl": "http://localhost:8090/api",
  "serviceToken": null,
  "serviceTokenConfigured": true
}
```

## Files Changed/Added

### Backend

- `backend/src/main/java/dev/montron/pm/integration/config/TokenEncryptionService.java` (new)
- `backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigEntity.java` (new)
- `backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigRepository.java` (new)
- `backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigService.java` (new)
- `backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigController.java` (new)
- `backend/src/main/java/dev/montron/pm/integration/FormBackendClient.java` (updated)
- `backend/src/main/resources/db/migration/V6__form_api_config.sql` (new)

### Frontend

- `pm-web-frontend/hooks/useFormApiConfig.ts` (new)
- `pm-web-frontend/app/einstellungen/page.tsx` (updated)

## Benefits

1. **No Environment Variables Required**
   - Configuration can be done entirely through UI
   - Easier deployment and management

2. **Per-Company Configuration**
   - Each company can have its own service token
   - Better multi-tenancy support

3. **Secure Storage**
   - Tokens encrypted at rest
   - Never exposed in API responses

4. **Easy Updates**
   - Update tokens without restarting backend
   - No need to change environment variables

5. **Backward Compatible**
   - Still supports environment variable configuration
   - Fallback chain ensures compatibility

