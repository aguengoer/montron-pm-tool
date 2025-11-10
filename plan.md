# Montron PM-Tool Backend Skeleton Plan

1. Review existing project configuration and create a backup of current dependencies for reference.
2. Update `backend/pom.xml` to add required dependencies: web, security, validation, data-jpa, PostgreSQL driver, Flyway, springdoc OpenAPI starter, Spring Boot test (ensure JUnit 5) and optional Testcontainers.
3. Ensure the Maven compiler configuration targets Java 21 and Spring Boot plugin configuration remains intact.
4. Create the required package hierarchy under `backend/src/main/java/dev/montron/pm` (`config`, `common`, `integration`, `employees`, `workday`, `workday/validation`, `workday/layout`, `storage`, `pdf`, `audit`). Add placeholder classes as needed to keep packages tracked.
5. Implement `HealthController` under `config` (or another appropriate package) with `GET /api/ping` returning `{ "status": "ok" }`.
6. Implement `GlobalExceptionHandler` under `config` that handles `MethodArgumentNotValidException` and `ConstraintViolationException` producing the specified JSON structure.
7. Implement a placeholder `SecurityConfig` that disables CSRF, permits `/api/ping`, `/v3/api-docs/**`, `/swagger-ui/**`, and requires authentication elsewhere (with TODO for JWT resource server).
8. Add `application.yml` under `backend/src/main/resources/` with placeholders for server port, datasource, JPA properties, Flyway, and `form-api.base-url`.
9. Create Flyway baseline file `backend/src/main/resources/db/migration/V1__baseline.sql` with a placeholder comment.
10. Run Maven formatting/validation if available (skipped if not configured) and ensure project builds compile-time (`mvn -q -DskipTests compile`).
11. Summarize modifications, new files, and their key contents for review.
12. Update `pom.xml` with any additional dependencies required for JWT resource server support if missing.
13. Enhance `SecurityConfig` to configure OAuth2 resource server with JWT, method security, and custom authentication converter for roles.
14. Create `CurrentUser` record and `CurrentUserService` to expose authenticated user context.
15. Implement `TenantContext` and `TenantContextFilter`, wiring the filter into the security chain.
16. Add an example secured endpoint demonstrating `@PreAuthorize` usage.
17. Validate build (compilation) and summarize new security and tenant context components.

## Frontend Task – RS Panel Editing
1. Review existing RS rendering in `app/mitarbeiter/[id]/tagesdetail/[datum]/page.tsx` and related workday types to confirm current structure.
2. Add new TypeScript definitions in `lib/rsPatchTypes.ts` for RS patch payloads and create `hooks/usePatchRs.ts` mirroring the TB hook behaviour.
3. Extend the Tagesdetail page with RS drafting state, cloning logic inside `useEffect`, and wire up the `usePatchRs` mutation hook.
4. Implement a `buildRsPatch` helper plus `handleSaveRs` to compare original vs. draft data, submit patches when changes exist, and capture errors.
5. Update RS field rendering to support edit mode using a new `RsFieldEditor`, change indicators, and strikethrough of previous values similar to TB.
6. Make RS positions editable by introducing an `RsPositionsTable` that manages row-level updates in edit mode while preserving the read-only layout.
7. Verify linting or targeted type-checks if feasible to ensure the new code integrates cleanly before proceeding to subsequent phases.

## Frontend Task – Validation UI Enhancements
1. Analyse `validationIssues` usage within `useWorkdayDetail` results to confirm available data for highlighting TB/RS/Streetwatch sections.
2. Create memoized severity summaries and a `fieldIssuesMap` lookup inside the Tagesdetail page to drive badges and field-level styling.
3. Add scroll targets (refs) for TB, RS, and Streetwatch columns plus a helper to map `fieldRef` values to labels and destinations.
4. Render a validation summary in the header and a detailed issue list card that scrolls to the appropriate section when clicked.
5. Update TB, RS, and Streetwatch renderers to apply error/warning highlights and indicators based on the mapped validation issues.
6. Ensure new imports, hooks, and helpers keep TypeScript happy; adjust styling for dark mode consistency where necessary.
7. Perform lint or targeted checks if available, noting any scaffold limitations.

## Frontend Task – Release & PDF Integration
1. Add React Query mutations (`useRequestReleasePin`, `useConfirmRelease`) and a shared `useGeneratePdf` hook for TB/RS PDFs.
2. Extend Tagesdetail state to track release dialog visibility, PIN input, request progress, and PDF generation state.
3. Implement handlers for opening the release dialog (with PIN request), confirming release (with validation error handling), and invoking PDF generation endpoints.
4. Update header actions and RS card buttons to call the new handlers, disabling controls based on status and in-flight mutations.
5. Render a release confirmation dialog (PIN input, error feedback) alongside the existing image preview dialog, ensuring consistent styling in light/dark modes.
6. Trigger `useWorkdayDetail` query invalidation after successful release so status/fields refresh automatically.
7. Reuse the existing validation logic to block release when error-level issues remain, surfacing clear feedback to the user.

## Frontend Task – Form API Base URL
8.1 Update `pm-web-frontend/lib/config.ts` so the default `FORM_API_BASE_URL` includes the `/api` context path (`http://localhost:8090/api`).
8.2 Verify `.env` or environment overrides remain compatible and document the required value for local development.
8.3 Smoke test the login flow to confirm requests hit `/api/auth/login` and receive the expected CORS headers.

## Backend Task – CORS Configuration
1. Review existing security configuration in `backend/src/main/java/dev/montron/pm/config/SecurityConfig.java` and identify extension points for CORS setup.
2. Add application property (e.g. `security.cors.origins`) to `application.yml` profiles to drive allowed origins; include localhost ports 3000 and 3001 for local dev.
3. Create a `CorsConfig` class in `dev.montron.pm.config` mirroring the implementation from the Formbuilder backend, parsing the comma-separated origins and registering the configuration for all endpoints.
4. Wire the new configuration with the existing `SecurityFilterChain`, ensuring CORS support is enabled before the security filter chain processes requests.
5. Add/update tests or manual verification steps (e.g. login flow from Next.js frontend) to confirm that `Access-Control-Allow-Origin` is returned for allowed hosts.
