# First-Run Setup Wizard Implementation

## Overview

This document describes the implementation of the First-Run Setup Wizard for PM Tool. The wizard guides administrators through linking the PM Tool to the Mobile App backend using service tokens.

## Architecture

### State Management

The installation has two states:
- **UNCONFIGURED**: Setup wizard is accessible, all other routes redirect to `/setup`
- **CONFIGURED**: Setup wizard is disabled (404), normal app functionality available

### Security Features

1. **No Default Admin**: No baked-in credentials (OWASP A07 compliance)
2. **Encrypted Token Storage**: Service tokens encrypted at rest using AES/GCM
3. **Audit Trail**: Tracks who/when configured (IP, User-Agent)
4. **Optional Bootstrap Secret**: Extra security for on-prem installations
5. **CORS Protection**: No wildcard CORS with credentials

## Backend Implementation

### Database Schema

#### InstallationState Table (Singleton)
- `id`: VARCHAR(50) PRIMARY KEY (always "INSTALLATION_STATE")
- `state`: VARCHAR(20) - "UNCONFIGURED" or "CONFIGURED"
- `configured_at`: TIMESTAMPTZ
- `configured_by_ip`: VARCHAR(45)
- `configured_by_user_agent`: VARCHAR(512)
- `created_at`, `updated_at`: TIMESTAMPTZ

#### MobileLink Table
- `id`: UUID PRIMARY KEY
- `mobile_company_id`: UUID NOT NULL UNIQUE
- `company_name`: VARCHAR(255) NOT NULL
- `service_token_enc`: VARCHAR(512) NOT NULL (encrypted)
- `created_at`, `updated_at`: TIMESTAMPTZ

### Components

#### 1. InstallationState Entity
**Location**: `backend/src/main/java/dev/montron/pm/setup/InstallationState.java`
- Singleton entity representing installation state
- Helper methods: `isConfigured()`, `isUnconfigured()`

#### 2. MobileLink Entity
**Location**: `backend/src/main/java/dev/montron/pm/setup/MobileLink.java`
- Stores encrypted service token and company information
- Links PM Tool to Mobile App backend company

#### 3. SetupService
**Location**: `backend/src/main/java/dev/montron/pm/setup/SetupService.java`
- Manages installation state transitions
- Validates service tokens via MobileApiClient
- Encrypts and stores tokens
- Tracks audit information

#### 4. SetupController
**Location**: `backend/src/main/java/dev/montron/pm/setup/SetupController.java`
- `GET /setup/state` - Get current state (public)
- `POST /setup/token` - Configure with service token
- `POST /setup/code` - Stub for future code exchange

#### 5. MobileApiClient
**Location**: `backend/src/main/java/dev/montron/pm/setup/MobileApiClient.java`
- Validates service tokens against Mobile App backend
- TODO: Needs endpoint in Mobile App: `GET /api/companies/me` or `GET /api/auth/validate-service-token`
- Returns company ID and name

#### 6. SetupBlockingFilter
**Location**: `backend/src/main/java/dev/montron/pm/setup/SetupBlockingFilter.java`
- Blocks `/setup/**` endpoints when CONFIGURED (returns 404)
- Allows `/setup/state` always (for status checks)

#### 7. CryptoConfig
**Location**: `backend/src/main/java/dev/montron/pm/config/CryptoConfig.java`
- Configures Spring Security TextEncryptor
- Uses AES/GCM encryption with secret from `PM_SECRET_KEY`

### Security Configuration

**Location**: `backend/src/main/java/dev/montron/pm/config/SecurityConfig.java`

- `/setup/**` - Public (gated by SetupBlockingFilter)
- `/health` - Public
- `/api/**` - Requires authentication
- CORS configured per existing settings (no wildcards with credentials)

### API Endpoints

#### GET /setup/state
**Access**: Public  
**Response**:
```json
{
  "state": "UNCONFIGURED" | "CONFIGURED"
}
```

#### POST /setup/token
**Access**: Public (only when UNCONFIGURED)  
**Request**:
```json
{
  "serviceToken": "string"
}
```
**Response** (200):
```json
{
  "success": true,
  "message": "Installation configured successfully"
}
```
**Response** (400):
```json
{
  "message": "Error message"
}
```

#### POST /setup/code
**Access**: Public (only when UNCONFIGURED)  
**Status**: 501 Not Implemented (stub for future)

## Frontend Implementation

### Setup Wizard Page

**Location**: `pm-web-frontend/app/setup/page.tsx`

Features:
- Two tabs: "Service Token" (active) and "One-Time Code" (coming soon)
- Token input with instructions
- Copyable hints for obtaining tokens
- Error handling and validation
- Success toast and redirect

### Setup Guard

**Location**: `pm-web-frontend/components/setup-guard.tsx`

- Wraps entire app
- Redirects to `/setup` when UNCONFIGURED
- Blocks `/setup` when CONFIGURED
- Handles loading states

### Hooks

**Location**: `pm-web-frontend/hooks/useSetupState.ts`

- Fetches setup state from backend
- Used by SetupGuard and Setup page

## Configuration

### Environment Variables

#### Required
- `PM_SECRET_KEY` - Encryption key for service tokens (min 16 chars)
- `MOBILE_API_BASE_URL` - Mobile App backend URL (default: `http://localhost:8090/api`)

#### Optional
- `PM_BOOTSTRAP_SECRET` - Extra security for setup endpoint (requires header `X-Setup-Secret`)
- `MOBILE_API_TIMEOUT_MS` - Timeout for Mobile API calls (default: 30000ms)

### Application Properties

**Location**: `backend/src/main/resources/application.yml`

```yaml
pm:
  secret-key: ${PM_SECRET_KEY:}
  bootstrap-secret: ${PM_BOOTSTRAP_SECRET:}

mobile:
  api:
    base-url: ${MOBILE_API_BASE_URL:http://localhost:8090/api}
    timeout-ms: ${MOBILE_API_TIMEOUT_MS:30000}
```

## Migration

**Location**: `backend/src/main/resources/db/migration/V7__setup_wizard.sql`

Creates:
- `installation_state` table (with initial UNCONFIGURED row)
- `mobile_link` table

## Database Migration

The migration automatically runs on startup via Flyway. The initial state is set to UNCONFIGURED.

## Usage

### First Run

1. Start PM Tool backend (with empty or fresh database)
2. Access any route → automatically redirected to `/setup`
3. Enter service token from Mobile App Admin UI
4. Click "Installation konfigurieren"
5. On success, redirected to `/mitarbeiter`

### Obtaining Service Token

1. Log into Mobile App Admin UI
2. Navigate to Settings → Service Tokens
3. Click "Neuen Token erstellen"
4. Enter name (e.g., "PM Tool Production")
5. Copy token (shown only once!)
6. Paste in PM Tool setup wizard

### After Configuration

- Setup endpoints return 404
- Normal app functionality available
- Service token stored encrypted in database

## Testing

### Manual Testing Steps

1. **Fresh Installation**:
   ```bash
   # Clear database
   dropdb montron_pm
   createdb montron_pm
   
   # Start backend
   cd backend
   ./mvnw spring-boot:run
   
   # Verify state
   curl http://localhost:8080/setup/state
   # Should return: {"state":"UNCONFIGURED"}
   ```

2. **Access Setup**:
   - Visit `http://localhost:3001/setup`
   - Should see setup wizard

3. **Configure**:
   - Enter valid service token
   - Submit
   - Should redirect to `/mitarbeiter`

4. **Verify Blocking**:
   ```bash
   curl http://localhost:8080/setup/token -X POST -H "Content-Type: application/json" -d '{"serviceToken":"test"}'
   # Should return 404
   ```

### Unit Tests Needed

- [ ] InstallationState transitions
- [ ] SetupService token validation
- [ ] SetupController error handling
- [ ] SetupBlockingFilter gating logic

### Integration Tests Needed

- [ ] CORS preflight for `/setup/**`
- [ ] `/api/**` still requires auth
- [ ] State transitions end-to-end

## TODOs

### Mobile App Backend

1. **Create Token Validation Endpoint**
   - Endpoint: `GET /api/auth/validate-service-token`
   - Headers: `Authorization: Bearer {token}`
   - Response: `{ companyId: UUID, companyName: string }`
   - OR: `GET /api/companies/me` with service token auth

2. **Create Code Exchange Endpoint** (Future)
   - Endpoint: `POST /api/auth/exchange-code`
   - Body: `{ code: string }`
   - Response: `{ token: string, companyId: UUID, companyName: string }`

### PM Tool

1. **Implement Code Exchange** (Future)
   - Wire up `POST /setup/code` endpoint
   - Call Mobile App code exchange endpoint
   - Store token same as service token flow

2. **Add Tests**
   - Unit tests for SetupService
   - Integration tests for setup flow
   - Security tests for state gating

## Files Created/Modified

### Backend

**Created**:
- `backend/src/main/java/dev/montron/pm/setup/InstallationState.java`
- `backend/src/main/java/dev/montron/pm/setup/InstallationStateRepository.java`
- `backend/src/main/java/dev/montron/pm/setup/MobileLink.java`
- `backend/src/main/java/dev/montron/pm/setup/MobileLinkRepository.java`
- `backend/src/main/java/dev/montron/pm/setup/SetupService.java`
- `backend/src/main/java/dev/montron/pm/setup/SetupController.java`
- `backend/src/main/java/dev/montron/pm/setup/MobileApiClient.java`
- `backend/src/main/java/dev/montron/pm/setup/SetupStateChecker.java`
- `backend/src/main/java/dev/montron/pm/setup/SetupBlockingFilter.java`
- `backend/src/main/java/dev/montron/pm/config/CryptoConfig.java`
- `backend/src/main/resources/db/migration/V7__setup_wizard.sql`

**Modified**:
- `backend/src/main/java/dev/montron/pm/config/SecurityConfig.java` - Added setup endpoints
- `backend/src/main/java/dev/montron/pm/config/HealthController.java` - Added `/health` endpoint
- `backend/src/main/resources/application.yml` - Added mobile.api and pm.secret-key config

### Frontend

**Created**:
- `pm-web-frontend/app/setup/page.tsx` - Setup wizard UI
- `pm-web-frontend/hooks/useSetupState.ts` - Setup state hook
- `pm-web-frontend/lib/setupTypes.ts` - TypeScript types
- `pm-web-frontend/components/setup-guard.tsx` - Setup state guard
- `pm-web-frontend/middleware.ts` - Next.js middleware

**Modified**:
- `pm-web-frontend/app/layout.tsx` - Added SetupGuard wrapper
- `pm-web-frontend/components/ui/layout.tsx` - Handle setup routes

## Security Considerations

1. **Encryption**: All service tokens encrypted at rest using AES/GCM
2. **No Default Admin**: Setup wizard replaces need for baked-in credentials
3. **Audit Trail**: Tracks configuration events (IP, User-Agent, timestamp)
4. **State Gating**: Setup endpoints blocked after configuration
5. **CORS**: No wildcard origins with credentials
6. **Optional Bootstrap Secret**: Extra layer for sensitive deployments

## Next Steps

1. **Mobile App Backend**: Create token validation endpoint
2. **Testing**: Add unit and integration tests
3. **Documentation**: Update README with setup instructions
4. **Code Exchange**: Implement OAuth-style code exchange (future)

## How to Run Locally

### Prerequisites

1. Set environment variables:
   ```bash
   export PM_SECRET_KEY="your-32-character-encryption-key-here"
   export MOBILE_API_BASE_URL="http://localhost:8090/api"
   ```

2. Ensure Mobile App backend is running

3. Start PM Tool backend:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. Start PM Tool frontend:
   ```bash
   cd pm-web-frontend
   npm run dev
   ```

### Testing Both States

**UNCONFIGURED State**:
1. Clear database or use fresh install
2. Access `http://localhost:3001` → redirects to `/setup`
3. Access `http://localhost:8080/setup/state` → `{"state":"UNCONFIGURED"}`

**CONFIGURED State**:
1. Complete setup wizard with valid token
2. Access `/setup` → redirects to `/mitarbeiter`
3. Access `http://localhost:8080/setup/token` → 404
4. Access `http://localhost:8080/setup/state` → `{"state":"CONFIGURED"}`

