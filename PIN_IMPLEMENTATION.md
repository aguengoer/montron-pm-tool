# 🔐 PIN Implementation - Complete Guide

## Overview

A complete PIN management system for secure release operations in the Montron PM-Tool.

**Features:**
- ✅ 4-digit PIN setup and management
- ✅ BCrypt encryption (never stores cleartext)
- ✅ Rate limiting: 3 failed attempts → 30 min lock
- ✅ Beautiful UI with individual digit inputs
- ✅ Auto-verification when 4 digits entered
- ✅ Settings page for PIN management
- ✅ Status tracking (set/locked/attempts)

---

## Backend Implementation

### 1. Database Schema

**Table:** `user_pin` (already in V4 migration)

```sql
CREATE TABLE user_pin (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,      -- BCrypt hash
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (company_id, user_id)
);
```

### 2. Core Classes

**Package:** `dev.montron.pm.security.pin`

**Entity:**
- `UserPinEntity.java` - JPA entity with all PIN fields (extends AbstractTenantEntity)

**Repository:**
- `UserPinRepository.java` - Spring Data JPA repository

**Service:**
- `PinService.java` - Business logic:
  - `setPin(String pin)` - Set/update PIN
  - `verifyPinForCurrentUser(String pin)` - Verify with rate limiting
  - `getPinStatus()` - Get status for current user

**Controller:**
- `PinController.java` - REST endpoints

### 3. API Endpoints

**Base Path:** `/api/users/me/pin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Set or update PIN |
| `POST` | `/verify` | Verify PIN (rate limited) |
| `GET` | `/status` | Get PIN status |

**Example Requests:**

```bash
# Set PIN
curl -X POST http://localhost:8080/api/users/me/pin \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'

# Verify PIN
curl -X POST http://localhost:8080/api/users/me/pin/verify \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'

# Get status
curl http://localhost:8080/api/users/me/pin/status \
  -H "Authorization: Bearer YOUR_JWT"
```

**Example Responses:**

```json
// Success
{
  "message": "PIN erfolgreich gesetzt"
}

// Status
{
  "isSet": true,
  "isLocked": false,
  "lockedUntil": null,
  "failedAttempts": 0
}

// Locked (HTTP 423)
{
  "message": "Zu viele Fehlversuche. PIN gesperrt für 30 Minuten.",
  "lockedUntil": "2025-12-07T12:30:00Z"
}

// Wrong PIN (HTTP 401)
{
  "message": "PIN ungültig. Noch 2 Versuche übrig."
}
```

### 4. Security Features

**Rate Limiting:**
- 3 failed attempts → locked for 30 minutes
- Lock automatically expires after 30 minutes
- Successful verification resets failed attempts

**Encryption:**
- BCrypt with Spring Security's `PasswordEncoder`
- Never stores PIN in cleartext
- Each PIN has unique salt

**Validation:**
- Must be exactly 4 digits
- Regex: `^\d{4}$`

---

## Frontend Implementation

### 1. API Client

**File:** `lib/api/pin.ts`

```typescript
import { pmApiFetch } from "./client"

export async function getPinStatus(): Promise<PinStatus>
export async function setPin(pin: string): Promise<PinResponse>
export async function verifyPin(pin: string): Promise<PinResponse>
```

### 2. React Hooks

**File:** `hooks/usePin.ts`

```typescript
// Fetch PIN status
const { data: pinStatus, isLoading } = usePinStatus()

// Set PIN mutation
const setMutation = useSetPin()
await setMutation.mutateAsync("1234")

// Verify PIN mutation
const verifyMutation = useVerifyPin()
await verifyMutation.mutateAsync("1234")
```

### 3. Components

**`PinInput.tsx`** - Individual digit input boxes
- 4 separate inputs for each digit
- Auto-focus next input on entry
- Supports paste (full PIN)
- Keyboard navigation (arrows, backspace)
- Error state styling

**`PinSetupDialog.tsx`** - PIN setup/change dialog
- Two-step verification (enter + confirm)
- Validation (4 digits, matching)
- Success confirmation
- Auto-close after success

**`PinVerifyDialog.tsx`** - PIN verification for release
- Auto-submit when 4 digits entered
- Shows error messages
- Displays lock countdown
- Clears PIN on error for retry

### 4. Settings Page

**Route:** `/einstellungen`

**Features:**
- Shows PIN status (set/not set/locked)
- Button to setup or change PIN
- Displays failed attempts
- Security information
- Lock countdown if locked

---

## Usage Examples

### Backend: Verify PIN in Release Service

```java
@Service
public class ReleaseService {
    private final PinService pinService;
    
    public void releaseWorkday(UUID workdayId, String pin) {
        // Verify PIN (throws exception if wrong/locked)
        // This checks the current authenticated user automatically
        pinService.verifyPinForCurrentUser(pin);
        
        // Proceed with release...
    }
}
```

### Frontend: Use PIN Verification in Release Flow

```typescript
import { PinVerifyDialog } from "@/components/pin/PinVerifyDialog"

export function TagesdetailPage() {
  const [showPinDialog, setShowPinDialog] = useState(false)

  const handleFreigeben = () => {
    // Show PIN verification dialog
    setShowPinDialog(true)
  }

  const handlePinVerified = async (pin: string) => {
    // PIN is valid, proceed with release
    await releaseWorkday(workdayId, pin)
  }

  return (
    <>
      <Button onClick={handleFreigeben}>Freigeben</Button>

      <PinVerifyDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinVerified}
      />
    </>
  )
}
```

---

## Testing Guide

### 1. Backend Tests

**Manual testing with curl:**

```bash
# 1. Set PIN
curl -X POST http://localhost:8080/api/users/me/pin \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'

# 2. Verify correct PIN
curl -X POST http://localhost:8080/api/users/me/pin/verify \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'
# → Should return 200 OK

# 3. Verify wrong PIN (3 times)
for i in {1..3}; do
  curl -X POST http://localhost:8080/api/users/me/pin/verify \
    -H "Authorization: Bearer YOUR_JWT" \
    -H "Content-Type: application/json" \
    -d '{"pin": "9999"}'
done
# → First 2: 401 with remaining attempts
# → Third: 423 LOCKED

# 4. Try again (should be locked)
curl -X POST http://localhost:8080/api/users/me/pin/verify \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'
# → Should return 423 LOCKED

# 5. Check status
curl http://localhost:8080/api/users/me/pin/status \
  -H "Authorization: Bearer YOUR_JWT"
# → Should show isLocked: true, lockedUntil: [timestamp]
```

### 2. Frontend Tests

**Manual UI testing:**

1. **Navigate to Settings:**
   - Go to `http://localhost:3000/einstellungen`
   - Should show "PIN not set" message

2. **Setup PIN:**
   - Click "PIN jetzt einrichten"
   - Enter `1234` in first input
   - Enter `1234` in confirm input
   - Click "PIN speichern"
   - Should show success message
   - Dialog closes, status updates to "PIN eingerichtet"

3. **Change PIN:**
   - Click "PIN ändern"
   - Enter new PIN twice
   - Should update successfully

4. **Test Verification:**
   - Go to a Tagesdetail page
   - Click "Freigeben" button
   - PIN dialog should open
   - Enter correct PIN → should work
   - Enter wrong PIN 3 times → should lock
   - Try again → should show lock countdown

5. **Test Auto-Submit:**
   - Open PIN verification dialog
   - Start typing PIN
   - After 4th digit, should auto-submit
   - No need to click confirm button

---

## Security Considerations

**✅ Implemented:**
- BCrypt encryption (slow hash, resistant to brute force)
- Rate limiting (3 attempts, 30 min lock)
- Automatic lock expiry
- Failed attempt tracking
- Multi-tenancy isolation (company_id + user_id)

**⚠️ Additional Recommendations:**
- **2FA**: Consider adding TOTP/SMS for extra security
- **Audit log**: Log all PIN verification attempts
- **Admin override**: Allow admins to unlock users
- **PIN expiry**: Force PIN change every N months
- **Complexity**: Optionally require non-sequential digits

---

## Database Queries

**Check PIN status for a user:**
```sql
SELECT user_id, failed_attempts, locked_until, created_at
FROM user_pin
WHERE user_id = 'uuid-here' AND company_id = 'uuid-here';
```

**Unlock a user manually:**
```sql
UPDATE user_pin
SET failed_attempts = 0, locked_until = NULL
WHERE user_id = 'uuid-here' AND company_id = 'uuid-here';
```

**Delete PIN (for testing):**
```sql
DELETE FROM user_pin
WHERE user_id = 'uuid-here' AND company_id = 'uuid-here';
```

---

## Troubleshooting

### "Kein PIN gesetzt"
→ User needs to set PIN first in `/einstellungen`

### "PIN gesperrt"
→ Too many failed attempts. Wait 30 minutes or manually unlock in DB.

### PIN not working after change
→ Check if `updated_at` timestamp changed in database
→ Clear browser cache/cookies

### "package dev.montron.pm.auth does not exist"
→ Fix import: use `dev.montron.pm.common.CurrentUser`

---

**Status:** ✅ **Fully Implemented & Ready for Testing**

**Next Steps:**
1. Restart PM tool backend: `cd backend && ./mvnw spring-boot:run`
2. Open frontend: `http://localhost:3000/einstellungen`
3. Set up your PIN
4. Test verification in release flow (next implementation phase)

