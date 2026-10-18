# Missing Features and Required Work

## Authentication and account management

### Password recovery and email verification
- **Exists:** Registration/login/JWT flow.
- **Missing:** Reset tokens, expiry/revocation, email verification, delivery integration, UI.
- **Why:** Account recovery and identity assurance are required for a real service.
- **Dependencies:** Email provider, token model, security review.
- **Requirements:** Add one-time hashed tokens, expiry, rate limits, audited events, and UI states.
- **Evidence:** `server/src/routes/auth.routes.ts`, `client/src/pages/AuthPage.tsx`.
- **Acceptance:** Verified users can request/reset passwords once; expired/reused tokens fail; no token is logged.
- **Effort:** M.

### Account administration
- **Exists:** Suspension/unsuspension endpoints.
- **Missing:** Admin UI, role management, account deletion/recovery, search/filter controls.
- **Why:** Operators cannot safely manage users from the product.
- **Dependencies:** Admin authorization and audit logging.
- **Requirements:** Paginated user table, suspend/restore, role changes with confirmation, audit records.
- **Evidence:** `server/src/routes/user.routes.ts`, `server/src/controllers/admin.controller.ts`, placeholder in `AdminDashboardPage.tsx`.
- **Acceptance:** Super admins can perform and audit supported account actions.
- **Effort:** L.

## Battle and matchmaking

### Durable matchmaking and multi-instance coordination
- **Exists:** Process-local matchmaking service and Socket.IO events.
- **Missing:** Durable queue, locking, reconnect recovery, worker ownership.
- **Why:** Restart or horizontal scaling loses matches and can create races.
- **Dependencies:** Redis or database queue, deployment topology.
- **Requirements:** Durable queue entries, atomic pairing, timeout cleanup, idempotent match creation, reconnect restoration.
- **Evidence:** `server/src/services/matchmaking.service.ts`, `server/src/sockets/index.ts`.
- **Acceptance:** Two server instances cannot pair a user twice; restart recovery is deterministic.
- **Effort:** XL.

### Best-of-three battles
- **Exists:** Enum/type and selectable scoring mode.
- **Missing:** Round model, round transitions, per-round problem/result state, aggregate winner.
- **Why:** Current README advertises a behavior that does not exist.
- **Dependencies:** Battle schema and scoring redesign.
- **Requirements:** Persist rounds, enforce round state machine, aggregate scores, result UI.
- **Acceptance:** Three rounds or an early decisive result complete correctly and rate once.
- **Effort:** L.

## Judging and operations

### Durable submission jobs
- **Exists:** Asynchronous `processSubmission` call and Piston batch execution.
- **Missing:** Queue, retries, dead-letter state, worker heartbeat, timeout recovery.
- **Why:** Process termination can strand submissions and battles.
- **Dependencies:** Queue/worker deployment and judge-provider policy.
- **Requirements:** Persist job state, claim/lease jobs, retry bounded failures, expose diagnostics.
- **Evidence:** `server/src/services/submission.service.ts`.
- **Acceptance:** Every accepted submission reaches a terminal verdict or explicit retry/failure state.
- **Effort:** XL.

### Production execution isolation
- **Exists:** Piston integration and documented sandbox dependency.
- **Missing:** Self-hosted/controlled execution policy, provider health checks, quotas and abuse monitoring.
- **Why:** Public execution services are not a sufficient production trust boundary.
- **Dependencies:** Infrastructure and security review.
- **Requirements:** Provider authentication, request budgets, circuit breaker, health endpoint, queue backpressure.
- **Evidence:** `server/src/judge/piston.provider.ts`, `README.md`.
- **Acceptance:** Provider failure is visible and does not silently lose submissions.
- **Effort:** L.

## Admin and content

### Complete admin console
- **Exists:** Stats, problem list/editor, publish/unpublish/delete, backend user/audit endpoints.
- **Missing:** User screen, audit screen, contest screen, battle monitor, submission diagnostics, platform settings, health monitoring.
- **Why:** Operators cannot investigate or correct production incidents.
- **Dependencies:** Admin API expansion and audit policy.
- **Requirements:** Add screens with pagination, filters, confirmations, authorization, and error states.
- **Evidence:** `client/src/pages/AdminDashboardPage.tsx`, `server/src/routes/admin.routes.ts`.
- **Acceptance:** Admin workflows can be completed without direct database access.
- **Effort:** XL.

### Problem validation and reference safety
- **Exists:** Mongoose required fields and basic form checks.
- **Missing:** Server-side test-case/score/limit validation and deletion policy for referenced problems.
- **Why:** Invalid content can break judging; deletion can orphan historical records.
- **Dependencies:** Product policy for archive versus delete.
- **Requirements:** Validate all fields, ensure positive limits and scores, require coherent test cases, archive or block referenced deletion.
- **Evidence:** `problem.controller.ts`, `Problem.ts`.
- **Acceptance:** Invalid payloads return field errors and referenced problems remain available to history.
- **Effort:** M.

## Quality and deployment

### Client lint gate
- **Exists:** Vite/Vitest scripts, passing production build, and passing client lint.
- **Missing:** Server lint configuration and lint cleanup.
- **Why:** The repository still cannot enforce a consistent lint gate across workspaces.
- **Dependencies:** ESLint 9 flat-config migration for the server.
- **Requirements:** Add a server flat config aligned with the client rules and run both workspace lint commands.
- **Evidence:** `server/package.json`, server lint output.
- **Acceptance:** Server lint exits zero without weakening type or correctness rules.
- **Effort:** M.

### CI/CD and integration tests
- **Exists:** Unit test scripts.
- **Missing:** CI workflow, MongoDB/Socket.IO/Piston integration tests, browser E2E tests, coverage thresholds.
- **Why:** Current 93 passing tests do not prove the real application path.
- **Dependencies:** Test services and stable provider stub.
- **Requirements:** Add CI matrix, ephemeral MongoDB, mocked judge, API/socket tests, browser smoke test, coverage policy.
- **Acceptance:** CI catches build, auth, problem creation, battle, submit, and result regressions.
- **Effort:** L.

## Advanced/future scope

Tournaments/brackets, spectator mode, replay, friend invitations/notifications, anti-cheat, plagiarism detection, and contest scheduling are not implemented. Each requires separate domain models, authorization, UI, and acceptance criteria before implementation.
