# Fix: Service Token Lookup Issue

## Problem

**Symptom:** 401 Unauthorized errors after 15 minutes, even though service token was configured during setup.

**Root Cause:** Two separate service token storage locations that weren't connected:

1. **Setup Wizard** saves token to `mobile_link.service_token_enc` table (via `SetupService`)
2. **API Client** reads token from `form_api_config.service_token_encrypted` table (via `FormApiConfigService`)

The setup wizard token was never being used by the API client!

## Architecture Issue

### Before Fix

```
Setup Wizard Flow:
┌─────────────────────────────────────┐
│ User enters service token in setup  │
└────────────┬────────────────────────┘
             │
             v
┌─────────────────────────────────────┐
│ SetupService.configureWithServiceToken()
│ → Saves to mobile_link table        │
│ → service_token_enc column           │
└─────────────────────────────────────┘

API Call Flow:
┌─────────────────────────────────────┐
│ FormBackendClient.resolveBearerToken()
└────────────┬────────────────────────┘
             │
             v
┌─────────────────────────────────────┐
│ FormApiConfigService.getServiceToken()
│ → Reads from form_api_config table  │  ❌ Empty!
│ → service_token_encrypted column     │
└────────────┬────────────────────────┘
             │
             v
❌ Falls back to user JWT → Expires after 15 mins!
```

### After Fix

```
API Call Flow:
┌─────────────────────────────────────┐
│ FormBackendClient.resolveBearerToken()
└────────────┬────────────────────────┘
             │
             v
┌─────────────────────────────────────┐
│ FormApiConfigService.getServiceToken()
│                                      │
│ Priority 1:                          │
│ → Check form_api_config table        │  ❌ Empty
│                                      │
│ Priority 2 (NEW):                    │
│ → Fall back to mobile_link table     │  ✅ Found!
│   via SetupService.getServiceToken() │
└────────────┬────────────────────────┘
             │
             v
✅ Uses setup wizard token (never expires)
```

## Solution

Updated `FormApiConfigService.getServiceToken()` to check both locations:

1. **Priority 1:** Per-company config (`form_api_config` table) - for tokens set via Settings UI
2. **Priority 2:** Setup wizard token (`mobile_link` table) - for tokens set during initial setup

```java
@Transactional(readOnly = true)
public Optional<String> getServiceToken() {
    // Priority 1: Check per-company config (Settings UI)
    Optional<String> companyToken = getConfig().map(FormApiConfigDto::serviceToken);
    if (companyToken.isPresent()) {
        log.debug("Using service token from company config");
        return companyToken;
    }
    
    // Priority 2: Fall back to setup wizard token (if available)
    Optional<String> setupToken = setupService.getServiceToken();
    if (setupToken.isPresent()) {
        log.debug("Using service token from setup wizard (mobile_link)");
    }
    return setupToken;
}
```

## Complete Token Resolution Priority

`FormBackendClient.resolveBearerToken()` now checks:

1. **Per-company config** (`form_api_config` table)
   - Set via Settings UI
   - `FormApiConfigService.getServiceToken()`

2. **Setup wizard token** (`mobile_link` table)  ← **NEW FALLBACK**
   - Set during initial setup
   - `SetupService.getServiceToken()`

3. **Environment variable** `FORM_API_SERVICE_TOKEN`
   - For development/testing

4. **Legacy technical token** (deprecated)

5. **User JWT token** (last resort, expires after 15 mins)
   - Only for user-initiated requests

## Why @Lazy?

Used `@Lazy` injection for `SetupService` to avoid circular dependency:
- `SetupService` might depend on other services
- `FormApiConfigService` is used early in the application lifecycle

## Testing

After restarting the PM Tool backend, verify:

```bash
# Check which token source is being used
tail -f montron-pm-tool/backend/logs/application.log | grep "Using service token"

# Should see:
# "Using service token from setup wizard (mobile_link)"
```

## Migration Notes

- **No database migration needed** - existing setup wizard tokens will now be found
- **No user action required** - automatic fallback to setup wizard token
- **Backward compatible** - Settings UI tokens still take priority
- **No breaking changes** - all existing token resolution methods still work

## Files Changed

- `montron-pm-tool/backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigService.java`
  - Added `SetupService` dependency with `@Lazy` injection
  - Updated `getServiceToken()` to fall back to setup wizard token

## Related Documentation

- Setup wizard: `SERVICE_TOKEN_CONFIG_IMPLEMENTATION.md`
- Service tokens: `SERVICE_TOKEN_MIGRATION.md`
- Mobile app: `montron-mobile-app/backend/SERVICE_TOKEN_IMPLEMENTATION.md`

