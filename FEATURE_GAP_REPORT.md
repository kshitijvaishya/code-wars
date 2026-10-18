# Code Wars Feature Gap Report

## Audit scope

This audit covered the React/Vite client, Express/Mongoose server, shared types, Socket.IO integration, judge provider, models, routes, tests, documentation, Docker configuration, and environment/configuration files. It was a static and local verification audit; no destructive tests or external-system exploitation was performed. Secret values from `.env` are intentionally not reproduced.

## Project overview

Code Wars is a TypeScript monorepo with:

- `client/`: React 18, React Router, Zustand, Monaco, Vite, Tailwind, Axios, and Socket.IO client.
- `server/`: Express, Mongoose/MongoDB, JWT authentication, Socket.IO, Piston execution integration, and an Elo/scoring service.
- `shared/`: shared event and domain types.
- `docker-compose.yml`: MongoDB, API, and Nginx client services.

The intended battle state machine is represented in the model and service as `WAITING -> READY_CHECK -> COUNTDOWN -> ACTIVE -> FINALIZING -> COMPLETED`, with cancellation/failure states.

## Verification results

| Check | Result | Evidence |
|---|---|---|
| Server unit tests | PASS: 4 files, 77 tests | `npm test`, server Vitest output |
| Client unit tests | PASS: 2 files, 16 tests | `npm test`, client Vitest output |
| Shared TypeScript build | PASS | `npm run build --workspace=shared` |
| Server TypeScript build | PASS | `npm run build --workspace=server` |
| Client production build | PASS: production bundle generated | `npm run build --workspace=client`; Vite generated the production bundle successfully after separating Vitest config typing and adding DOM types to the Node config |
| Client lint | PASS | `npm run lint --workspace=client` exits successfully after removing stale bindings, completing effect dependencies, and wiring Socket.IO state handlers |
| Server lint | BROKEN/UNCONFIGURED | ESLint 9 cannot find `server/eslint.config.*` |
| API health | PASS locally | `GET http://localhost:5000/health` returned 200 |
| Real MongoDB/Piston end-to-end flow | UNVERIFIED | Requires running database, valid data, and external judge availability |

The tests are primarily isolated unit tests. They do not prove that the actual HTTP, MongoDB, Socket.IO, browser, or Piston paths work together.

## Fully implemented or substantially working

1. Registration, login, JWT access/refresh flow, logout, and authenticated `/me` endpoint exist with validation and rate limiting.
2. Password hashing uses bcrypt and normal user serialization removes password and refresh-token fields.
3. Role checks exist for `user`, `contest_admin`, and `super_admin`.
4. Public problem listing/search/filter/pagination and public problem retrieval exist.
5. Admin problem creation/editing, draft/publish state, sample/hidden test case fields, and deletion exist at API and UI level.
6. Problem hidden tests are excluded by default in Mongoose and removed again in JSON serialization.
7. Private battle creation, invite lookup, joining, two-player capacity, ready checks, countdown, timer state, and result/history endpoints exist.
8. Socket authentication checks the JWT and current suspension status.
9. Submission run/submit/history/detail/language endpoints exist, with validation and rate limits.
10. Piston batch judging, verdict mapping, sample-output exposure restrictions, hidden-test scoring, and asynchronous submission processing exist in code.
11. Elo calculation, rating history, battle completion, and basic leaderboard/profile APIs exist.
12. Docker Compose provides MongoDB, API, and client containers.

These items are “substantially working,” not all end-to-end complete; details and limitations are listed below.

## Partial, broken, or unverified features

### Authentication and users

- There is no password reset, email verification, account deletion, refresh-token revocation model beyond token-array rotation, or account recovery flow.
- The client has authentication screens and persistence, but lint reports unused state and hook dependency issues.
- User suspension/unsuspension APIs exist, but the admin UI does not expose user management.
- Profile update and public profile/rating endpoints exist, but avatar upload and full account settings do not.

### Dashboard, navigation, and battles

- Dashboard, matchmaking, waiting room, arena, results, history, and leaderboard routes are present.
- Matchmaking is implemented in Socket.IO/service code, but there is no durable queue or multi-instance coordination.
- Private room creation and invite joining exist.
- The client Socket.IO hooks register several handlers whose payload values are unused; the lint findings indicate that important state synchronization paths are incomplete.
- `best_of_three` is accepted as a scoring mode but no three-round lifecycle is implemented.
- The server uses process-local timers and in-memory matchmaking, so restart, horizontal scaling, and recovery are not reliable.
- Battle lifecycle transitions are persisted, but there is no centralized transition guard for every mutation.

### Coding and judging

- Monaco and run/submit UI exist.
- Judge integration is real in source (`server/src/judge/piston.provider.ts`), but availability, timeout behavior, retry behavior, and production isolation were not verified against a live provider.
- Submission processing is fire-and-forget from the request process. A process crash can leave submissions in `PENDING`/`PROCESSING`.
- The stored idempotency key is generated per submission; there is no client-provided idempotency enforcement or callback deduplication in the submission path.
- There is no durable job queue, retry/dead-letter path, judge-health UI, or admin diagnosis workflow.
- The `run` path supports custom input and sample tests but does not persist runs, which is acceptable for practice but limits auditability.

### Admin

- Admin dashboard overview, problem list, edit/create, publish/unpublish, and delete controls exist.
- Admin stats, audit-log, and super-admin user-list APIs exist.
- Audit logs are written for problem creation, but update, publish, delete, suspension, role changes, and operational actions are not consistently logged.
- The dashboard explicitly displays “User management available via API. Full UI coming soon.”
- There are no contest, battle-monitoring, submission-diagnostics, settings, language, or system-health screens.
- Destructive problem deletion has a browser confirmation, but there is no archival/dependency protection.

## Security and reliability findings

### High priority

1. **Battle status update authorization is incomplete.** In `server/src/sockets/index.ts`, `battle:status_update` loads a battle and checks participant membership but does not verify the battle state or validate the supplied status against an allowed transition. A participant can write arbitrary valid enum statuses at inappropriate times.
2. **Socket battle actions do not consistently verify room membership.** Ready/unready delegates to service membership checks, but status and leave paths should enforce battle ownership/state and room membership consistently.
3. **In-memory timers and matchmaking are not durable.** A restart or multiple API instances can lose queues, countdowns, expiration handlers, and disconnect grace timers.
4. **Public Piston dependency is unsuitable as the sole production execution boundary.** Availability, quotas, data handling, and resource isolation depend on an external community service. Self-hosting and an explicit execution policy are required for production.

### Medium priority

1. Battle finalization updates users and rating history in separate operations; partial failure can create inconsistent ratings, stats, and battle state.
2. `best_of_three` is advertised in README/types but not implemented in scoring.
3. Problem updates can publish content without server-side semantic validation of test cases, scores, supported languages, or limits.
4. Problem deletion does not check references from battles/submissions.
5. Search uses user-provided regular expressions through MongoDB `$regex`; query limits and escaping should be considered to reduce regex resource abuse.
6. Admin list and audit APIs lack dedicated validation schemas for pagination and filter values.
7. Client refresh logic retries any 401, including the refresh request path, and uses a browser redirect as failure handling; this needs a guarded refresh endpoint path and request queue behavior.
8. Error handling and monitoring are insufficient for judge outages, queue backlog, timer failures, and database partial failures.

### Low priority

1. No CI workflow is present in the repository.
2. Server ESLint configuration is missing.
3. Several client lint warnings/errors indicate stale state variables and missing effect dependencies.
4. Documentation describes production-oriented guarantees that the current tests do not prove.

## Missing and future-scope features

Missing or future-scope items include password reset/email verification, durable matchmaking, full account administration, contest/tournament lifecycle, best-of-three rounds, spectator mode, battle replay, notifications/friends, anti-cheat/plagiarism detection, operational monitoring, CI/CD, durable judging jobs, and a complete admin console.

## MVP conclusion

The repository contains a credible prototype and much of the intended 1v1 path, but the current MVP is not verified end-to-end. The client production build now passes, but the client lint gate still fails and the live MongoDB/Piston/Socket.IO path was not exercised by the test suite. It should be treated as an integration-stage prototype rather than a production-ready platform.

## Phase 1 verified progress

The first P0 task—repairing the client production build configuration—has been completed. `client/vite.config.ts` now uses the Vitest-aware configuration type for its existing test settings, and `client/tsconfig.node.json` includes DOM types required by Vite. The client build and client regression tests pass. No battle, judging, or admin functionality was changed.

The second P0 task—repairing client lint errors and stale Socket.IO state handlers—has also been completed. Battle events are now filtered to the active battle, matchmaking uses the server-provided invite code when available, completion updates the store and notifies the player, and affected effects declare their dependencies. Client lint, tests, and production build all pass.

## Phase 2A verified progress

The minimum admin/problem-management workflow now has server-side problem payload validation, explicit `draft`/`published`/`archived` status, publication completeness checks, public/admin route ordering protection, admin problem counts, admin search/status filters, safe deletion checks against battle/submission history, and an archive action. Hidden test cases remain excluded from public responses. Server tests now include publication-validation regression coverage.
