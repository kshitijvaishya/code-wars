# Implementation Plan — Code Wars

---

## Overview

Code Wars is a competitive coding platform inspired by observed HackerRank public behavior. The implementation is entirely original code using open-source tools.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS + Monaco Editor
- Backend: Node.js + Express + TypeScript + Mongoose ORM
- Database: MongoDB
- Code Execution: Piston API (public or self-hosted)
- Real-time: Socket.io
- Auth: JWT (access + refresh tokens)

---

## Phase 1 — Project Scaffold & Infrastructure

**Goal:** Runnable skeleton with DB connection and auth.

Tasks:
1. Initialize monorepo with `client/` and `server/` packages
2. Create `docker-compose.yml` with MongoDB service
3. Set up Express server with TypeScript
4. Set up Prisma schema (users, problems, test_cases, submissions, contests, leaderboard tables)
5. Implement auth routes: register, login, refresh, me
6. JWT middleware
7. Initialize React app with Vite + Tailwind
8. Implement Login and Register pages
9. Axios client with JWT header injection and refresh interceptor

**Done when:** `POST /auth/register` and `POST /auth/login` work; React shows login/register forms.

---

## Phase 2 — Problem Management

**Goal:** Problem setters can create, edit, and preview problems.

Tasks:
1. Problem model CRUD routes (`/problems`)
2. Test case CRUD routes (`/problems/:id/testcases`)
3. Code stub generation API (`/problems/:id/stubs`)
4. Admin UI: Problem list, Problem editor (Markdown editor with preview)
5. Test case manager UI (add / edit / delete, mark as sample, set score)
6. Language selector with stub auto-generation
7. Problem detail page (render Markdown + KaTeX)

**Done when:** Admin can create a problem with test cases and view the rendered problem statement.

---

## Phase 3 — Coding Editor & Run Code

**Goal:** Users can write and run code against sample test cases.

Tasks:
1. Monaco Editor wrapper component (language switch, Vim/Emacs modes, tab size, theme)
2. Code stubs display (read-only header/footer, editable body)
3. Auto-save to `code_drafts` table (debounced every 30s)
4. Version history modal (list drafts, diff view, revert)
5. Run Code API (`POST /submissions/run`): execute against samples only via Piston API
6. Run Code output panel: per-test-case STDOUT, Expected Output, Debug Output
7. Custom input tab for Run Code
8. Language execution environment info modal

**Done when:** User can open a problem, write code, click Run Code, and see results for sample test cases.

---

## Phase 4 — Submit Code & Verdict System

**Goal:** Full submission judging against all test cases.

Tasks:
1. Submit API (`POST /submissions`): execute all test cases via Piston API
2. Parallel execution: all test cases run concurrently
3. Map Piston execution results → Code Wars verdicts
4. Score aggregation: partial (sum of passed test case scores), binary, dynamic
5. Store `test_case_results` per submission
6. Submission detail page: per-test-case verdict table (hidden cases show verdict only)
7. WebSocket: push `submission:update` to user's room when judging completes
8. Frontend: spinner while judging, then display verdict

**Done when:** User submits code, sees verdict and score within ~10 seconds via WebSocket push.

---

## Phase 5 — Contest System

**Goal:** Full contest lifecycle: create → register → compete → results.

Tasks:
1. Contest CRUD routes
2. Contest problem association (add/reorder/weight challenges)
3. Contest registration route and UI
4. Contest page: timer, problem list with per-problem score column
5. Contest state machine: automatic transition Upcoming→Active→Ended via cron job
6. Submissions within contest: link to `contest_id`
7. Contest leaderboard calculation: total score + tiebreaker (penalty time)
8. Leaderboard table UI: rank, username, total score, per-problem columns, time
9. WebSocket: push `leaderboard:update` on each contest submission
10. Post-contest: unlock editorial, reveal test cases/solutions if flagged

**Done when:** Admin creates a contest, users register, compete, and see live leaderboard updates.

---

## Phase 6 — User Dashboard & Practice Mode

**Goal:** Practice problems outside of contests.

Tasks:
1. Problem list page: filter by difficulty, tag, solved status
2. Solved indicator per problem (personal, based on best submission)
3. User profile page: stats (problems solved by difficulty, contest history)
4. My Submissions page per problem
5. Global submission history

**Done when:** Users can browse problems, track their progress, and see submission history.

---

## Phase 7 — Polish, Security & Testing

**Goal:** Production-ready quality.

Tasks:
1. Rate limiting on submission endpoints
2. Input validation with Zod on all routes
3. Error handling middleware (structured error responses)
4. Pagination on leaderboard, problem list, submission list
5. Accessibility: ARIA labels, keyboard navigation in editor
6. Responsive layout (mobile-friendly)
7. Unit tests: scoring service, leaderboard calculation, verdict mapping
8. Integration tests: auth flow, problem CRUD, submission flow
9. README with setup instructions

**Done when:** All major flows covered by tests; application is deployable.

---

## Milestone Summary

| Phase | Features | Estimated Effort |
|-------|----------|-----------------|
| 1 | Scaffold + Auth | Small |
| 2 | Problem Management | Medium |
| 3 | Editor + Run Code | Medium |
| 4 | Submit + Verdicts | Medium |
| 5 | Contests + Leaderboard | Large |
| 6 | Dashboard + Practice | Small |
| 7 | Polish + Tests | Medium |

---

## Non-Goals for v1

- Plagiarism detection
- OAuth social login
- AI-assisted feedback
- Multi-file project submissions
- Video interviews
- Mobile app
