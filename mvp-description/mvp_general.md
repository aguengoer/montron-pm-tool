# Montron PM-Tool – MVP (General Overview)

## 1. Context & Existing System

Montron already has a **mobile app + backend** that handles:

- Authentication (`/auth/login`) via username + password with JWT
- Multi-tenancy via `company` and `company_id`
- Users/employees (table `"user"`)
- Form definitions and submissions:
    - `form_definition` (metadata for forms like TB/RS)
    - `submission` (filled-out forms)
    - `attachment` (photos, receipts, etc.)

The new **PM-Tool** is an additional application (backend + web frontend) that:

- Reuses the **existing Montron backend** as **source of truth** for:
    - Authentication & roles (JWT)
    - Employees
    - TB/RS data (form submissions)
    - Files (PDFs, photos, etc., via S3/presigned URLs)
- Adds its own backend & database for:
    - Workday aggregation
    - Validation logic (TB ↔ RS ↔ Streetwatch)
    - Layout configuration for a 3-column view
    - Release flow, audit trail and PIN verification

Repository layout:

- `backend/` – PM-Tool Spring Boot backend (this is what we’re implementing now)
- `pm-web-frontend/` – PM-Tool React frontend (3-column view etc.)
- `mvp_general.md` – this file (high-level overview)
- `mvp_backend.md` – detailed backend MVP spec (to be created)
- `mvp_frontend.md` – detailed frontend MVP spec (to be created)

---

## 2. Main MVP Goals

The PM-Tool MVP focuses on **daily workday processing** for employees:

1. **Overview per employee and workday**
    - For a selected employee and date range, show one row per day:
        - TB present?
        - RS present?
        - Streetwatch data present?
        - Status: DRAFT / READY / RELEASED

2. **3-column workday view (core UI)**
    - For a selected day, show:
        - Left: TB (Tagesbericht) data
        - Middle: RS (Regieschein) data
        - Right: Streetwatch data (km/time track)
    - TB/RS must be **editable inline** in the PM-Tool.

3. **Validation**
    - Server-side validation rules:
        - TB vs Streetwatch total work time difference (thresholds in minutes)
        - TB vs RS (start, end, break must match or produce warnings)
        - Address plausibility (e.g. TB address vs Streetwatch coordinates ≤ 500 m)
    - Validation results shown in a “Validation Panel” with severity:
        - OK (green), WARN (yellow), ERROR (red)

4. **Release flow (Freigabe)**
    - Workday can be **released** only by an admin user:
        - User is authenticated via JWT (ADMIN role)
        - Additional 4-digit PIN is required in PM-Tool
    - On successful release:
        - TB and RS PDFs are generated with Montron branding
        - TB/RS PDFs and attachments (photos, receipts) are exported into a
          specific **Windows file share directory structure**
        - Workday status changes to `RELEASED`
        - Release is written to an audit log (who, when, where)

5. **User/employee handling**
    - Employee data comes from the existing Montron backend
    - PM-Tool must:
        - Show an employee list (similar to existing Admin UI)
        - Allow creating, editing, activating/deactivating users via the **existing employee REST API** of the Montron backend (proxy)
    - PM-Tool **does not** maintain its own separate user system.

6. **Dynamic 3-column layout**
    - The 3-column TB/RS/Streetwatch view is **not hard-coded**:
        - A layout configuration (per company) describes which fields appear in each column and in what order.
        - This configuration is stored in the PM-Tool backend and based on the form metadata (FormDefinition / FormField) from the main Montron backend.

---

## 3. Scope & Non-Goals (MVP)

### In Scope (MVP)

- Dedicated PM-Tool backend (Spring Boot, PostgreSQL, Flyway)
- PM-Tool web frontend (React, TypeScript)
- Employee list and detail view
- Employee create/update/activate/deactivate via existing Montron employee API
- Workday aggregation:
    - Group TB/RS submissions + Streetwatch per employee + date
- 3-column workday detail view (TB, RS, Streetwatch)
- Inline editing of TB/RS fields with audit trail
- Validation rules for:
    - TB ↔ Streetwatch
    - TB ↔ RS
    - Address plausibility (basic version)
- Release flow with PIN, PDF generation, and file export
- Basic export options (on-demand TB/RS PDF, possibly batch export)
- Multi-tenancy: all data is **scoped per company**

### Out of Scope (MVP / Non-goals)

- Full project planning (capacity planning, Kanban, Gantt charts, etc.)
- Any complex, custom role/permissions system beyond:
    - ADMIN (PM users) vs. normal employees
- Mobile-optimised PM-UI (desktop-first)
- Very advanced PDF templating; MVP can use simple but clean templates
- Real-time push (WebSockets); polling/refresh is enough for MVP

---

## 4. Roles & Permissions

- **Montron backend is the authority for:**
    - Users, roles, company
    - Authentication and JWT issuance

- **PM-Tool:**
    - Accepts and validates JWTs from Montron backend
    - Provides functionality only to users with the appropriate role (typically ADMIN)
    - Uses the user’s `company_id` (from JWT) to scope all data

Roles relevant to PM-Tool:

- `ADMIN`: can use PM-Tool, see employees/workdays for their company, edit TB/RS, release days, manage employees via proxy.
- `EMPLOYEE`: **no direct access to PM-Tool UI** (used only as employee objects / data).

---

## 5. High-Level Architecture

- **Existing Montron Form/Mobile backend**
    - Auth (`/auth/login`, JWT)
    - Employee handling (`/employees`, `/integration/employees`)
    - Form submissions (`/integration/submissions` for TB/RS)
    - File storage (S3 keys or presigned URLs for PDFs/attachments)

- **New PM-Tool backend (`backend/`)**
    - Java 21, Spring Boot 3, PostgreSQL, Flyway
    - Multi-tenant domain model:
        - Employee mirror (points to Montron user IDs)
        - Workday (per employee + date)
        - TB/RS entries derived from Montron submissions
        - Streetwatch data (if available)
        - Validation issues, audit entries, release actions
        - Layout configuration for the 3-column view
    - Integration client to call Montron backend APIs
    - Scheduled “ingest” jobs pulling employees and submissions into PM domain
    - REST API for PM-frontend

- **New PM-Tool frontend (`pm-web-frontend/`)**
    - React + TypeScript SPA
    - Auth via Montron backend `/auth/login` (JWT)
    - Main screens:
        - Employee list
        - Employee date-range view
        - Workday 3-column detail view

---

## 6. Implementation Strategy (for AI tools like Cursor)

The repo will contain three MVP specs:

1. `mvp_general.md` – this file (high-level overview).
2. `mvp_backend.md` – detailed backend domain, endpoints, and technical decisions.
3. `mvp_frontend.md` – detailed frontend routes, components, and UI behavior.

The idea is to:

- Let AI tools (like Cursor) read these files as **context**.
- Then implement the backend and frontend in small, focused steps:
    - Backend: security, tenant handling, entities, integration, ingest, REST APIs, validations, release, storage.
    - Frontend: routing, data fetching hooks, 3-column layout components, forms, validation panel, release dialogs, gallery, PDF preview.

This keeps the AI **grounded** in what the MVP actually needs and avoids overengineering.
