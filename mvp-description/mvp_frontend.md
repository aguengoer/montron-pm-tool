# Montron PM-Tool – MVP Frontend Spec

This document describes the **frontend MVP** for the Montron PM-Tool.

The frontend lives in:

- `pm-web-frontend/` – React + TypeScript single-page application

It talks to:

- The **Montron Form/Mobile backend** for authentication (`/auth/login`) and indirectly for user management (via PM backend proxy).
- The **Montron PM-Tool backend** (`backend/`) for all PM-specific APIs (employees, workdays, TB/RS editing, validations, release, etc.).

---

## 1. Goals (Frontend)

The PM-Tool frontend must allow a project manager / backoffice user to:

1. **Authenticate** via the existing Montron backend (username & password → JWT).
2. See an **employee list** (like the current Admin UI) and manage employees:
    - View employees for the current tenant.
    - Create, edit, activate/deactivate, reset password (through PM backend → Form backend).
3. For a selected employee, see a **date-range view**:
    - One row per day with indicators for TB, RS, Streetwatch and overall status (DRAFT/READY/RELEASED).
4. For a selected workday, open a **3-column workday view**:
    - Left: TB (Tagesbericht) data (editable).
    - Middle: RS (Regieschein) data (editable).
    - Right: Streetwatch data (read-only).
    - A validation panel shows consistency checks and their severity (OK/WARN/ERROR).
5. **Edit TB and RS inline**:
    - Time fields (start, end, break) in 15-minute steps.
    - Other fields as text/select/number.
    - Changes should be persisted via PATCH calls and reflected with before/after.
6. **Release a workday**:
    - Trigger a release action (with a 4-digit PIN).
    - Show success/failure, resulting status, and export path.
7. **Preview and download PDFs**:
    - TB and RS PDFs on demand.
8. Browse **attachments** (photos, receipts) in a gallery/lightbox:
    - Use presigned URLs from the backend.

---

## 2. Tech Stack

- **React** 18 (SPA)
- **TypeScript**
- **Bundler**: Vite
- **Routing**: React Router (browser history)
- **Data fetching & caching**: TanStack Query (React Query)
- **Tables**: TanStack Table (headless) with custom UI components
- **Forms & inline editing**: React Hook Form (RHF)
- **UI library**: shadcn/ui + Tailwind CSS (same design language as existing Admin UI)
- **Date/time utilities**: date-fns (or similar small library)
- **PDF preview**: React-PDF or a similar viewer
- **HTTP client**: fetch or small wrapper (no giant client library needed)

Build target: **Desktop-first** (project manager uses it on a PC/laptop). Tablet should be usable but not fully optimized; mobile is **not** a goal for MVP.

---

## 3. Routing & Navigation

The frontend is a single-page app with the following main routes:

1. `/login`
2. `/employees`
3. `/employees/:employeeId`
4. `/workday/:workdayId`
5. Optionally: `/exports` (for batch exports – MVP+)

All routes except `/login` are **protected** and require a valid JWT.

### 3.1 `/login`

**Purpose:** obtain JWT from existing Montron backend.

- Fields:
    - Username
    - Password
- Behaviour:
    - On submit:
        - Call `{FORM_API}/auth/login` with username/password.
        - On success: store JWT (and optional refresh token) in memory or secure storage.
        - Redirect to `/employees`.
    - On failure: show error message.

### 3.2 `/employees` – Employee List

**Purpose:** starting point; shows list of all employees (current tenant).

- Uses `GET /api/employees` from PM backend.
- Table columns (similar to Admin UI):
    - Last name (UPPERCASE)
    - First name
    - Department
    - Status (Active/Inactive)
    - Last login (optional)
    - Actions (Edit, Activate/Deactivate, Reset password)

- Filters / search:
    - Text search over name/username.
    - Department filter.
    - Status filter (Active/Inactive).
    - Pagination controls.

- Actions:
    - **Create employee**:
        - Open a dialog with a form (username, names, department, etc.).
        - On submit, POST `/api/employees`.
    - **Edit employee**:
        - Open dialog, PUT `/api/employees/{id}`.
    - **Activate/Deactivate**:
        - Click action → POST `/api/employees/{id}/activate` or `/deactivate`.
    - **Reset password**:
        - Click action → POST `/api/employees/{id}/reset-password`.

- Navigation:
    - Clicking a row opens `/employees/:employeeId` (default date range: last 7 days or current week).

### 3.3 `/employees/:employeeId` – Employee Detail & Date Range

**Purpose:** show workdays for a given employee & date range.

- Header:
    - Employee name (last name in uppercase, first name).
    - Department and status.
    - Back link to `/employees`.

- Date filter:
    - From / To date pickers (or a week picker).
    - Button “Load days”.

- Data:
    - `GET /api/employees/{id}/workdays?from=&to=`.
    - For each workday:
        - date
        - status (DRAFT/READY/RELEASED)
        - hasTb (yes/no)
        - hasRs (yes/no)
        - hasStreetwatch (yes/no)

- UI:
    - Table: one row per day.
    - Status badge (color-coded).
    - TB/RS/SW small icons or badges.

- Navigation:
    - Clicking a row opens `/workday/:workdayId`.

### 3.4 `/workday/:workdayId` – Workday 3-Column View

**Purpose:** core PM screen. Show TB, RS, Streetwatch and validations; allow inline edits & release.

#### Layout

On desktop:

- Header bar at the top (workday header).
- Three columns below:
    - Left: TB panel
    - Middle: RS panel
    - Right: Streetwatch panel
- Right-aligned (or top-right) **Validation Panel**.

On smaller screens:

- Columns may stack vertically (TB → RS → Streetwatch) with the Validation Panel pinned at top or bottom.

#### Data

- `GET /api/workdays/{id}` returns:
    - `workday` (id, date, status, etc.)
    - `employee` (name, department)
    - `tb` (TB entry)
    - `rs` (RS entry)
    - `streetwatch` (day + entries)
    - `attachments` (photos, receipts, etc.)
    - `validationIssues` (or fetched separately)

- `GET /api/workdays/{id}/validations` may also be used to refresh validations.

#### Header Bar

Shows:

- Employee (last name UPPERCASE, first name).
- Date & weekday.
- Workday status (DRAFT, READY, RELEASED) as a chip.
- Summary indicators (TB present, RS present, Streetwatch present).
- Actions:
    - Save (if needed).
    - Release (opens PIN dialog).
    - TB PDF (preview/download).
    - RS PDF (preview/download).

#### TB Panel (Left Column)

Fields (exact fields and order come from the backend layout config):

- Typical fields:
    - Start time
    - End time
    - Break (minutes)
    - Travel time (minutes)
    - License plate
    - Department
    - Overnight
    - Km start / km end
    - Comment
    - Optional: site name, site address, etc.

Inline editing:

- Use React Hook Form:
    - Time fields use 15-minute steps (00/15/30/45).
    - On blur or on explicit save: send PATCH `/api/workdays/{id}/tb`.
- After server response:
    - Update TB state with normalized values.
    - Show “old vs new” visual for changed fields (e.g. small text with old value under new value, or a change badge).

Attachments / gallery:

- Show TB-related attachments (photos, receipts) in a thumbnail grid.
- On click: open a lightbox for:
    - Next/previous
    - Zoom & pan
    - Simple non-destructive annotations (overlays; implementation detail in backend).

#### RS Panel (Middle Column)

Fields (again from layout config):

- Typical fields:
    - Customer name (and optional ID)
    - Start time
    - End time
    - Break (minutes)
    - Positions (list of summarized RS lines: description, hours, quantity, price)

Editing:

- Inline editing similar to TB.
- Changes PATCH `/api/workdays/{id}/rs`.
- RS break time should match TB break (server-level validation). The UI can:
    - Highlight mismatch based on validations.
    - Optionally sync TB/RS break when user chooses.

RS PDF:

- Button to open a modal with React-PDF viewer using `/api/workdays/{id}/pdf/rs`.

#### Streetwatch Panel (Right Column)

Read-only view of Streetwatch data:

- Table of entries:
    - Time
    - Km
    - (optional) coordinates
- Visual cues:
    - Where times align with TB/RS.
    - Where there is significant difference (from validation).

#### Validation Panel

Panel visible at right side or top:

- Fetch from `validationIssues` in workday detail or via `GET /api/workdays/{id}/validations`.
- Each item:
    - Code (optional)
    - Short message
    - Severity icon/color:
        - OK (green)
        - WARN (yellow)
        - ERROR (red)
- Clicking an item:
    - Scrolls/focuses the linked field (TB or RS field).

#### Actions: Save, Release, PDF

- **Save**:
    - If using auto-save on blur, explicit Save may only re-trigger validations or act as a manual trigger.
    - Otherwise, Save calls PATCH for TB/RS with combined changes.

- **Release**:
    - Opens Release dialog:
        - PIN input (4 digits).
        - Optional “Override with reason” if WARN/EVENT issues require it.
    - On confirm:
        - Call `POST /api/workdays/{id}/release/confirm`.
        - Show success (workday status changes to RELEASED, show target path & files).
        - Show errors if PIN wrong / locked / validations fail.

- **PDFs**:
    - TB PDF button → call `/api/workdays/{id}/pdf/tb`, show viewer + download.
    - RS PDF button → same for `/api/workdays/{id}/pdf/rs`.

---

## 4. State Management & Data Layer

### 4.1 Server State (TanStack Query)

Recommended query keys:

- `['employees', { q, department, status, page }]`
- `['employee', employeeId]`
- `['workdays', { employeeId, from, to }]`
- `['workday', workdayId]`
- `['workdayValidations', workdayId]`
- `['workdayLayout']` (for 3-column config)

Caching:

- Employee and workday lists: moderate stale time with refetch on focus.
- Workday detail: refetch on focus and after edits.
- Layout config: long stale time; usually only changes after admin action.

Mutations:

- `usePatchTb(workdayId)`, `usePatchRs(workdayId)`
- `useReleaseWorkday(workdayId)`
- `useCreateEmployee`, `useUpdateEmployee`, etc.

### 4.2 Forms & Inline Editing

- Use React Hook Form for TB and RS forms separately.
- Each field is a controlled input bound to the current TB/RS values.
- Time fields:
    - 15-minute step UI.
    - Normalize to 00/15/30/45 when sending to backend.
- On error from backend:
    - Show field-level errors under relevant inputs.
    - Show global errors in a toast or alert bar.

### 4.3 LayoutConfig-driven rendering

- On app start or when workday page is first opened, load:
    - `GET /api/workday-layout`.
- This defines:
    - `tbFields`: fieldKey, label, editorType, order.
    - `rsFields`: fieldKey, label, editorType, order.
    - `streetwatchColumns`: fieldKey, label, order.
- TB/RS panels do not hard-code field lists; they iterate over config to render correct fields.

Example editorType handling:

- `time15` → Time picker with 15-minute step
- `text` → Text input
- `number` → Numeric input
- `select` → Dropdown (with options provided from a local mapping or separate API)

---

## 5. API Contracts (Used by Frontend)

The frontend expects the PM backend to expose:

- `POST {FORM_API}/auth/login` → JWT (from Montron backend)
- `GET /api/employees`
- `GET /api/employees/{id}`
- `POST /api/employees`
- `PUT /api/employees/{id}`
- `POST /api/employees/{id}/activate`
- `POST /api/employees/{id}/deactivate`
- `POST /api/employees/{id}/reset-password`
- `GET /api/employees/{id}/workdays?from=&to=`
- `GET /api/workdays/{id}`
- `GET /api/workdays/{id}/validations`
- `PATCH /api/workdays/{id}/tb`
- `PATCH /api/workdays/{id}/rs`
- `GET /api/workday-layout`
- `PUT /api/workday-layout` (admin-only)
- `POST /api/workdays/{id}/attachments/presign-download`
- `POST /api/workdays/{id}/release/confirm`
- `POST /api/workdays/{id}/pdf/tb`
- `POST /api/workdays/{id}/pdf/rs`

The exact DTO shapes follow the examples you already defined for the backend.

---

## 6. UI & UX Guidelines

### 6.1 Look & Feel

- Use Montron branding:
    - Primary color: Montron orange/red (e.g. `#E9573A`).
    - Fonts: same as existing Admin UI (e.g. Saira for headings, Work Sans for body).
- Desktop layout, full-width tables where useful.
- Clear status colours for:
    - Workday: DRAFT (grey), READY (blue), RELEASED (green).
    - Validations: OK (green), WARN (yellow), ERROR (red).

### 6.2 Accessibility

- Keyboard-accessible navigation:
    - Tab focus, focus outlines visible.
- Proper labels for inputs, especially PIN, times, and selects.
- ARIA roles for modals (release dialog, PDF viewer, gallery).

### 6.3 Error handling & notifications

- For all API calls:
    - Show a toast/snackbar on success (save, release, employee update).
    - Show readable error messages on failure (validation, auth, server errors).
- On authentication errors (401):
    - Redirect to `/login` and clear stored tokens.
- On forbidden (403):
    - Show “Access denied” page.

---

## 7. Implementation Phases (for AI / Cursor)

Suggested order for implementing the frontend:

1. **Scaffolding**
    - Vite + React + TypeScript project.
    - Tailwind, shadcn/ui, router, TanStack Query setup.
    - Root layout with protected route wrapper and auth context.

2. **Auth & Layout**
    - `/login` page and token storage.
    - Protected routes and redirect to `/employees`.

3. **Employee list**
    - `GET /api/employees` integration.
    - Table with filters, pagination, and actions.
    - Create/edit dialogs.

4. **Employee detail**
    - `/employees/:id` route.
    - Date range filter and workday summary table.
    - Navigation to `/workday/:workdayId`.

5. **Workday 3-column view**
    - `GET /api/workdays/{id}` + `GET /api/workday-layout`.
    - Render TB, RS, Streetwatch from layout config.
    - Validation panel.

6. **Inline editing (TB/RS)**
    - Hook up PATCH endpoints.
    - Implement before/after display.
    - Refresh validations after edits.

7. **Release flow**
    - Release dialog with PIN.
    - Use `/api/workdays/{id}/release/confirm`.
    - Show result and update status.

8. **PDF preview & attachments**
    - Implement TB/RS PDF preview using React-PDF.
    - Implement attachments gallery using presigned URLs.

9. **Polish & hardening**
    - Loading states, empty states, error states.
    - UX tweaks, keyboard navigation, small performance tuning.

This is the **reference frontend spec** for AI tools (like Cursor) when implementing the PM-Tool frontend in `pm-web-frontend/`.
