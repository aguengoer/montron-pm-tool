# Employee Query Fix - BYTEA Error Resolution

## Problem

The application was throwing a PostgreSQL error when querying employees:

```
ERROR: function lower(bytea) does not exist
Hint: No function matches the given name and argument types. You might need to add explicit type casts.
```

## Root Cause

While the database schema was correct (all string columns were `VARCHAR`), Hibernate was incorrectly binding the query parameters as `bytea` (binary data) instead of `text`/`varchar`. This occurred because:

1. No explicit PostgreSQL dialect was configured in the application properties
2. Hibernate's auto-detection wasn't properly handling parameter type inference for the JPQL query

## Solution

Applied a three-part fix:

### 1. Added Explicit PostgreSQL Dialect Configuration

**File**: `src/main/resources/application.yml`

```yaml
spring:
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

### 2. Converted Query to Native SQL with Explicit Type Casts

**File**: `src/main/java/dev/montron/pm/employees/EmployeeRepository.java`

Changed from JPQL to native SQL with explicit `CAST` operations on all parameters:

```sql
select e.* from employee e
where e.company_id = CAST(:companyId AS uuid)
  and (CAST(:status AS varchar) is null or e.status = CAST(:status AS varchar))
  and (
      CAST(:q AS varchar) is null
      or lower(CAST(e.username AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
      or lower(CAST(e.first_name AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
      or lower(CAST(e.last_name AS varchar)) like lower(concat('%', CAST(:q AS varchar), '%'))
  )
  and (CAST(:department AS varchar) is null or lower(CAST(e.department AS varchar)) like lower(concat('%', CAST(:department AS varchar), '%')))
order by e.last_name, e.first_name
```

### 3. Fixed Sorting to Use Database Column Names

**File**: `src/main/java/dev/montron/pm/employees/EmployeeService.java`

Changed the Sort in the Pageable to use database column names instead of entity field names, since native queries don't translate field names:

**Before:**
```java
Pageable pageable = PageRequest.of(page, size, Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()));
```

**After:**
```java
// Use database column names for native query sorting
Pageable pageable = PageRequest.of(page, size, Sort.by("last_name").ascending().and(Sort.by("first_name").ascending()));
```

Also removed the explicit `ORDER BY` clause from the native SQL query since Spring Data will add it based on the Pageable's Sort.

## Verification Steps

1. The code compiled successfully without errors
2. To verify the fix works at runtime:
   - Restart the Spring Boot application
   - Make a GET request to `/api/employees?page=0&size=50&status=ACTIVE`
   - The query should execute without errors

## Files Modified

- `backend/src/main/resources/application.yml` - Added PostgreSQL dialect configuration
- `backend/src/main/java/dev/montron/pm/employees/EmployeeRepository.java` - Updated search query with explicit casts and removed explicit ORDER BY
- `backend/src/main/java/dev/montron/pm/employees/EmployeeService.java` - Changed Sort to use database column names

## Technical Details

### Type Casting
The explicit `CAST` operations ensure PostgreSQL treats all parameters with the correct types:
- `CAST(:companyId AS uuid)` - Ensures UUID parameter is properly typed
- `CAST(:status AS varchar)` - Ensures status parameter is treated as text
- `CAST(:q AS varchar)` - Ensures search query parameter is treated as text
- `CAST(:department AS varchar)` - Ensures department parameter is treated as text

This prevents PostgreSQL from misinterpreting parameters as `bytea` type, which was causing the `function lower(bytea) does not exist` error.

### Native Query Sorting
When using native SQL queries in Spring Data JPA:
- Spring Data does NOT translate entity field names to database column names
- The Sort object in Pageable must use actual database column names (`last_name`, `first_name`)
- Entity field names (`lastName`, `firstName`) will be passed directly to SQL, causing "column does not exist" errors
- Any ORDER BY in the query string will be appended to Spring's generated ORDER BY, potentially causing duplicates
