# Montron PM-Tool – MVP Backend Spec

This document describes the **backend MVP** for the Montron PM-Tool.

The backend lives in:

- `backend/` – Spring Boot 3 application (`dev.montron.pm`)

It builds on the **existing Montron Form/Mobile backend** (authentication, users, forms, submissions, file storage) and adds its own database for PM-specific concepts.

---

## 1. Backend Goals (MVP)

The PM-Tool backend must:

1. **Reuse existing Montron backend** as source of truth for:
    - Auth (JWT, roles)
    - Users/employees
    - Form submissions for TB (Tagesbericht) & RS (Regieschein)
    - Files (PDFs, images, etc., via S3 keys / presigned URLs)

2. Provide its own **PM-domain**:
    - Employees (mirror of Montron users)
    - Workdays (per employee + date)
    - TB / RS “flattened” entries per day
    - Streetwatch data per day (if available)
    - Validation issues
    - Layout configuration for the 3-column view
    - Release actions + PIN verification
    - Audit trail for changes (TB/RS edits, releases)

3. Expose **REST APIs** for the PM-Tool frontend:
    - Employee list & detail endpoints
    - Workday list & detail (3-column view) endpoints
    - TB/RS update endpoints (PATCH)
    - Validation, layout, release, and PDF export endpoints

4. Support **multi-tenancy**:
    - All domain entities are scoped by `company_id`
    - Tenant is taken from JWT (issued by main Montron backend)

---

## 2. Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 3.x
- **Build**: Maven (or Gradle, depending on existing project)
- **Core dependencies**:
    - `spring-boot-starter-web`
    - `spring-boot-starter-security` (resource server with JWT)
    - `spring-boot-starter-validation`
    - `spring-boot-starter-data-jpa`
    - PostgreSQL driver
    - Flyway (DB migrations)
    - springdoc OpenAPI (Swagger UI)
    - Optional: MapStruct for DTO mapping
    - Test: Spring Boot Test, JUnit 5, Testcontainers (Postgres)

- **Database**: PostgreSQL
- **Migrations**: Flyway (`src/main/resources/db/migration`)
- **PDF generation**: iText or equivalent
- **File storage integration**:
    - S3/S3-compatible for PDFs and images (via presigned URLs)
    - Windows file share for final “release” directory structure

---

## 3. Package Structure

Base package: `dev.montron.pm`

Suggested packages:

- `config`  
  Security config, JWT config, web config, OpenAPI config, global exception handling, tenant context.

- `common`  
  Shared DTOs, mappers, utility classes (time rounding, distance calculation), error models (ProblemDetails style).

- `integration`  
  HTTP client for existing Montron backend (Form API) – employees and submissions (TB/RS).

- `employees`  
  Employee mirror entity, repository, service, REST controller, plus proxy calls to Montron employee API.

- `workday`  
  Workday entity, TB/RS entities, Streetwatch entities, services, repositories, REST controller.

- `workday.validation`  
  Validation service and logic (TB ↔ Streetwatch, TB ↔ RS, address plausibility).

- `workday.layout`  
  LayoutConfig entity + REST controller for dynamic 3-column configuration.

- `audit`  
  AuditEntry entity, audit service; PIN storage & verification; release actions.

- `storage`  
  Storage abstraction: S3 downloads (and optional uploads), Windows share writing for released PDFs and photos.

- `pdf`  
  PDF generation helpers for TB and RS.

---

## 4. Multi-Tenancy & Security

### 4.1 Tenant & User

- Tenant = **Company** from Montron backend.
- JWT issued by the main Montron backend contains:
    - `userId` (Montron user ID, UUID)
    - `role` (e.g. ADMIN, EMPLOYEE)
    - `companyId` (tenant ID, UUID)

PM backend must:

- Validate JWT signature & expiry (Spring Security Resource Server).
- Extract `userId`, `role`, `companyId`.
- Place these into a `TenantContext` / `CurrentUser` object that can be accessed by services.

### 4.2 Tenant-aware Entities

- All business entities in the PM backend include:
    - `companyId` (`UUID NOT NULL`)
- Repositories and queries must always filter by `companyId = current user’s companyId`.
- No cross-tenant queries.

### 4.3 Roles

- Only users with role `ADMIN` (from JWT) may access PM-Tool endpoints.
- `EMPLOYEE` role has **no direct access** to PM REST APIs; employees are only objects in the PM domain.

---

## 5. Domain Model (Entities)

Only the main entities are listed here. Exact fields (names/types) can be refined in code.

### 5.1 Employee (mirror)

- Table: `employee`
- Mirrors Montron `"user"` table (source of truth remains Montron backend).
- Fields (minimum):
    - `id` (UUID, PK) – same as Montron `user.id`
    - `companyId` (UUID, NOT NULL)
    - `username` (string)
    - `firstName`, `lastName`
    - `department` (maps from `team`)
    - `status` (ACTIVE/INACTIVE)
    - `updatedAt` (timestamp)
    - Optional: `etag` or similar for change detection

### 5.2 Workday

- Table: `workday`
- One row per `employee + date`.
- Fields:
    - `id` (UUID, PK)
    - `companyId` (UUID)
    - `employeeId` (UUID FK → employee)
    - `workDate` (DATE)
    - `status` (DRAFT, READY, RELEASED)
    - `hasTb` (boolean)
    - `hasRs` (boolean)
    - `hasStreetwatch` (boolean)
    - `createdAt`, `updatedAt`

- Constraint:
    - Unique (`companyId`, `employeeId`, `workDate`).

### 5.3 TB (Tagesbericht) entry

- Table: `tb_entry`
- Flattened view of TB submission for a day.
- Fields:
    - `id` (UUID, PK)
    - `companyId` (UUID)
    - `workdayId` (UUID FK → workday)
    - `sourceSubmissionId` (UUID, ID of Montron `submission`)
    - `startTime`, `endTime` (TIME)
    - `breakMinutes` (INT)
    - `travelMinutes` (INT)
    - `licensePlate` (string)
    - `department` (string)
    - `overnight` (boolean)
    - `kmStart`, `kmEnd`
    - `comment` (text)
    - `extra` (JSONB) – extra TB fields that don’t need first-class columns
    - `version` (INT) – incremented on each PM-side change

### 5.4 RS (Regieschein) entry

- Table: `rs_entry`
- Flattened view of RS submission for a day.
- Fields:
    - `id` (UUID, PK)
    - `companyId` (UUID)
    - `workdayId` (UUID FK → workday)
    - `sourceSubmissionId` (UUID)
    - `customerId`, `customerName`
    - `startTime`, `endTime` (TIME)
    - `breakMinutes` (INT)
    - `positions` (JSONB) – list of summarized RS lines
    - `pdfObjectKey` (string, optional)
    - `version` (INT)

### 5.5 Attachments

- Table: `attachment`
- For photos, receipts, etc. attached to TB/RS.
- Fields:
    - `id` (UUID, PK)
    - `companyId` (UUID)
    - `workdayId` (UUID FK → workday)
    - `kind` (PHOTO, RECEIPT, RS_PHOTO, …)
    - `s3Key` (string)
    - `filename` (string)
    - `bytes` (long, optional)
    - `sourceSubmissionId` (UUID, optional)

### 5.6 Streetwatch

- Tables:
    - `streetwatch_day`
    - `streetwatch_entry`

- `streetwatch_day`:
    - `id` (UUID)
    - `companyId` (UUID)
    - `workdayId` (UUID FK → workday)
    - `licensePlate` (string)
    - `swDate` (date)

- `streetwatch_entry`:
    - `id` (UUID)
    - `streetwatchDayId` (UUID FK)
    - `time` (TIME)
    - `km` (INT)
    - `lat`, `lon` (numeric)

### 5.7 ValidationIssue

- Table: `validation_issue`
- Server-side calculation result of TB/RS/Streetwatch checks.
- Fields:
    - `id` (UUID)
    - `companyId` (UUID)
    - `workdayId` (UUID)
    - `code` (string, e.g. `TB_SW_TIME_DIFF`, `TB_RS_BREAK_MISMATCH`, `ADDRESS_OUT_OF_RANGE`)
    - `severity` (OK, WARN, ERROR)
    - `message` (text)
    - `fieldRef` (string, e.g. `tb.startTime`)
    - `delta` (JSONB) – difference data (minutes, meters, etc.)
    - `createdAt` (timestamp)

### 5.8 ReleaseAction

- Table: `release_action`
- A record that a workday was released.
- Fields:
    - `id` (UUID)
    - `companyId` (UUID)
    - `workdayId` (UUID)
    - `userId` (UUID; admin who released)
    - `pinLast4` (char[4]) – last 4 digits of used PIN
    - `releasedAt` (timestamp)
    - `targetPath` (string) – path in Windows share

### 5.9 IngestCursor

- Table: `ingest_cursor`
- Tracks last position for integration feeds per company.
- Fields:
    - `id` (UUID)
    - `companyId` (UUID)
    - `feed` (EMPLOYEES, SUBMISSIONS)
    - `cursor` (string, e.g. `updatedAfter` timestamp or paging token)
    - `lastRunAt` (timestamp)

- Unique: (`companyId`, `feed`).

### 5.10 IdempotencyKey

- Table: `idempotency_key`
- Prevents double-processing of retry requests.
- Fields:
    - `key` (string, PK)
    - `companyId` (UUID)
    - `requestHash` (string)
    - `createdAt` (timestamp)
    - `status` (ACCEPTED, APPLIED)

### 5.11 AuditEntry

- Table: `audit_entry`
- For tracking field changes (before/after).
- Fields:
    - `id` (UUID)
    - `companyId` (UUID)
    - `entity` (string: TB, RS, WORKDAY, ATTACHMENT, …)
    - `entityId` (UUID)
    - `field` (string)
    - `oldValue` (JSONB)
    - `newValue` (JSONB)
    - `userId` (UUID)
    - `at` (timestamp)

### 5.12 WorkdayLayoutConfig

- Table: `workday_layout_config`
- Controls how 3-column view is rendered.
- Fields:
    - `id` (UUID)
    - `companyId` (UUID)
    - `name` (string, e.g. `default`)
    - `documentTypeTb` (string, e.g. `BAUTAGESBERICHT`)
    - `documentTypeRs` (string, e.g. `REGIESCHEIN`)
    - `config` (JSONB) – contains `tbFields`, `rsFields`, `streetwatchColumns`.

---

## 6. Integration with Existing Montron Backend

The PM backend never authenticates users itself. It:

- Accepts JWT from Montron backend.
- Calls the Montron backend as a **client** for:
    - Employees:
        - Integration feed: `/integration/employees?updatedAfter=...`
        - Admin operations: `/employees`, `/employees/{id}` + activate/deactivate/reset-password.
    - Submissions (TB/RS):
        - Integration feed: `/integration/submissions?from=&to=&documentType=TB|RS&updatedAfter=...`
    - Files:
        - Either presigned URLs from Montron or S3 keys used by PM backend itself.

All calls forward the user’s Bearer token.

---

## 7. Ingest Jobs

### 7.1 Employee ingest

- Service: `EmployeeIngestService`
- Uses `FormBackendClient` to call employee integration endpoint with `updatedAfter` from `ingest_cursor`.
- Upserts `EmployeeEntity` for each returned employee.
- Updates `ingest_cursor` with new cursor/lastRunAt.

### 7.2 Submission ingest

- Service: `SubmissionIngestService`
- Uses `FormBackendClient` to call submissions integration (`TB` and `RS` types).
- For each submission:
    - Determine employeeId & date.
    - Upsert `WorkdayEntity` (`status` = DRAFT if new).
    - For TB: map to `TbEntryEntity`, plus attachments.
    - For RS: map to `RsEntryEntity`, plus attachments.
- Update `ingest_cursor`.

### 7.3 Scheduling

- Use `@Scheduled` to run ingest every few minutes.
- Per company, process EMPLOYEES then SUBMISSIONS.

---

## 8. REST API Overview

Paths assume base `/api`.

### 8.1 Employees

- `GET /api/employees`
    - Query params: `page`, `size`, `q`, `department`, `status`.
    - Returns paginated employee list.

- `GET /api/employees/{id}`
    - Returns employee detail.

- `POST /api/employees`
    - Body: create-employee DTO.
    - Behaviour: proxy to Montron `/employees` → update mirror → return created employee.

- `PUT /api/employees/{id}`
    - Behaviour: proxy to Montron `/employees/{id}` → update mirror.

- `POST /api/employees/{id}/activate`
- `POST /api/employees/{id}/deactivate`
- `POST /api/employees/{id}/reset-password`
    - All proxy to Montron backend, then update mirror.

### 8.2 Workdays

- `GET /api/employees/{id}/workdays?from=&to=`
    - Returns list of workday summaries for that employee & range:
        - `id`, `date`, `status`, `hasTb`, `hasRs`, `hasStreetwatch`.

- `GET /api/workdays/{id}`
    - Returns detailed workday DTO:
        - `workday`, `employee`, `tb`, `rs`, `streetwatch`, `attachments`, `validationIssues`.

- `GET /api/workdays/{id}/validations`
    - Returns list of `ValidationIssue` DTOs.

### 8.3 Editing TB/RS

- `PATCH /api/workdays/{id}/tb`
    - Partial update of TB fields:
        - `startTime`, `endTime`, `breakMinutes`, `travelMinutes`, `licensePlate`, `department`, `overnight`, `kmStart`, `kmEnd`, `comment`, etc.
    - Server behaviour:
        - Apply patch, rounding times to 15-minute increments.
        - Create `AuditEntry` rows for changed fields.
        - Recalculate `ValidationIssue`s for the workday.
        - Return updated TB DTO.

- `PATCH /api/workdays/{id}/rs`
    - Partial update of RS fields:
        - `startTime`, `endTime`, `breakMinutes`, `customerName`, `positions`, etc.
    - Same behaviour as TB patch: audit + revalidation.

### 8.4 LayoutConfig

- `GET /api/workday-layout`
    - Returns current layout config for the tenant.

- `PUT /api/workday-layout`
    - Accepts full layout JSON, replaces existing config (admin-only).

### 8.5 Attachments

- `POST /api/workdays/{id}/attachments/presign-download`
    - Body: `{ "attachmentIds": [ ... ] }` (or empty to include all).
    - Returns map `attachmentId → presignedGetUrl`.

### 8.6 Release & PDFs

- `POST /api/workdays/{id}/release/confirm`
    - Body:
        - `pin` (string)
        - Optional: `overrideWarnings` (bool), `overrideReason` (string)
    - Behaviour:
        - Validate PIN (user-specific, with rate limiting).
        - Ensure no ERROR-level validation issues (or require overrideReason).
        - Generate TB & RS PDFs (if present).
        - Copy PDFs and attachments to Windows share in the defined directory structure.
        - Insert `ReleaseAction`.
        - Set workday status to `RELEASED`.
        - Return summary (releasedAt, targetPath, list of files).

- `POST /api/workdays/{id}/pdf/tb`
- `POST /api/workdays/{id}/pdf/rs`
    - Generate TB/RS PDFs on demand (without releasing).

---

## 9. Validation Rules (Server-Side)

Validation is done in a `ValidationService` and stored as `ValidationIssue` rows.

Rules (MVP):

1. **TB vs Streetwatch (work time difference)**
    - Compute difference in minutes between TB working time and Streetwatch-derived time.
    - Severity:
        - `< 15 min` → OK
        - `15–30 min` → WARN
        - `≥ 30 min` → ERROR

2. **TB vs RS (start/end/break)**
    - Compare TB and RS:
        - `startTime`
        - `endTime`
        - `breakMinutes`
    - Any mismatch → WARN. (Release still possible, but highlighted.)

3. **Address plausibility (if data available)**
    - If TB has an address and Streetwatch has GPS coordinates for the job, compute distance.
    - If distance > 500m → WARN.

4. **15-minute raster**
    - Times sent by the frontend are already in 15-minute steps, but backend:
        - Accepts any time.
        - Normalizes to 00/15/30/45 minute marks.
        - Can optionally record a WARN if rounding was needed.

Trigger points:

- After ingest (optional or lazily on first load).
- After TB/RS PATCH.
- Before release (final check).

---

## 10. Release Flow & PIN

### 10.1 PIN Storage

- Dedicated table for PINs per user+company (e.g. `user_pin`):
    - `userId`, `companyId`, `pinHash` (hashed PIN)
    - `failedAttempts`, `lockedUntil`, timestamps.
- PIN must never be stored in cleartext.

### 10.2 Release confirm

On `POST /api/workdays/{id}/release/confirm`:

1. Verify user has role `ADMIN`.
2. Check and rate-limit PIN:
    - Compare provided PIN (after hashing) to stored `pinHash`.
    - If incorrect:
        - Increment `failedAttempts`.
        - If too many attempts → set `lockedUntil`.
3. If correct:
    - Reset `failedAttempts`.
    - Load all `ValidationIssue`s for workday.
    - If any `ERROR` and no override allowed → reject.
4. Generate PDFs and write to file share (using `StorageService` & `PdfService`).
5. Insert `ReleaseAction` row.
6. Change workday status to `RELEASED`.

---

## 11. Error Handling & Problem Details

- Global error handler (`@ControllerAdvice`) converts exceptions into a consistent JSON structure (ProblemDetails-like).
- Typical responses:
    - 400 – validation errors
    - 401 – unauthenticated
    - 403 – forbidden (insufficient role)
    - 404 – not found (employee, workday, etc.)
    - 409 – conflicts (e.g. releasing an already released workday)
    - 422 – domain validation errors (e.g. error-level validation issues preventing release)

---

## 12. Implementation Phases (for AI / Cursor)

Recommended implementation order:

1. Project config:
    - Dependencies, `application.yml`, Flyway baseline, `/api/ping`, basic security.
2. JWT security + TenantContext + multi-tenant base entity pattern.
3. Domain & migrations:
    - Employee, Workday, TB, RS, Attachment.
    - Then Streetwatch, ValidationIssue, ReleaseAction, IngestCursor, IdempotencyKey, AuditEntry, LayoutConfig.
4. Integration client for Montron backend.
5. Ingest services (employees & submissions) + scheduling.
6. Employee REST APIs (mirror + proxy).
7. Workday summary & detail REST APIs (read-only).
8. TB/RS PATCH endpoints + audit + validation hooks.
9. ValidationService with all rules.
10. LayoutConfig REST API.
11. Release flow + PIN + PDF + file share.
12. Attachment presign-download endpoint.
13. Tests & hardening.

This is the **reference backend spec** AI tools (like Cursor) should use when generating or modifying backend code for the Montron PM-Tool.
