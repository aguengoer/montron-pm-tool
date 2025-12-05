# Tagesdetail 3-Column View Implementation

## Overview

Implementing the static 3-column layout with dynamic form rendering for the Tagesdetail view.

## Architecture: Hybrid Approach

- **Static Layout**: 3-column desktop layout as per MVP spec
- **Dynamic Fields**: Renders any form from mobile form builder
- **Editable**: Inline editing with validation
- **Configurable**: Field mappings for validation logic

```
┌──────────────────────────────────────────────────────────────┐
│  MUSTERMANN MAX - FREITAG, 05.12.2025                       │
├──────────────┬──────────────┬──────────────┬──────────────┐
│ TAGESBERICHT │ REGIESCHEINE │ STREETWATCH  │ PRÜFHINWEISE  │
│ (Dynamic)    │ (Dynamic)    │ (Read-only)  │ (Calculated)  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

## Phase 1: Backend ✅ COMPLETE

### New DTOs

1. **`FormDefinitionDto`** - Form structure from mobile form builder
   - Fields, types, labels, validation rules
   
2. **`FormWithSubmissionDto`** - Form definition + actual data
   - Combines schema with values
   - Tracks changes (originalData vs data)
   
3. **`TagesdetailResponse`** - Complete 3-column data
   - Tagesbericht (single form)
   - Regiescheine (list of forms)
   - Streetwatch (read-only table)
   - Validation issues

### New Services

1. **`TagesdetailService`**
   - `getTagesdetail(employeeId, date)` - Fetches all data
   - Separates submissions by form type
   - Calculates validation issues
   
2. **`FormBackendClient` (Enhanced)**
   - `getSubmissionDetail(id)` - Full submission data
   - `getFormDefinition(id)` - Form schema/structure

### New Endpoint

```http
GET /api/employees/{employeeId}/tagesdetail/{date}

Response:
{
  "employeeId": "uuid",
  "employeeName": "Max Mustermann",
  "date": "2025-12-05",
  "tagesbericht": {
    "formDefinition": { /* schema */ },
    "data": { /* actual values */ },
    "originalData": { /* for change tracking */ }
  },
  "regiescheine": [ /* array of forms */ ],
  "streetwatch": {
    "entries": [ /* time tracking data */ ]
  },
  "validationIssues": [ /* calculated validations */ ]
}
```

## Phase 2: Frontend (Next)

###Human: continue
