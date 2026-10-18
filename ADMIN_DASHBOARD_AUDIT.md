# Admin Dashboard Audit

## Existing surfaces

### Frontend

- `/admin` is protected for `contest_admin` and `super_admin`.
- The dashboard displays aggregate stats.
- The Problems tab lists admin problems and supports edit, publish/unpublish, and delete.
- `/admin/problems/new` and `/admin/problems/:id` provide the problem editor.
- The navbar exposes Admin only to admin roles.
- The Users tab is explicitly a placeholder: “User management available via API. Full UI coming soon.”

Evidence: `client/src/App.tsx`, `client/src/components/layout/Navbar.tsx`, `client/src/pages/AdminDashboardPage.tsx`, `client/src/pages/ProblemEditorPage.tsx`.

### Backend

All admin routes use `authenticate` and an outer `authorize('contest_admin', 'super_admin')`:

- `GET /api/admin/stats`
- `GET /api/admin/audit-logs`
- `GET /api/admin/users` restricted further to `super_admin`
- Problem list/get/create/update restricted to contest or super admin
- Problem delete restricted to super admin
- User suspend/unsuspend restricted to super admin

Evidence: `server/src/routes/admin.routes.ts`, `server/src/routes/problem.routes.ts`, `server/src/routes/user.routes.ts`.

## Capability assessment

| Capability | UI | API | DB operation | Status |
|---|---|---|---|---|
| Dashboard totals | Yes | Yes | Counts/queries | PARTIAL |
| Problem creation/editing | Yes | Yes | `Problem` writes | PARTIAL |
| Publish/unpublish | Yes | Yes | `isPublished` update | PARTIAL |
| Problem deletion | Yes | Yes | Delete | PARTIAL |
| User listing/search | No | Yes | `User.find` | BACKEND_ONLY |
| Suspend/restore | No | Yes | User update | BACKEND_ONLY |
| Role management | No | No | No | MISSING |
| Audit log viewing | No | Yes | `AuditLog.find` | BACKEND_ONLY |
| Contest management | No | No | No | MISSING |
| Battle monitoring | No | No dedicated admin API | No | MISSING |
| Submission diagnostics | No | No admin endpoint | No | MISSING |
| Platform settings/languages | No | No | No | MISSING |
| Health/error monitoring | No | Only public health endpoint | No | MISSING |

## Authorization and security observations

- Role checks are present and server-side; the frontend role gate is not relied on for authorization.
- Current-user suspension is checked by HTTP and Socket.IO authentication.
- Admin updates are not uniformly audited. Problem creation records an audit event, but update/publish/delete and user administration were not found to create equivalent records.
- Problem status now supports draft, published, and archived states; the dashboard supports search/status filters and archive actions.
- Deletion now rejects problems referenced by battle or submission history and directs the administrator to archive them.
- Problem delete does not check historical battle/submission references or offer archive semantics.
- Admin query parameters are parsed manually rather than through the shared validation middleware.
- Admin operations have no visible failure/retry/diagnostic workflow beyond toast messages.

## Required work to become operational

1. Build a paginated user-management screen with search, suspension, role policy, confirmations, and audit history.
2. Build audit-log and system-health screens.
3. Add admin APIs for battle inspection, submission/judge diagnostics, and safe problem archive/reference checks.
4. Add contest/schedule/access-control management if contests remain in scope.
5. Add comprehensive audit events for every privileged mutation.
6. Add integration tests for every role boundary and destructive action.

## Conclusion

The dashboard is a real partial admin surface, not a complete operational admin system. Problem CRUD is the strongest implemented area; user, audit, monitoring, contest, and incident-response capabilities remain absent from the UI.
