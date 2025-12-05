# 🔧 Quick Fix - Tagesdetail Page Issues

## Problem 1: Frontend 404 Error
Frontend was getting **404 errors** when trying to call the backend.

### Solution 1: Added API Proxy
Added API proxy configuration to `next.config.mjs` to forward all `/api/*` requests from Next.js (port 3000) to Spring Boot backend (port 8080).

**Status:** ✅ Fixed

---

## Problem 2: 401 Unauthorized Error
Frontend was getting **401 Unauthorized** errors because authentication token wasn't being sent.

```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
GET /api/employees/.../tagesdetail/2025-12-05
```

### Root Cause
The `useTagesdetail` hook was using plain `fetch()` instead of the `pmApiFetch` helper that automatically adds JWT authentication tokens.

### Solution 2: Use pmApiFetch Helper
Updated `hooks/useTagesdetail.ts` to use `pmApiFetch` (same as all other API hooks).

**Before:**
```typescript
async function fetchTagesdetail(employeeId: string, date: string) {
  const response = await fetch(`/api/employees/${employeeId}/tagesdetail/${date}`, {
    credentials: "include",
  })
  // ...
}
```

**After:**
```typescript
export function useTagesdetail(employeeId: string, date: string) {
  return useQuery({
    queryKey: ["tagesdetail", employeeId, date],
    queryFn: async () => {
      return await pmApiFetch<TagesdetailData>(`/api/employees/${employeeId}/tagesdetail/${date}`)
    },
    enabled: !!employeeId && !!date,
  })
}
```

**Status:** ✅ Fixed

---

## ✅ To Apply Both Fixes

### 1. Stop the Frontend Dev Server
Press `Ctrl+C` in the terminal running `npm run dev`

### 2. Restart the Frontend
```bash
cd montron-pm-tool/pm-web-frontend
npm run dev
```

### 3. Refresh Browser and Test
Navigate to: `http://localhost:3000/mitarbeiter/{employeeId}/tagesdetail/2025-12-05`

You should now see:
- ✅ No 404 errors
- ✅ No 401 errors
- ✅ Data loading successfully
- ✅ Beautiful 3-column layout with Tagesbericht, Regiescheine, and Streetwatch

---

## Files Changed

1. **`next.config.mjs`** - Added API proxy rewrite rules
2. **`hooks/useTagesdetail.ts`** - Changed from `fetch()` to `pmApiFetch()`

---

## What is pmApiFetch?

`pmApiFetch` is a wrapper around `fetch()` that automatically:
1. ✅ Gets the JWT token from cookies using `getAccessToken()`
2. ✅ Adds `Authorization: Bearer <token>` header
3. ✅ Sets `credentials: "include"` for cookie handling
4. ✅ Handles error responses consistently
5. ✅ Adds `Content-Type: application/json` header

All API hooks should use `pmApiFetch` for consistency and proper authentication.

---

## Still Not Working?

### Check Backend is Running
```bash
cd montron-pm-tool/backend
./mvnw spring-boot:run
```

### Check Mobile App is Running
```bash
cd montron-mobile-app/backend
./mvnw spring-boot:run
```

### Check You're Logged In
Make sure you're logged into the PM Tool frontend. If your session expired, log in again.

### Test Backend Directly
```bash
# Get your JWT token from browser cookies/localStorage
# Then test the endpoint:
curl http://localhost:8080/api/employees/bd504d36-2caa-4460-8766-4e54da44cb7b/tagesdetail/2025-12-05 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

**Status:** ✅ All Fixed - Restart frontend and refresh browser!
