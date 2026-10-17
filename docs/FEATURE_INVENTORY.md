# Feature Inventory — Code Wars

_Observed from HackerRank public UI + docs. Each feature is classified as: **Confirmed Observed**, **Inferred**, or **Design Choice**._

---

## A. Authentication & User Management

| Feature | Source |
|---------|--------|
| Register with email + password | Confirmed Observed |
| Login / Logout | Confirmed Observed |
| User profile (handle, avatar, bio, join date) | Confirmed Observed |
| Role system: Participant, Problem Setter, Admin | Confirmed Observed |
| Password reset via email | Inferred |
| Session persistence (JWT or cookie) | Design Choice |

---

## B. Problem / Challenge Management

| Feature | Source |
|---------|--------|
| Create problem (name, description, markdown body) | Confirmed Observed |
| Problem statement with Markdown + LaTeX rendering | Confirmed Observed |
| Structured sections: description, input format, output format, constraints, sample I/O, explanation | Confirmed Observed |
| Problem difficulty tag (Easy / Medium / Hard) | Confirmed Observed |
| Topic tags (Algorithms, Data Structures, etc.) | Confirmed Observed |
| Auto-generate code stubs from function signature | Confirmed Observed |
| Manual code stub editing per language | Confirmed Observed |
| Read-only header/footer stubs, editable middle | Confirmed Observed |
| Editorial field (unlocked post-contest) | Confirmed Observed |
| Custom checker support (for non-exact output) | Confirmed Observed |
| Float precision tolerance flag | Confirmed Observed |
| Disable compile & test flag | Confirmed Observed |
| Disable custom test case flag | Confirmed Observed |
| Public test cases post-contest flag | Confirmed Observed |
| Public solutions post-contest flag | Confirmed Observed |

---

## C. Test Case Management

| Feature | Source |
|---------|--------|
| Add test case (name, difficulty, score, input, expected output) | Confirmed Observed |
| Mark test case as sample (visible to solver) | Confirmed Observed |
| Hidden test cases (locked during contest) | Confirmed Observed |
| Bulk upload test cases as ZIP | Confirmed Observed |
| Score per test case | Confirmed Observed |
| Partial scoring (sum of per-test-case scores) | Confirmed Observed |
| Binary scoring option (all or nothing) | Confirmed Observed |
| Dynamic scoring (score reduces as more solve it) | Confirmed Observed |

---

## D. Coding Editor

| Feature | Source |
|---------|--------|
| Monaco Editor integration | Confirmed Observed |
| 60+ language support | Confirmed Observed |
| Vim / Emacs / Normal editor mode | Confirmed Observed |
| Tab size: 2 / 4 / 8 spaces | Confirmed Observed |
| Syntax highlighting | Confirmed Observed |
| IntelliSense autocomplete (toggleable) | Confirmed Observed |
| Split layout: problem left, editor right | Confirmed Observed |
| Expandable editor panel | Confirmed Observed |
| Light / dark theme | Confirmed Observed |
| Side navigator for multi-problem contest | Confirmed Observed |
| Language dropdown switcher | Confirmed Observed |
| Switching language resets editor | Confirmed Observed |
| Auto-save draft periodically | Confirmed Observed |
| Version history (compare / revert) | Confirmed Observed |
| Custom input for Run Code | Confirmed Observed |
| Raw / formatted input toggle | Confirmed Observed |
| Output panel docking | Confirmed Observed |

---

## E. Run Code

| Feature | Source |
|---------|--------|
| Execute code against sample test cases | Confirmed Observed |
| Execute code with custom input | Confirmed Observed |
| Show STDIN, STDOUT, Expected Output, Debug Output | Confirmed Observed |
| Download STDIN/STDOUT/expected output | Confirmed Observed |
| Play icon per STDIN to run that case individually | Confirmed Observed |
| Debug print output isolated from score | Confirmed Observed |

---

## F. Submit Code

| Feature | Source |
|---------|--------|
| Submit runs all test cases including hidden | Confirmed Observed |
| Score calculated per test case (pass/fail) | Confirmed Observed |
| Exact string match comparison | Confirmed Observed |
| Verdict: Accepted, Wrong Answer, TLE, MLE, Runtime Error, Compile Error, Internal Error | Confirmed Observed |
| Submission history per problem per user | Inferred |
| Show execution time and memory per test case | Inferred |
| Best score tracked (max across all submissions) | Confirmed Observed |

---

## G. Contest Management

| Feature | Source |
|---------|--------|
| Create contest (name, tagline, description, start/end) | Confirmed Observed |
| Add challenges to contest (ordered) | Confirmed Observed |
| Drag-and-drop challenge ordering | Confirmed Observed |
| Per-challenge weight in contest | Confirmed Observed |
| Public / private / invite-only contest | Confirmed Observed |
| Password-protected contest | Inferred |
| Register for contest | Confirmed Observed |
| Contest state machine: Upcoming → Active → Ended | Confirmed Observed |
| Countdown timer during active contest | Inferred |
| Post-contest editorial unlock | Confirmed Observed |
| Post-contest public solutions | Confirmed Observed |

---

## H. Leaderboard

| Feature | Source |
|---------|--------|
| Ranked by total score (descending) | Confirmed Observed |
| Tiebreaker: cumulative time of last score-improving submission | Confirmed Observed |
| Dense ranking (equal scores = same rank) | Confirmed Observed |
| Real-time leaderboard updates | Inferred |
| Show: rank, username, total score, per-problem score, time | Confirmed Observed |
| Pagination | Inferred |

---

## I. User Dashboard / Practice

| Feature | Source |
|---------|--------|
| Problem list with filters (difficulty, tags, solved status) | Confirmed Observed |
| Solve status indicator per problem | Confirmed Observed |
| Badge / skill level progression | Confirmed Observed |
| Submission history | Inferred |
| Practice problems outside contests | Confirmed Observed |

---

## J. Administration

| Feature | Source |
|---------|--------|
| Admin panel for managing challenges | Confirmed Observed |
| Admin panel for managing contests | Confirmed Observed |
| User management | Inferred |
| Quality review checklist for problems | Confirmed Observed |

---

## K. Infrastructure / Backend

| Feature | Source |
|---------|--------|
| Code execution sandbox (Piston or equivalent) | Confirmed Observed (Piston is modern open-source standard) |
| Queue-based submission processing | Confirmed Observed |
| Per-language time/memory limits | Confirmed Observed |
| Plagiarism detection (out of scope v1) | Confirmed Observed |
| WebSocket for real-time updates | Design Choice |
| REST API | Design Choice |
