# Service Token Migration Guide

## Overview

This guide explains how to migrate from user JWT tokens to service tokens for communication between the PM Tool and Form Builder backend.

## Why Service Tokens?

**Previous Approach (User Tokens):**
- ❌ Tokens expire every 15 minutes
- ❌ Tied to specific users
- ❌ Poor audit trail (can't distinguish service vs user actions)
- ❌ Security concerns (user tokens have full user permissions)

**New Approach (Service Tokens):**
- ✅ Long-lived tokens (configurable expiration or never expire)
- ✅ Dedicated service credentials (not tied to users)
- ✅ Better audit trail (clear distinction between service and user actions)
- ✅ Revocable and trackable
- ✅ Better security (scoped permissions)

## Implementation Summary

### Form Builder Backend ✅

1. **Database**: New `service_token` table (migration V21)
2. **API Endpoints**: 
   - `POST /api/service-tokens` - Create token
   - `GET /api/service-tokens` - List tokens
   - `DELETE /api/service-tokens/{id}` - Revoke token
3. **Authentication**: Updated `JwtAuthenticationFilter` to support service tokens
4. **Admin UI**: New page at `/service-tokens` for token management

### PM Tool Backend ✅

1. **Configuration**: Added `form-api.service-token` property
2. **Client**: Updated `FormBackendClient` to prefer service tokens
3. **Backward Compatibility**: Still supports `technical-token` (deprecated)

### Admin Web UI ✅

1. **Service Token Management Page**: `/service-tokens`
   - Create new tokens
   - List all tokens
   - View usage stats
   - Revoke tokens

## Migration Steps

### Step 1: Generate Service Token

1. Log into the Form Builder admin UI
2. Navigate to **Service-Tokens** (new menu item)
3. Click **"Neuer Token"**
4. Fill in:
   - **Name**: e.g., "PM Tool Production"
   - **Description**: Optional description
   - **Läuft ab in Tagen**: Optional expiration (leave empty for no expiration)
5. Click **"Token erstellen"**
6. **IMPORTANT**: Copy the token immediately - it's only shown once!
7. Store the token securely

### Step 2: Configure PM Tool

#### Option A: Environment Variable (Recommended)

```bash
export FORM_API_SERVICE_TOKEN="your-service-token-here"
```

#### Option B: Application Configuration

Update `application.yml` (or `application-prod.yml`):

```yaml
form-api:
  service-token: ${FORM_API_SERVICE_TOKEN:}
```

Then set the environment variable in your deployment environment.

### Step 3: Restart PM Tool

Restart the PM Tool backend to pick up the new configuration:

```bash
# Development
./mvnw spring-boot:run

# Production
systemctl restart montron-pm-tool
```

### Step 4: Verify

Check PM Tool logs to verify service token is being used. You should see successful API calls to the Form Builder backend.

## Configuration Priority

The PM Tool uses the following priority order for authentication:

1. **Service Token** (`form-api.service-token`) - **Recommended for production**
2. **Legacy Technical Token** (`form-api.technical-token`) - Deprecated, backward compatibility only
3. **User JWT Token** - Fallback for user-initiated requests via frontend

## Testing

### Test Service Token Creation

1. Create a token in admin UI
2. Copy the token
3. Test manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8090/api/employees?page=0&size=10
   ```

### Test PM Tool Integration

1. Set `FORM_API_SERVICE_TOKEN` environment variable
2. Restart PM Tool
3. Make a request through PM Tool UI (e.g., list employees)
4. Check PM Tool logs - should see successful calls

## Security Best Practices

1. **Store tokens securely**: Use environment variables or secret management (e.g., Kubernetes secrets, AWS Secrets Manager)
2. **Never commit tokens**: Add to `.gitignore` if storing in config files
3. **Use separate tokens**: Different tokens for different environments (dev, staging, prod)
4. **Set expiration**: For production, set reasonable expiration dates (e.g., 365 days)
5. **Monitor usage**: Check `lastUsedAt` in admin UI to monitor token usage
6. **Revoke immediately**: If a token is compromised, revoke it immediately in admin UI

## Troubleshooting

### Token Not Working

1. **Check token format**: Should start with `Bearer ` in Authorization header
2. **Check expiration**: Verify token hasn't expired in admin UI
3. **Check revocation**: Verify token hasn't been revoked
4. **Check logs**: Check Form Builder backend logs for authentication errors

### PM Tool Can't Connect

1. **Check environment variable**: Verify `FORM_API_SERVICE_TOKEN` is set
2. **Check configuration**: Verify `application.yml` includes service token config
3. **Check base URL**: Verify `form-api.base-url` is correct
4. **Check network**: Verify PM Tool can reach Form Builder backend

### Legacy Token Still Required

If you're still using `technical-token`:
- It's still supported for backward compatibility
- Consider migrating to service tokens for better security
- Service tokens are prioritized over technical tokens

## API Reference

### Create Token

```http
POST /api/service-tokens
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "PM Tool Production",
  "description": "Service token for PM Tool backend",
  "expiresInDays": 365
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "PM Tool Production",
  "description": "Service token for PM Tool backend",
  "token": "xYz123AbC...",  // Only shown once!
  "createdAt": "2025-11-10T10:00:00Z",
  "expiresAt": "2026-11-10T10:00:00Z",
  "lastUsedAt": null,
  "active": true
}
```

### List Tokens

```http
GET /api/service-tokens
Authorization: Bearer <admin-jwt-token>
```

### Revoke Token

```http
DELETE /api/service-tokens/{id}
Authorization: Bearer <admin-jwt-token>
```

## Rollback Plan

If you need to rollback:

1. Remove `FORM_API_SERVICE_TOKEN` environment variable
2. Optionally set `FORM_API_TECHNICAL_TOKEN` (legacy)
3. Restart PM Tool
4. PM Tool will fall back to user JWT tokens (if available)

## Future Enhancements

- Token scoping (limit permissions)
- Token rotation (automatic renewal)
- Rate limiting per token
- Usage analytics dashboard

