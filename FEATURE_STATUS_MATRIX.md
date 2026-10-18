# Feature Status Matrix

Status values: `COMPLETE`, `PARTIAL`, `FRONTEND_ONLY`, `BACKEND_ONLY`, `MISSING`, `BROKEN`, `UNVERIFIED`, `FUTURE_SCOPE`.

| Module | Feature | Frontend | Backend/API | Database | Tested | Status | Evidence |
|---|---|---|---|---|---|---|---|
| Auth | Registration | Yes | Yes | Yes | Unit only | PARTIAL | `AuthPage.tsx`, `auth.routes.ts`, `User.ts` |
| Auth | Login/logout/refresh | Yes | Yes | Yes | Unit only | PARTIAL | `auth.controller.ts`, `authStore.ts` |
| Auth | Password reset/email verification | No | No | No | No | MISSING | No routes/services/models |
| Auth | Protected routes/RBAC | Yes | Yes | Yes | Unit only | PARTIAL | `ProtectedRoute.tsx`, `authenticate.ts` |
| Users | Profile read/update | Yes | Yes | Yes | No integration | PARTIAL | `ProfilePage.tsx`, `user.controller.ts` |
| Users | Suspension APIs | No | Yes | Yes | No integration | BACKEND_ONLY | `user.routes.ts` |
| Dashboard | Dashboard statistics/history | Yes | Yes | Yes | No integration | PARTIAL | `DashboardPage.tsx`, battle history API |
| Matchmaking | Queue matching | Yes | Yes | In memory | Unit logic only | PARTIAL | `useSocket.ts`, `matchmaking.service.ts` |
| Battles | Private room/invite | Yes | Yes | Yes | Unit only | PARTIAL | `battle.service.ts`, waiting room |
| Battles | Ready/countdown/timer | Yes | Yes | Yes | Unit logic only | PARTIAL | `sockets/index.ts`, `battle.service.ts` |
| Battles | Reconnect/disconnect grace | Partial | Yes | Yes | Unit logic only | PARTIAL | `handleDisconnect` |
| Battles | Best of three | UI option/types | No lifecycle | Partial field only | No | FUTURE_SCOPE | `ScoringMode`, `scoring.service.ts` |
| Arena | Problem/editor/run/submit UI | Yes | Yes | Yes | Client tests only | PARTIAL | `BattleArenaPage.tsx`, submission routes |
| Judge | Piston execution | No separate admin UI | Yes | Tokens stored | No live provider | UNVERIFIED | `piston.provider.ts` |
| Judge | Async durable queue/retry | No | No | No | No | MISSING | Fire-and-forget `processSubmission` |
| Judge | Verdict aggregation/scoring | No | Yes | Yes | Isolated unit | PARTIAL | `submission.service.ts`, 16 tests |
| Problems | Public library/search/filter | Yes | Yes | Yes | No integration | PARTIAL | `ProblemLibraryPage.tsx` |
| Problems | Admin create/edit/publish/archive | Yes | Yes | Yes | Unit validation | PARTIAL | `ProblemEditorPage.tsx`, `problem.controller.ts` |
| Problems | Hidden test confidentiality | No | Yes | Yes | Isolated unit | PARTIAL | `Problem.ts`, `submission.service.ts` |
| Problems | Validation/reference-safe deletion | Partial | Yes | Yes | Unit validation | PARTIAL | Publication validation and reference checks added; integration coverage remains |
| Scoring | Elo/rating history | Yes | Yes | Yes | Isolated unit | PARTIAL | `scoring.service.ts`, `scoring.test.ts` |
| Results | Results/history | Yes | Yes | Yes | No integration | PARTIAL | `BattleResultPage.tsx`, controllers |
| Admin | Overview/stats | Yes | Yes | Yes | No integration | PARTIAL | Problem published/draft counts now returned by `admin.controller.ts` |
| Admin | Problem management | Yes | Yes | Yes | No integration | PARTIAL | Admin dashboard/editor |
| Admin | User management UI | No | Yes | Yes | No | BACKEND_ONLY | `/api/admin/users`, placeholder text |
| Admin | Audit-log UI | No | Yes | Yes | No | BACKEND_ONLY | `/api/admin/audit-logs` |
| Admin | Contest/battle/submission operations | No | No dedicated API/UI | No | No | MISSING | No admin surfaces |
| Realtime | Socket auth | No | Yes | User lookup | No integration | PARTIAL | Socket middleware |
| Realtime | State synchronization | Yes | Yes | Yes | No integration | PARTIAL | `useSocket.ts`, socket handlers |
| Security | Rate limits/input schemas | No | Partial | No | Unit only | PARTIAL | Auth/submission/problem routes |
| Security | Audit trail for all admin actions | No | Partial | Yes | No | PARTIAL | `AuditLog`, create-only use observed |
| Deployment | Docker stack | N/A | Yes | Yes | No container run | UNVERIFIED | `docker-compose.yml` |
| Quality | Client production build | N/A | N/A | N/A | Build pass | COMPLETE | `npm run build --workspace=client`; Vite production bundle generated |
| Quality | Server/shared build | N/A | N/A | N/A | Pass | COMPLETE | Workspace build commands |
| Quality | Lint | N/A | Partial | N/A | Client lint pass | PARTIAL | Client lint passes; server lint configuration is still missing |
| Quality | CI/CD | N/A | N/A | N/A | No | MISSING | No workflow files |
| Advanced | Tournaments/spectators/replay | No | No | No | No | FUTURE_SCOPE | No implementation found |
