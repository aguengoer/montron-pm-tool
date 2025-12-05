# ✅ SOLUTION: Fixed 401 Unauthorized After 15 Minutes

## What Was Wrong

You configured a service token during PM Tool setup, and it worked for ~15 minutes, then started failing with 401 errors.

**The bug:** The setup wizard saved the service token to the `mobile_link` table, but the API client was only checking the `form_api_config` table. Since that table was empty, it fell back to using user JWT tokens, which expire after 15 minutes.

## What Was Fixed

Updated `FormApiConfigService` to check **both** locations:
1. `form_api_config` table (Settings UI) - **empty**
2. `mobile_link` table (Setup wizard) - **✅ your token is here!**

Now the API client will find and use your setup wizard token.

## What You Need To Do

**Just restart the PM Tool backend:**

```bash
cd montron-pm-tool/backend
./mvnw spring-boot:restart
```

Or if using Docker:
```bash
docker-compose restart pm-backend
```

That's it! The 401 errors should be gone.

## How To Verify

1. **Restart the backend** (see above)

2. **Check logs** to see which token is being used:
```bash
tail -f montron-pm-tool/backend/logs/application.log | grep "Using service token"
```

You should see: `Using service token from setup wizard (mobile_link)`

3. **Test the API** - the 401 errors should be gone:
```bash
# The requests that were failing should now work
# Check your PM Tool frontend or make API calls
```

## Token Resolution Order (After Fix)

```
FormBackendClient checks tokens in this order:
1. Per-company config (Settings UI)     [empty in your case]
2. Setup wizard token (mobile_link)     [✅ YOUR TOKEN - now works!]
3. Environment variable                 [empty]
4. Legacy technical token               [empty]
5. User JWT token                       [expires after 15 mins - was fallback]
```

## Why It Worked For 15 Minutes

Before the fix, the system fell through all the way to #5 (User JWT token). This token is created when you login to the PM Tool web interface and expires after 15 minutes. That's why it worked initially then stopped.

Now it uses your setup wizard token (#2), which never expires!

## No Data Loss

- ✅ Your service token is safe in the database
- ✅ No configuration changes needed
- ✅ No re-setup required
- ✅ Backward compatible (if you set a token via Settings UI, it still takes priority)

## Files Changed

```
montron-pm-tool/backend/src/main/java/dev/montron/pm/integration/config/FormApiConfigService.java
  - Added SetupService dependency
  - Updated getServiceToken() to check mobile_link table as fallback
```

## Related Documentation

- Technical details: `FIX_SERVICE_TOKEN_LOOKUP.md`
- Setup implementation: `SERVICE_TOKEN_CONFIG_IMPLEMENTATION.md`

