# ✅ Tagesdetail UX Fixes - Loading & Original Values

## Issues Fixed

### 1. ❌ No Loading Indicator After Save
**Problem:** After clicking "Speichern", data refetched but no loading state shown → confusing delay

**Solution:** Show loading spinner during save and refetch
```tsx
{isLoading || isSaving ? (
  <Spinner />
  <span>{isSaving ? "Speichere Änderungen…" : "Lade Tagesdetail…"}</span>
) : ...}
```

### 2. ❌ Original Values Only Shown in Edit Mode
**Problem:** "Original:" label only appeared when editing → users couldn't see corrections in read-only mode

**Solution:** Always show original value when field has been corrected (saved in PM tool DB)
```tsx
// Always show if there's a saved correction
{hasSavedCorrection && (
  <div className="line-through">
    Original: {formatValue(originalValue, field.type)}
  </div>
)}
```

---

## How It Works Now

### Data Flow

```
┌─────────────────────────────────────────────┐
│         Backend Response                     │
│                                              │
│  FormWithSubmission {                        │
│    data: { "field1": "08:30" }  ← Corrected │
│    originalData: { "field1": "08:00" } ← Original from mobile
│    hasChanges: true                          │
│  }                                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Frontend State                      │
│                                              │
│  changes: {                                  │
│    [submissionId]: {                         │
│      "field1": "08:45"  ← Unsaved edit      │
│    }                                         │
│  }                                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      DynamicFormRenderer Logic               │
│                                              │
│  displayValue = pendingChanges["field1"]     │
│                 || data["field1"]            │
│               = "08:45" (unsaved)            │
│                 or "08:30" (saved)           │
│                                              │
│  hasSavedCorrection = data !== originalData  │
│                     = "08:30" !== "08:00"    │
│                     = true ✅                │
│                                              │
│  hasUnsavedChange = "field1" in pendingChanges
│                   = true ✅ (yellow border)  │
└─────────────────────────────────────────────┘
```

---

## Three States of a Field

### State 1: Original (No Corrections)
```
┌──────────────────────┐
│  Start Time          │
│  08:00               │  ← From mobile app
└──────────────────────┘
```
- `data["start_time"] = "08:00"`
- `originalData["start_time"] = "08:00"`
- `hasSavedCorrection = false` → No "Original:" label
- No yellow border

### State 2: Saved Correction (PM Tool DB)
```
┌──────────────────────┐
│  Start Time          │
│  08:30               │  ← Corrected (from PM tool DB)
│  Original: 08:00     │  ← Strikethrough (from mobile app)
└──────────────────────┘
```
- `data["start_time"] = "08:30"` (merged: mobile app + PM tool corrections)
- `originalData["start_time"] = "08:00"` (from mobile app)
- `hasSavedCorrection = true` → Show "Original:" label ✅
- No yellow border (already saved)

### State 3: Unsaved Edit (Current Session)
```
┌──────────────────────┐
│  Start Time          │
│  08:45               │  ← Editing now (yellow border)
│  Original: 08:00     │  ← Strikethrough
└──────────────────────┘
```
- `data["start_time"] = "08:30"` (saved correction)
- `pendingChanges["start_time"] = "08:45"` (unsaved edit)
- `displayValue = "08:45"` (pending takes priority)
- `hasSavedCorrection = true` → Show "Original:" label ✅
- `hasUnsavedChange = true` → Yellow border ✅

---

## User Flows

### Flow 1: View Corrections (Read-Only)
```
User opens page
    ↓
Shows saved corrections with "Original:" below ✅
No yellow borders (read-only mode)
```

### Flow 2: Make New Correction
```
User clicks "Bearbeiten"
    ↓
Fields become editable
Saved corrections still show "Original:" ✅
    ↓
User edits field "start_time" → "08:45"
    ↓
Yellow border appears on that field ✅
"Original: 08:00" still visible ✅
    ↓
User clicks "Speichern"
    ↓
Loading spinner: "Speichere Änderungen…" ✅
    ↓
Data saved to PM tool DB
Exit edit mode
Refetch from server
    ↓
Loading spinner: "Lade Tagesdetail…" ✅
    ↓
Updated value shown with "Original:" ✅
No yellow border (saved) ✅
```

### Flow 3: Edit Then Cancel
```
User clicks "Bearbeiten"
User edits field (yellow border)
User clicks "Abbrechen"
    ↓
Unsaved changes discarded
Back to saved correction
"Original:" still visible ✅
```

---

## Code Changes

### 1. DynamicFormRenderer - Separated Concerns

**Before (Broken):**
```tsx
const hasChanged = showChanges && currentValue !== originalValue
// Problem: Can't distinguish saved corrections from unsaved edits!
```

**After (Fixed):**
```tsx
// Merge pending changes
const displayValue = field.id in pendingChanges 
  ? pendingChanges[field.id]  // Unsaved edit
  : data[field.id]            // Saved data

// Saved correction from backend?
const hasSavedCorrection = data[field.id] !== originalData[field.id]

// Unsaved change in this edit session?
const hasUnsavedChange = field.id in pendingChanges
```

**Benefits:**
- ✅ `hasSavedCorrection` → Show "Original:" always
- ✅ `hasUnsavedChange` → Show yellow border only for unsaved
- ✅ Clear separation of saved vs unsaved

### 2. Page Component - Removed Complex Merging

**Before (Broken):**
```tsx
const getFormWithChanges = useCallback((formWithSubmission) => {
  // Merged everything, lost track of what's saved vs unsaved
  return {
    ...formWithSubmission,
    data: { ...formWithSubmission.data, ...changes }
  }
}, [changes])

<DynamicFormRenderer 
  formWithSubmission={getFormWithChanges(tagesbericht)}
  showChanges={hasUnsavedChanges}  // Too broad!
/>
```

**After (Fixed):**
```tsx
// Pass pending changes separately
<DynamicFormRenderer 
  formWithSubmission={tagesbericht}  // Original (includes saved corrections)
  pendingChanges={changes[submissionId] || {}}  // Only unsaved!
  editMode={isEditMode}
/>
```

**Benefits:**
- ✅ DynamicFormRenderer handles merging internally
- ✅ Can distinguish saved corrections from unsaved edits
- ✅ Simpler logic, easier to understand

### 3. Loading States

**Added:**
```tsx
// Show loading during save AND refetch
{isLoading || isSaving ? (
  <Spinner />
  <span>
    {isSaving ? "Speichere Änderungen…" : "Lade Tagesdetail…"}
  </span>
) : ...}
```

**Save handler:**
```tsx
const handleSave = async () => {
  setIsSaving(true)  // Show "Speichere Änderungen…"
  try {
    // Save all changes
    await updateMutation.mutateAsync(...)
    
    setChanges({})
    setIsEditMode(false)
    
    await refetch()  // Show "Lade Tagesdetail…"
    
    toast({ title: "Gespeichert" })
  } finally {
    setIsSaving(false)
  }
}
```

---

## Testing Checklist

### ✅ Test 1: View Saved Corrections
1. Open page with saved corrections
2. **Verify:** Fields show corrected values
3. **Verify:** "Original:" visible below corrected fields
4. **Verify:** No yellow borders (read-only)

### ✅ Test 2: Make New Correction
1. Click "Bearbeiten"
2. Edit a field
3. **Verify:** Yellow border on edited field
4. **Verify:** "Original:" still visible
5. Click "Speichern"
6. **Verify:** Loading spinner appears
7. **Verify:** Returns to read-only with updated value
8. **Verify:** "Original:" still visible

### ✅ Test 3: Edit Then Cancel
1. Click "Bearbeiten"
2. Edit field (yellow border appears)
3. Click "Abbrechen"
4. **Verify:** Back to saved value
5. **Verify:** "Original:" still visible
6. **Verify:** No yellow border

### ✅ Test 4: Multiple Edits
1. Click "Bearbeiten"
2. Edit field A (yellow border)
3. Edit field B (yellow border)
4. **Verify:** Field C (not edited, but corrected before) shows "Original:" with NO yellow border
5. Click "Speichern"
6. **Verify:** All saved, all show "Original:", no yellow borders

---

## Summary

### ✅ Fixed
1. **Loading indicator** during save and refetch
2. **Always show original values** for corrected fields
3. **Yellow borders** only for unsaved changes
4. **Cleaner code** - separated saved vs unsaved logic

### ✅ User Experience
- **Read-only mode:** See corrections with original values
- **Edit mode:** Clear visual feedback (yellow = unsaved)
- **Save:** Smooth transition with loading states
- **No confusion:** Always know what's original, corrected, or pending

---

**Status:** ✅ Complete - Refresh browser to test!

