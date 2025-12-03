# Submissions Proxy Implementation

## Overview

The PM tool now fetches **submissions directly from the form builder backend** and displays them grouped by date in the employee date selection view. This follows the same proxy pattern as the employee data.

## Architecture

```
PM Tool Frontend
    └── useEmployeeSubmissions hook
        └── Calls /api/submissions

PM Tool Backend
    └── SubmissionController (/api/submissions)
        └── SubmissionService (proxy)
            └── FormBackendClient
                └── Form Builder Backend (/api/submissions)
```

## Backend Implementation

### 1. FormBackendClient

Added submission-related records and methods:

```java
// DTOs for form builder response
public record FormSubmissionListItem(
    String id,
    String formId,
    String formName,
    Integer formVersion,
    String employeeId,
    String employeeUsername,
    Instant submittedAt,
    Boolean hasAttachments
)

public record FormSubmissionPage(
    List<FormSubmissionListItem> content,
    int page,
    int size,
    long totalElements,
    int totalPages
)

// Method to fetch submissions
public FormSubmissionPage listSubmissions(
    Instant from,
    Instant to,
    UUID employeeId,
    UUID formId,
    Boolean hasAttachments,
    int page,
    int size
)
```

### 2. SubmissionService

Proxies requests to the form builder backend:

```java
@Service
public class SubmissionService {
    private final FormBackendClient formBackendClient;
    
    public SubmissionPageResponse listSubmissions(...) {
        FormSubmissionPage formPage = formBackendClient.listSubmissions(...);
        // Map to PM tool format
        return new SubmissionPageResponse(...);
    }
}
```

### 3. SubmissionController

Exposes the API endpoint:

```java
@RestController
@RequestMapping("/api/submissions")
@PreAuthorize("hasRole('ADMIN')")
public class SubmissionController {
    @GetMapping
    public SubmissionPageResponse list(
        @RequestParam Instant from,
        @RequestParam Instant to,
        @RequestParam UUID employeeId,
        // ... other filters
    )
}
```

## Frontend Implementation

### 1. useEmployeeSubmissions Hook

Fetches submissions and transforms them into workday summaries:

**Key Features:**
- Fetches submissions from `/api/submissions` filtered by employee and date range
- Groups submissions by date (extracted from `submittedAt`)
- Counts submissions by type:
  - **Tagesberichte (TB)**: Forms with "tagesbericht" or "tb" in name
  - **Regiescheine (RS)**: Forms with "regieschein" or "rs" in name
  - **Streetwatch**: Forms with "streetwatch" or "sw" in name
- Returns `WorkdaySummaryDto[]` sorted by date descending

**Type Definition:**
```typescript
type WorkdaySummaryDto = {
  date: string; // YYYY-MM-DD
  status: "RELEASED" | "READY" | "DRAFT";
  submissions: SubmissionDto[];
  tbCount: number;
  rsCount: number;
  hasStreetwatch: boolean;
}
```

### 2. Date Selection Page Update

**Route:** `/mitarbeiter/[id]/datumsauswahl`

The page now:
1. Uses `useEmployeeSubmissions` instead of `useEmployeeWorkdays`
2. Displays **counts** instead of boolean indicators:
   - "Tagesberichte: 2" (instead of "Tagesbericht vorhanden")
   - "Regiescheine: 1" (instead of "Regieschein vorhanden")
   - "Streetwatch-Daten vorhanden" (remains boolean)
3. Shows submissions grouped by date with status badges
4. Allows filtering by date range

## API Endpoint

### PM Tool Endpoint

```
GET /api/submissions?employeeId={uuid}&from={datetime}&to={datetime}
```

**Query Parameters:**
- `employeeId` (required): UUID of the employee
- `from` (optional): ISO datetime string (e.g., `2024-03-01T00:00:00Z`)
- `to` (optional): ISO datetime string (e.g., `2024-03-10T23:59:59Z`)
- `formId` (optional): Filter by specific form
- `hasAttachments` (optional): Filter by attachment presence
- `page` (default: 0): Page number
- `size` (default: 20): Page size

**Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "formId": "uuid",
      "formName": "Tagesbericht",
      "formVersion": 1,
      "employeeId": "uuid",
      "employeeUsername": "john.doe",
      "submittedAt": "2024-03-01T14:30:00Z",
      "hasAttachments": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5
}
```

## Form Type Detection

Submissions are categorized by their `formName`:

| Category | Detection Logic |
|----------|----------------|
| Tagesbericht (TB) | Form name contains "tagesbericht" or "tb" (case-insensitive) |
| Regieschein (RS) | Form name contains "regieschein" or "rs" (case-insensitive) |
| Streetwatch | Form name contains "streetwatch" or "sw" (case-insensitive) |

## Date Grouping Logic

1. Extract date from `submittedAt` field (YYYY-MM-DD)
2. Group all submissions with the same date
3. Count submissions of each type per date
4. Create a workday summary for each date
5. Sort by date descending (newest first)

## Status Mapping

Currently, all submitted forms are marked as **"RELEASED"** status. This can be enhanced in the future to:
- Check if all required forms for a day are submitted
- Implement an approval workflow
- Track draft vs. submitted status

## Benefits

1. **Real-time Data**: Always shows the latest submissions from form builder
2. **No Sync Issues**: No background jobs or data consistency problems
3. **Simplified Architecture**: Direct proxy pattern, similar to employee data
4. **Flexible Filtering**: Supports filtering by employee, date range, form type, etc.
5. **Scalable**: Can easily add more filters or grouping options

## Testing

To test the implementation:

1. **Start both backends:**
   ```bash
   # Form builder (port 8090)
   cd montron-mobile-app/backend
   ./mvnw spring-boot:run
   
   # PM tool (port configured)
   cd montron-pm-tool/backend
   ./mvnw spring-boot:run
   ```

2. **Start the frontend:**
   ```bash
   cd montron-pm-tool/pm-web-frontend
   npm run dev
   ```

3. **Navigate to:**
   ```
   http://localhost:3000/mitarbeiter/{employeeId}/datumsauswahl
   ```

4. **Verify:**
   - Date pickers work correctly
   - Submissions are grouped by date
   - Counts are displayed correctly (TB, RS, Streetwatch)
   - Status badges show "Freigegeben" for submitted forms
   - "Details anzeigen" button navigates to detail view

## Future Enhancements

1. **Detail View**: Implement the detail page to show individual submissions for a date
2. **Status Workflow**: Add proper status tracking (Draft → Ready → Released)
3. **Form Type Configuration**: Make form type detection configurable (not hardcoded)
4. **Pagination**: Add pagination for dates if many days are returned
5. **Export**: Add export functionality for submission reports
6. **Charts**: Add visual charts for submission statistics
