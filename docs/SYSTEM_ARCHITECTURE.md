# System Architecture — Code Wars

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                   │
│  Monaco Editor │ Contest UI │ Leaderboard │ Admin Panel │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST / WebSocket
┌────────────────────────▼────────────────────────────────┐
│                   BACKEND API (Node.js/Express)         │
│  Auth │ Problems │ Contests │ Submissions │ Leaderboard │
└──────────────┬──────────────────────────────────────────┘
               │ REST (Judge0 API)
┌──────────────▼──────────────────┐    ┌──────────────────┐
│   CODE EXECUTION ENGINE         │    │   DATABASE        │
│   Judge0 (self-hosted Docker)   │    │   PostgreSQL       │
│   or Judge0 CE public API       │    │                   │
└─────────────────────────────────┘    └──────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend (React + TypeScript)

| Component | Responsibility |
|-----------|---------------|
| `AuthProvider` | JWT storage, login/logout state |
| `ProblemView` | Renders Markdown problem statement, sample I/O |
| `CodeEditor` | Monaco Editor wrapper, language switch, stubs, auto-save |
| `RunPanel` | Run Code output: STDIN, STDOUT, Expected, Debug |
| `SubmitPanel` | Submission verdict, per-test-case results |
| `ContestPage` | Contest timer, problem list, navigation |
| `Leaderboard` | Real-time ranked table, WebSocket updates |
| `AdminDashboard` | Problem CRUD, contest CRUD |
| `ProblemEditor` | Markdown editor (problem creation) |
| `TestCaseManager` | Add/edit/delete/upload test cases |

**Libraries:**
- React 18 + TypeScript
- Monaco Editor (`@monaco-editor/react`)
- React Router v6
- Axios (HTTP)
- Socket.io-client (WebSocket)
- React Markdown + KaTeX (LaTeX rendering)
- Tailwind CSS (styling)

---

### 2.2 Backend API (Node.js + Express + TypeScript)

| Module | Routes | Responsibility |
|--------|--------|---------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | JWT-based auth |
| Users | `GET /users/:id` | Profile data |
| Problems | `GET /problems`, `POST /problems`, `GET /problems/:id`, `PUT /problems/:id` | Problem CRUD |
| Test Cases | `POST /problems/:id/testcases`, `DELETE /problems/:id/testcases/:tcId` | Test case CRUD |
| Code Execution | `POST /submissions/run` | Run against samples |
| Submissions | `POST /submissions`, `GET /submissions/:id` | Submit + verdict |
| Contests | `GET /contests`, `POST /contests`, `GET /contests/:id`, `PUT /contests/:id` | Contest CRUD |
| Leaderboard | `GET /contests/:id/leaderboard` | Contest standings |
| WebSocket | `ws://` events: `submission:update`, `leaderboard:update` | Real-time push |

**Middleware:**
- `authenticate` — validates JWT, attaches `req.user`
- `authorize(roles)` — role-based guard
- `rateLimiter` — prevent submission spam
- `validateSchema` — Zod-based request validation

---

### 2.3 Database (PostgreSQL)

#### Schema Overview

```sql
-- Users
users (id, username, email, password_hash, role, avatar_url, created_at)

-- Problems
problems (id, title, slug, description_md, input_format, output_format, 
          constraints_md, notes_md, editorial_md, difficulty, created_by, 
          is_public, time_limit_ms, memory_limit_mb, created_at)

-- Problem Tags
problem_tags (problem_id, tag)

-- Code Stubs
code_stubs (id, problem_id, language_id, header_code, body_code, footer_code)

-- Test Cases
test_cases (id, problem_id, name, difficulty, score, input, expected_output, 
            is_sample, order_index)

-- Contests
contests (id, slug, title, tagline, description_md, start_time, end_time, 
          is_public, password_hash, created_by, status, created_at)

-- Contest Problems
contest_problems (id, contest_id, problem_id, weight, order_index, 
                  scoring_mode ENUM('partial','binary','dynamic'))

-- Contest Registrations
contest_registrations (user_id, contest_id, registered_at)

-- Submissions
submissions (id, user_id, problem_id, contest_id, language_id, source_code, 
             status ENUM('queued','processing','done'), score, 
             verdict, submitted_at, judged_at)

-- Test Case Results (per submission)
test_case_results (id, submission_id, test_case_id, verdict, stdout, 
                   stderr, time_ms, memory_kb, score_earned)

-- Code Drafts (auto-save)
code_drafts (id, user_id, problem_id, language_id, source_code, saved_at)

-- Leaderboard Cache
contest_leaderboard (user_id, contest_id, total_score, penalty_time, 
                     last_updated, per_problem_scores JSONB)
```

---

### 2.4 Code Execution Engine

- **Primary:** Judge0 CE (open-source, self-hosted via Docker)
- **Fallback / Dev:** Judge0 public CE API (`https://ce.judge0.com/`) with API key

#### Submission Flow
1. Backend creates a batch submission to Judge0 with all test cases.
2. Poll Judge0 every 500ms until all results are ready (status ≠ 1 or 2).
3. Map Judge0 status IDs to Code Wars verdicts:

| Judge0 Status | Code Wars Verdict |
|--------------|-------------------|
| 3 | Accepted |
| 4 | Wrong Answer |
| 5 | Time Limit Exceeded |
| 6 | Compilation Error |
| 7–12 | Runtime Error |
| 13 | Internal Error |

4. Aggregate scores, update DB, push via WebSocket.

---

### 2.5 Real-Time (WebSocket via Socket.io)

| Event (server→client) | Payload | When |
|----------------------|---------|------|
| `submission:update` | `{ submissionId, status, verdict, score, results[] }` | Submission judged |
| `leaderboard:update` | `{ contestId, entries[] }` | Any contest submission changes leaderboard |
| `contest:state` | `{ contestId, state }` | Contest starts/ends |

Client joins rooms: `user:{userId}`, `contest:{contestId}`.

---

## 3. Directory Structure

```
code-wars/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/       # Monaco editor wrapper
│   │   │   ├── problem/      # Problem statement, test cases
│   │   │   ├── submission/   # Run panel, verdict panel
│   │   │   ├── contest/      # Contest page, timer, leaderboard
│   │   │   └── admin/        # Admin dashboard, problem/contest editors
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/              # Axios client
│   │   ├── store/            # Zustand state
│   │   └── types/
│   └── package.json
│
├── server/                   # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── judge.service.ts    # Judge0 integration
│   │   │   ├── scoring.service.ts  # Score aggregation
│   │   │   └── leaderboard.service.ts
│   │   ├── models/           # Prisma schema / raw pg models
│   │   ├── middleware/
│   │   ├── sockets/          # Socket.io handlers
│   │   └── types/
│   └── package.json
│
├── shared/                   # Shared types between client + server
│
├── docker-compose.yml        # PostgreSQL + Judge0 + server
├── docs/                     # This documentation
└── README.md
```

---

## 4. Security Considerations

- All code execution runs inside Judge0's isolated sandbox (cgroups, namespace isolation).
- No user code runs on the main application server.
- JWT tokens with short expiry + refresh token pattern.
- Rate limiting on `/submissions` endpoints.
- Input validation with Zod on all API routes.
- SQL via parameterized queries (Prisma ORM or pg with tagged templates).
- CORS restricted to frontend origin.
- Problem setter can only edit their own problems (unless admin).
- Admin role required for contest management.
