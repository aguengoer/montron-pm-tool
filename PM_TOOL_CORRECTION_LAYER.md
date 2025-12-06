# ✅ PM Tool Correction Layer - The Right Way

## The Key Insight

> **Mobile App data is READ-ONLY. PM Tool stores corrections in its own database.**

This is the correct approach for MVP! The mobile app submissions represent what employees actually submitted. The PM tool adds a "correction layer" on top without modifying the original data.

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                   PM TOOL FRONTEND                      │
│  Shows: Original Data + Corrections (merged)            │
└─────────────────────────────────────────────────────────┘
                        ↑     ↓
                    GET │     │ PATCH (save corrections)
                        │     ↓
┌─────────────────────────────────────────────────────────┐
│                PM TOOL BACKEND (Port 8080)              │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │   submission_field_correction (table)      │        │
│  │                                             │        │
│  │  • submission_id (reference to mobile)     │        │
│  │  • field_id                                │        │
│  │  • corrected_value                         │        │
│  │  • original_value (audit trail)            │        │
│  │  • corrected_by (user)                     │        │
│  │  • created_at, updated_at                  │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                        ↑
                    GET │ (read-only!)
                        │
┌─────────────────────────────────────────────────────────┐
│          MOBILE APP BACKEND (Port 8081)                 │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │   submission (table)                       │        │
│  │                                             │        │
│  │  • Original employee submissions           │        │
│  │  • NEVER modified by PM tool              │        │
│  │  • Source of truth for what was submitted  │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### PM Tool Database

**New Table:** `submission_field_correction`

```sql
CREATE TABLE submission_field_correction (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL,        -- Reference to mobile app submission
    field_id VARCHAR(255) NOT NULL,      -- Which field was corrected
    corrected_value TEXT,                -- The new value
    original_value TEXT,                 -- Original from mobile app (audit)
    corrected_by UUID NOT NULL,          -- Who made the correction
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_submission_field UNIQUE (submission_id, field_id)
);
```

**Key Points:**
- ✅ No foreign key to mobile app (different database!)
- ✅ `submission_id` is just a reference (UUID)
- ✅ One correction per submission+field combination
- ✅ Audit trail: original_value, corrected_by, timestamps

---

## Code Implementation

### 1. Entity Class

**File:** `SubmissionFieldCorrection.java`

```java
@Entity
@Table(name = "submission_field_correction")
public class SubmissionFieldCorrection {
    @Id
    private UUID id;
    
    private UUID submissionId;  // Reference to mobile app
    private String fieldId;
    private String correctedValue;
    private String originalValue;  // For audit
    private UUID correctedBy;
    
    // Timestamps (auto-managed)
    private Instant createdAt;
    private Instant updatedAt;
}
```

### 2. Repository

**File:** `SubmissionFieldCorrectionRepository.java`

```java
@Repository
public interface SubmissionFieldCorrectionRepository 
        extends JpaRepository<SubmissionFieldCorrection, UUID> {
    
    List<SubmissionFieldCorrection> findBySubmissionId(UUID submissionId);
    
    Optional<SubmissionFieldCorrection> findBySubmissionIdAndFieldId(
        UUID submissionId, String fieldId);
}
```

### 3. Service - Save Corrections

**File:** `SubmissionService.java`

```java
@Transactional
public void saveFieldCorrections(UUID submissionId, Map<String, Object> fieldUpdates) {
    CurrentUser currentUser = currentUserService.getCurrentUser();
    
    // Get original data from mobile app (for audit trail)
    SubmissionDetail originalSubmission = formBackendClient.getSubmissionDetail(submissionId);
    
    for (Map.Entry<String, Object> entry : fieldUpdates.entrySet()) {
        String fieldId = entry.getKey();
        Object newValue = entry.getValue();
        Object originalValue = originalSubmission.data().get(fieldId);
        
        // Find or create correction
        SubmissionFieldCorrection correction = correctionRepository
            .findBySubmissionIdAndFieldId(submissionId, fieldId)
            .orElse(new SubmissionFieldCorrection());
        
        correction.setSubmissionId(submissionId);
        correction.setFieldId(fieldId);
        correction.setCorrectedValue(convertToString(newValue));
        
        // Save original only on first correction
        if (correction.getId() == null) {
            correction.setOriginalValue(convertToString(originalValue));
        }
        
        correction.setCorrectedBy(currentUser.userId());
        correctionRepository.save(correction);
    }
}
```

### 4. Service - Get Corrections

```java
public Map<String, Object> getCorrections(UUID submissionId) {
    List<SubmissionFieldCorrection> corrections = 
        correctionRepository.findBySubmissionId(submissionId);
    
    return corrections.stream()
        .collect(Collectors.toMap(
            SubmissionFieldCorrection::getFieldId,
            c -> parseValue(c.getCorrectedValue())
        ));
}
```

### 5. Merge Corrections When Fetching

**File:** `TagesdetailService.java`

```java
private FormWithSubmissionDto buildFormWithSubmission(FormSubmissionListItem item) {
    // 1. Get original data from mobile app
    SubmissionDetail detail = formBackendClient.getSubmissionDetail(submissionId);
    
    // 2. Get corrections from PM tool database
    Map<String, Object> corrections = submissionService.getCorrections(submissionId);
    
    // 3. Merge corrections into displayed data
    Map<String, Object> displayedData = new HashMap<>(detail.data());
    displayedData.putAll(corrections); // Overwrite with corrections
    
    return new FormWithSubmissionDto(
        formDefDto,
        submissionId,
        displayedData,       // ← Current view (original + corrections)
        detail.data(),       // ← Original from mobile app
        !corrections.isEmpty(), // hasChanges
        ...
    );
}
```

### 6. Controller - PATCH Endpoint

**File:** `SubmissionController.java`

```java
@PatchMapping("/{id}")
public ResponseEntity<?> updateSubmission(
        @PathVariable UUID id,
        @RequestBody Map<String, Object> fieldUpdates) {
    
    // Save in PM tool DB (NOT mobile app!)
    submissionService.saveFieldCorrections(id, fieldUpdates);
    
    return ResponseEntity.ok(Map.of(
        "success", true, 
        "updatedFields", fieldUpdates.size()
    ));
}
```

---

## Complete User Flow

### 1. User Opens Tagesdetail Page

```
Frontend requests: GET /api/employees/{id}/tagesdetail/{date}
    ↓
PM Tool Backend:
  1. Fetch submissions from Mobile App → Original data
  2. Fetch corrections from PM Tool DB  → Corrections
  3. Merge: displayed = original + corrections
  4. Return merged data
    ↓
Frontend displays:
  - Current values (merged)
  - Original values shown with strikethrough if corrected
  - Yellow borders on corrected fields
```

### 2. User Makes Corrections

```
User clicks "Bearbeiten"
User changes field "start_time" from "08:00" to "08:30"
User clicks "Speichern"
    ↓
Frontend sends: PATCH /api/submissions/{id}
Body: { "field-uuid-1": "08:30" }
    ↓
PM Tool Backend:
  1. Get current user ID
  2. Fetch original value from Mobile App ("08:00")
  3. Save to submission_field_correction:
     - submission_id: {id}
     - field_id: "field-uuid-1"
     - corrected_value: "08:30"
     - original_value: "08:00"  ← Audit trail!
     - corrected_by: {user-id}
  4. Return success
    ↓
Mobile App submission: UNCHANGED ✅
PM Tool correction: SAVED ✅
```

### 3. User Refreshes Page

```
Frontend requests: GET /api/employees/{id}/tagesdetail/{date}
    ↓
PM Tool Backend:
  1. Fetch from Mobile App: { "field-uuid-1": "08:00" }  ← Original
  2. Fetch corrections: { "field-uuid-1": "08:30" }      ← Correction
  3. Merge: { "field-uuid-1": "08:30" }                  ← Displayed
    ↓
Frontend shows "08:30" (corrected value) ✅
Original "08:00" shown with strikethrough below
```

---

## Benefits of This Approach

### 1. Data Integrity ✅
- **Mobile app data is untouched** - it's the source of truth for what was submitted
- **PM tool adds corrections** - without destroying original data
- **Full audit trail** - can always see what was originally submitted

### 2. Clear Separation of Concerns ✅
- **Mobile App** = Employee submissions (what happened)
- **PM Tool** = Office corrections (what should be billed)
- Each system has its own database and responsibility

### 3. Flexibility ✅
- **Can undo corrections** - just delete from PM tool DB
- **Can see correction history** - who changed what and when
- **No risk to mobile app** - completely isolated

### 4. MVP-Friendly ✅
- **Simple to implement** - just one new table
- **No complex sync** - read from mobile app, write to PM tool
- **Can evolve later** - could add approval workflow, etc.

---

## Example Database State

### Mobile App DB (UNCHANGED)

**submission table:**
```
id: 3b639e8d-4782-43ba-b74c-f533d2abb2e0
data: {
  "start_time": "08:00",
  "end_time": "16:00",
  "break_minutes": "30"
}
```

### PM Tool DB (CORRECTIONS)

**submission_field_correction table:**
```
Row 1:
  id: 7f8a9b0c-1234-5678-90ab-cdef12345678
  submission_id: 3b639e8d-4782-43ba-b74c-f533d2abb2e0
  field_id: "start_time"
  corrected_value: "\"08:30\""
  original_value: "\"08:00\""
  corrected_by: {admin-user-id}
  created_at: 2025-12-06 22:00:00
  updated_at: 2025-12-06 22:00:00

Row 2:
  id: 8f9a0b1c-2345-6789-01ab-def123456789
  submission_id: 3b639e8d-4782-43ba-b74c-f533d2abb2e0
  field_id: "break_minutes"
  corrected_value: "\"45\""
  original_value: "\"30\""
  corrected_by: {admin-user-id}
  created_at: 2025-12-06 22:01:00
  updated_at: 2025-12-06 22:01:00
```

### Frontend Displays (MERGED)

```json
{
  "start_time": "08:30",    // ← Corrected
  "end_time": "16:00",      // ← Original (no correction)
  "break_minutes": "45"     // ← Corrected
}

// Original values shown with strikethrough:
// "Start Time: 08:30" (old: 08:00)
// "Break: 45 min" (old: 30)
```

---

## What About the Mobile App PATCH Endpoint?

**We still have it**, but it's **not used by PM tool** for MVP.

- ✅ **Kept for future** - might be useful for mobile app itself
- ✅ **No harm** - just inactive code
- ✅ **Clean separation** - PM tool doesn't call it

**Future use case:** If mobile app itself needs to update submissions (e.g., employee corrects their own submission before approval), that endpoint would be used. But PM tool uses its own correction layer.

---

## Migration Required

Before starting the backend, **run the migration**:

```bash
cd montron-pm-tool/backend
./mvnw spring-boot:run
```

The migration `V8__submission_field_corrections.sql` will automatically create the new table.

---

## Testing Checklist

### ✅ Test 1: Make First Correction
1. Open Tagesdetail page
2. Click "Bearbeiten"
3. Change a field value
4. Click "Speichern"
5. **Check PM tool DB:**
   ```sql
   SELECT * FROM submission_field_correction;
   -- Should see 1 row with original and corrected values
   ```
6. **Check Mobile App DB:**
   ```sql
   SELECT data FROM submission WHERE id = '...';
   -- Should be UNCHANGED!
   ```

### ✅ Test 2: Update Existing Correction
1. Open same submission
2. Change the same field again
3. Save
4. **Check PM tool DB:**
   ```sql
   SELECT * FROM submission_field_correction WHERE submission_id = '...';
   -- Should see 1 row (updated, not new row!)
   -- original_value should still be the first original
   -- corrected_value should be the new value
   ```

### ✅ Test 3: Multiple Corrections
1. Change 3 different fields
2. Save
3. **Check PM tool DB:**
   ```sql
   SELECT COUNT(*) FROM submission_field_correction WHERE submission_id = '...';
   -- Should see 3 rows (one per field)
   ```

### ✅ Test 4: Display Merged Data
1. Refresh page
2. **Verify:**
   - Corrected fields show new values
   - Original values shown with strikethrough
   - Fields without corrections show original values

### ✅ Test 5: Audit Trail
1. Check who made corrections:
   ```sql
   SELECT field_id, corrected_value, corrected_by, created_at 
   FROM submission_field_correction 
   WHERE submission_id = '...';
   ```
2. **Verify:** All corrections have correct user ID and timestamps

---

## Summary

### ✅ What We Did
1. Created `submission_field_correction` table in PM tool DB
2. Created entity, repository, service for corrections
3. Updated save endpoint to store in PM tool (not mobile app)
4. Updated fetch logic to merge corrections with original data
5. Frontend already handles everything correctly

### ✅ What Changed
- **Before:** Tried to save back to mobile app (wrong!)
- **After:** Save corrections in PM tool, original data stays in mobile app (correct!)

### ✅ To Test
1. Restart PM tool backend (to run migration)
2. Make some corrections
3. Check both databases to verify separation
4. Refresh page to see merged view

---

**Status:** ✅ COMPLETE - Proper correction layer implemented!

**Next:** Restart PM tool backend and test the correction workflow!

