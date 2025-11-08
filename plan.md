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
