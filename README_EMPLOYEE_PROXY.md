# Employee Proxy Architecture

## Overview

The PM tool backend now **proxies all employee operations directly to the form builder backend** instead of maintaining its own local copy of employee data. This establishes the form builder as the **single source of truth** for employee data.

## Architecture Change

### Before
```
PM Tool Backend
    ├── EmployeeService
    ├── EmployeeRepository (local database table)
    ├── EmployeeIngestService (sync from form builder)
    └── FormBackendClient (for create/update/activate/deactivate)
```

- PM tool maintained a mirror/cache of employees in its own database
- Background sync process (`EmployeeIngestService`) kept data in sync
- Potential for data inconsistency
- More complex architecture

### After
```
PM Tool Backend
    ├── EmployeeService (direct proxy to form builder)
    └── FormBackendClient (all operations)
    
Form Builder Backend (Single Source of Truth)
    └── Employee Database Table
```

- PM tool has NO local employee table
- All operations are proxied directly to form builder
- No sync issues
- Simpler, more maintainable architecture

## Implementation Details

### FormBackendClient

Added new methods to fetch employees from the form builder:

```java
// List employees with pagination and filters
public FormEmployeePage listEmployees(int page, int size, String search, String status)

// Get single employee by ID
public FormEmployeeResponse getEmployee(UUID id)
```

Updated existing methods to return `FormEmployeeResponse`:

```java
public FormEmployeeResponse createEmployeeInFormBackend(FormEmployeeCreateRequest request)
public FormEmployeeResponse updateEmployeeInFormBackend(UUID id, FormEmployeeUpdateRequest request)
```

### EmployeeService

Completely refactored to proxy all requests:

**Before:**
- Queried local `EmployeeRepository`
- Called form builder for create/update/activate/deactivate
- Synced data back to local database

**After:**
- All operations directly call `FormBackendClient`
- No database queries
- No data synchronization logic
- Simple mapping from form builder format to PM tool format

### Data Mapping

The form builder uses `team` field, while the PM tool uses `department`:

```java
private EmployeeDto toDto(FormEmployeeResponse response) {
    return new EmployeeDto(
        UUID.fromString(response.id()),
        response.username(),
        response.firstName(),
        response.lastName(),
        response.team(), // Mapped to 'department' in PM tool
        response.status());
}
```

### Form Builder Backend

Added new endpoint to support fetching a single employee:

```java
@GetMapping("/{id}")
public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable UUID id)
```

This endpoint:
- Returns employee by ID
- Enforces company-level isolation (user can only fetch employees from their own company)
- Returns 404 if employee not found or belongs to different company

## Benefits

1. **Single Source of Truth**: Form builder is the authoritative source for employee data
2. **No Sync Issues**: No background sync jobs, no data inconsistencies
3. **Simpler Architecture**: Less code, easier to understand and maintain
4. **Reduced Database Load**: PM tool doesn't store redundant employee data
5. **Real-time Data**: Always fetch the latest employee data from form builder

## Database Cleanup

The following can now be removed from the PM tool:

1. `EmployeeEntity` - JPA entity for local employee table
2. `EmployeeRepository` - JPA repository for local queries
3. `EmployeeIngestService` - Background sync service
4. Database migration files for employee table
5. `FormEmployeeDto` - Only used by EmployeeIngestService (can keep for legacy if needed)

## API Endpoints (PM Tool)

All PM tool employee endpoints remain unchanged - they just proxy to the form builder:

```
GET    /api/employees              -> Proxies to form builder
GET    /api/employees/{id}         -> Proxies to form builder
POST   /api/employees              -> Proxies to form builder
PUT    /api/employees/{id}         -> Proxies to form builder
POST   /api/employees/{id}/activate     -> Proxies to form builder
POST   /api/employees/{id}/deactivate   -> Proxies to form builder
POST   /api/employees/{id}/reset-password -> Proxies to form builder
```

## Testing

To test the changes:

1. Start the form builder backend
2. Start the PM tool backend
3. Make requests to PM tool's `/api/employees` endpoint
4. Verify data is fetched from form builder
5. Verify create/update operations work correctly

## Configuration

### Form Builder Base URL

The form builder backend has a servlet context path of `/api`, so all endpoints are prefixed with `/api`:

```yaml
# PM Tool configuration
form-api:
  base-url: ${FORM_API_BASE_URL:http://localhost:8090/api}
```

**Important:** The base URL must include the `/api` suffix because the form builder uses:

```yaml
# Form Builder configuration
server:
  servlet:
    context-path: /api
```

This means all form builder endpoints are at:
- `http://localhost:8090/api/employees`
- `http://localhost:8090/api/forms`
- etc.

## Notes

- Authentication token is automatically forwarded from PM tool to form builder
- Company-level isolation is enforced by the form builder
- All operations are synchronous (no background jobs)
- The base URL must include the `/api` context path of the form builder
