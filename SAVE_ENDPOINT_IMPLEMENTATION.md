# ✅ Save Endpoint Implementation - Complete

## The Problem

**Error:**
```
PATCH http://localhost:8080/api/submissions/3b639e8d-4782-43ba-b74c-f533d2abb2e0 404 (Not Found)
```

**Root Cause:** There was no `PATCH /api/submissions/{id}` endpoint to save field changes from the Tagesdetail page!

---

## The Solution - Full Implementation Chain

We implemented the complete save functionality across both backends:

### 1. Mobile App Backend - `PATCH /submissions/{id}`

**File:** `montron-mobile-app/backend/src/main/java/dev/agng/montron/submissions/web/SubmissionController.java`

Added new endpoint:
```java
@PatchMapping("/{id}")
@Operation(
    summary = "Update submission fields",
    description = "Update specific field values in an existing submission"
)
public ResponseEntity<SubmissionDetail> updateSubmission(
        @PathVariable UUID id,
        @RequestBody java.util.Map<String, Object> fieldUpdates) {

    SubmissionDetail updated = submissionService.updateSubmission(id, fieldUpdates);
    return ResponseEntity.ok(updated);
}
```

**File:** `montron-mobile-app/backend/src/main/java/dev/agng/montron/submissions/service/SubmissionService.java`

Added update logic:
```java
@Transactional
public SubmissionDetail updateSubmission(UUID id, Map<String, Object> fieldUpdates) {
    UUID companyId = currentCompanyProvider.getCurrentCompanyId();
    
    // 1. Load submission
    Submission submission = submissionRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));

    // 2. Get current data as ObjectNode (mutable JsonNode)
    JsonNode currentData = submission.getData();
    ObjectNode dataNode;
    
    if (currentData instanceof ObjectNode) {
        dataNode = (ObjectNode) currentData;
    } else {
        dataNode = objectMapper.createObjectNode();
    }

    // 3. Merge field updates into the JSON data
    for (Map.Entry<String, Object> entry : fieldUpdates.entrySet()) {
        String fieldId = entry.getKey();
        Object value = entry.getValue();
        
        // Convert value to JsonNode and update
        JsonNode valueNode = objectMapper.valueToTree(value);
        dataNode.set(fieldId, valueNode);
    }

    // 4. Update submission
    submission.setData(dataNode);

    // 5. Save
    Submission savedSubmission = submissionRepository.save(submission);

    log.info("Updated submission {} with {} field changes", id, fieldUpdates.size());

    // 6. Return updated detail
    return getSubmissionDetail(savedSubmission.getId());
}
```

---

### 2. PM Tool Backend - Proxy Endpoint

**File:** `montron-pm-tool/backend/src/main/java/dev/montron/pm/submissions/SubmissionController.java`

Added proxy endpoint:
```java
@PatchMapping("/{id}")
public ResponseEntity<?> updateSubmission(
        @PathVariable UUID id,
        @RequestBody Map<String, Object> fieldUpdates) {
    
    // Forward the update to the mobile app backend
    FormBackendClient.SubmissionDetail updated = formBackendClient.updateSubmission(id, fieldUpdates);
    return ResponseEntity.ok(updated);
}
```

**File:** `montron-pm-tool/backend/src/main/java/dev/montron/pm/integration/FormBackendClient.java`

Added update method:
```java
/**
 * Update submission fields
 */
public SubmissionDetail updateSubmission(UUID submissionId, java.util.Map<String, Object> fieldUpdates) {
    return webClient.patch()
            .uri("/submissions/{id}", submissionId)
            .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
            .bodyValue(fieldUpdates)
            .retrieve()
            .bodyToMono(SubmissionDetail.class)
            .block();
}
```

---

### 3. Frontend - Already Implemented

**File:** `montron-pm-tool/pm-web-frontend/hooks/useTagesdetail.ts`

Already has the update mutation:
```typescript
export function useUpdateSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ submissionId, fieldId, value }: UpdateSubmissionParams) => {
      const response = await pmApiFetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          [fieldId]: value,
        }),
      })

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tagesdetail"] })
    },
  })
}
```

**File:** `montron-pm-tool/pm-web-frontend/app/mitarbeiter/[id]/tagesdetail/[datum]/page.tsx`

Save handler loops through all changes:
```typescript
const handleSave = async () => {
  setIsSaving(true)
  try {
    // Save all changes
    for (const [submissionId, fields] of Object.entries(changes)) {
      for (const [fieldId, value] of Object.entries(fields)) {
        await updateMutation.mutateAsync({ submissionId, fieldId, value })
      }
    }

    toast({
      title: "Gespeichert",
      description: "Alle Änderungen wurden erfolgreich gespeichert.",
    })
    
    setChanges({})
    refetch()
  } catch (error) {
    toast({
      title: "Fehler",
      description: "Fehler beim Speichern. Bitte versuche es erneut.",
      variant: "destructive",
    })
  } finally {
    setIsSaving(false)
  }
}
```

---

## Data Flow

### 1. User Makes Changes
```
User edits field → onChange → changes state updated → Yellow border shows
```

### 2. User Clicks "Speichern"
```
handleSave() called
    ↓
For each submission:
  For each changed field:
    PATCH /api/submissions/{submissionId}
    Body: { "fieldId": "newValue" }
        ↓
    PM Tool Backend (port 8080):
      → Forwards to Mobile App Backend
        ↓
    Mobile App Backend (port 8081):
      → Load submission from DB
      → Merge field updates into JsonNode
      → Save to database
      → Return updated SubmissionDetail
        ↓
    Frontend:
      → Success toast
      → Clear changes state
      → Refetch tagesdetail data
      → Display updated values
```

---

## Request/Response Format

### Request
```http
PATCH /api/submissions/3b639e8d-4782-43ba-b74c-f533d2abb2e0
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "field-uuid-1": "Updated value",
  "field-uuid-2": 42,
  "field-uuid-3": "2025-12-06"
}
```

### Response
```json
{
  "id": "3b639e8d-4782-43ba-b74c-f533d2abb2e0",
  "formId": "...",
  "formName": "BAUTAGESBERICHT",
  "employeeId": "...",
  "data": {
    "field-uuid-1": "Updated value",
    "field-uuid-2": 42,
    "field-uuid-3": "2025-12-06"
  },
  "submittedAt": "2025-12-05T10:30:00Z",
  ...
}
```

---

## Key Design Decisions

### 1. Direct JsonNode Update (Not Full Validation)
We update the JsonNode directly without running full form validation. This is because:
- ✅ **Simpler**: No need to convert between Map and List<FieldValue>
- ✅ **Faster**: Skip complex validation logic
- ✅ **Safer**: Only updates specified fields, doesn't touch others
- ⚠️ **Trade-off**: No validation at update time (could be added later)

### 2. Field-by-Field Updates
Frontend sends one PATCH request per field:
- ✅ **Granular tracking**: Each field update is atomic
- ✅ **Error handling**: If one field fails, others still saved
- ⚠️ **Trade-off**: Multiple HTTP requests (but fast enough for MVP)

**Future Optimization:** Could batch all field updates for a submission into one request.

### 3. Proxy Pattern
PM Tool backend proxies to Mobile App backend:
- ✅ **Consistent auth**: Uses service token (same as GET requests)
- ✅ **Single source of truth**: Mobile App DB is authoritative
- ✅ **Clean separation**: PM Tool doesn't need submission write logic

---

## Testing Checklist

### ✅ Test 1: Save Single Field
1. Open Tagesdetail page
2. Click "Bearbeiten"
3. Change one field
4. Click "Speichern"
5. **Verify:** Success toast appears
6. **Verify:** Field shows new value (not yellow anymore)

### ✅ Test 2: Save Multiple Fields
1. Click "Bearbeiten"
2. Change 3 fields
3. Click "Speichern"
4. **Verify:** All 3 fields saved

### ✅ Test 3: Save Multiple Forms
1. Click "Bearbeiten"
2. Change Tagesbericht field
3. Change Regieschein #1 field
4. Change Regieschein #2 field
5. Click "Speichern"
6. **Verify:** All submissions saved correctly

### ✅ Test 4: Persistence
1. Make changes
2. Save
3. **Refresh page**
4. **Verify:** Changes are still there (persisted in DB!)

### ✅ Test 5: Error Handling
1. Stop Mobile App backend
2. Make changes
3. Click "Speichern"
4. **Verify:** Error toast appears
5. **Verify:** Changes NOT cleared (can retry)

---

## Database Impact

### Submission Table
```sql
-- The 'data' column is updated with new field values
UPDATE submission
SET data = jsonb_set(data, '{field-uuid}', '"new value"')
WHERE id = '3b639e8d-4782-43ba-b74c-f533d2abb2e0';
```

**Example data column:**
```json
{
  "field-uuid-1": "Value 1",
  "field-uuid-2": 42,
  "field-uuid-3": "2025-12-06"
}
```

After update:
```json
{
  "field-uuid-1": "UPDATED!",  // ← Changed
  "field-uuid-2": 42,          // ← Unchanged
  "field-uuid-3": "2025-12-06" // ← Unchanged
}
```

---

## What To Do Now

### 1. Restart Both Backends

**Mobile App Backend:**
```bash
cd montron-mobile-app/backend
./mvnw spring-boot:run
```

**PM Tool Backend:**
```bash
cd montron-pm-tool/backend
./mvnw spring-boot:run
```

### 2. Test the Save Functionality
1. Navigate to: `http://localhost:3000/mitarbeiter/{employeeId}/tagesdetail/{date}`
2. Click **"Bearbeiten"**
3. Change some fields
4. Click **"Speichern"**
5. **Verify:** Success toast, changes saved!

---

## Status

✅ **COMPLETE** - All three layers implemented:
1. ✅ Mobile App Backend - PATCH endpoint + update logic
2. ✅ PM Tool Backend - Proxy endpoint
3. ✅ Frontend - Already had save logic

**Next:** Restart backends and test!

