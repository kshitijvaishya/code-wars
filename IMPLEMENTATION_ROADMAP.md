# Implementation Roadmap

## P0 — Security and functional blockers

| Task | Dependencies | Acceptance criteria | Effort |
|---|---|---|---|
| ~~Fix client build configuration and DOM types~~ | ~~TypeScript/Vite config decision~~ | ~~Client production build exits zero~~ | ~~M~~ **DONE** |
| ~~Repair client lint errors and stale Socket.IO state handlers~~ | ~~None~~ | ~~Client lint exits zero; battle state updates are consumed~~ | ~~M~~ **DONE** |
| Validate Socket.IO battle status and state transitions server-side | Shared status/state policy | Non-participants, invalid statuses, and invalid states are rejected | M |
| Make judging durable and recoverable | Queue/worker choice | No submission remains indefinitely in processing after worker/provider failure | XL |
| Establish controlled execution-provider policy | Infrastructure/security review | Provider failures, limits, quotas, and health are observable | L |
| Make rating/finalization updates consistent | Transaction or compensating strategy | Battle, users, and rating history cannot diverge on partial failure | L |

## P1 — Complete the 1v1 MVP

| Task | Dependencies | Acceptance criteria | Effort |
|---|---|---|---|
| Add MongoDB/HTTP/Socket.IO integration tests | Test database and judge stub | Registration through battle result is covered | L |
| Make matchmaking durable and restart-safe | Redis/queue infrastructure | Atomic pairing and reconnect recovery work across instances | XL |
| Add server-side problem/test-case validation | Content rules | Invalid limits, scores, cases, and languages are rejected | M |
| Add safe archive/reference handling for problems | Product policy | Historical battles/submissions remain readable | M |
| Complete battle state synchronization/reconnect UI | Socket event contract | Refresh/reconnect restores battle and timer state | L |
| Implement or remove best-of-three from exposed options | Battle round model | Three-round behavior is real, tested, and visible, or option is hidden | L |

## P2 — Admin and operations

| Task | Dependencies | Acceptance criteria | Effort |
|---|---|---|---|
| Build user administration UI | Admin API/audit policy | Super admin can search, suspend, restore, and review users | L |
| Build audit-log UI and complete privileged audit events | Audit schema policy | Every admin mutation has actor/resource/time metadata | M |
| Add battle/submission monitoring | Durable submission state | Admin can inspect active battles and failed judging | L |
| Add health/metrics/error reporting | Deployment observability | DB, queue, judge, and socket health are visible | L |
| Add CI/CD and coverage gates | Integration test suite | Pull requests run tests, builds, lint, and security checks | M |

## P3 — Advanced scope

| Task | Dependencies | Acceptance criteria | Effort |
|---|---|---|---|
| Tournaments and brackets | Contest domain model | Scheduled rounds advance winners correctly | XL |
| Spectator mode and battle replay | Event persistence and authorization | Authorized spectators can view/replay completed battles | L |
| Notifications/friend invitations | Notification model/service | Invites and status changes are delivered and persisted | L |
| Anti-cheat/plagiarism signals | Event/source retention policy | Suspicious activity is flagged without exposing hidden tests | XL |

## Recommended order

1. Fix the client build/lint gate and harden Socket.IO authorization/state validation.
2. Add integration tests with a judge stub and MongoDB, then implement durable submission processing and finalization consistency.
3. Complete the admin operational surfaces and observability before expanding to tournaments or other P3 features.
