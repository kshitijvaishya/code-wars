# Code Wars — Technical Product Requirements Document (PRD)

**Product:** Code Wars — Live Coding Tournament Platform  
**Deployment:** Vercel Serverless  
**Architecture:** Single repository, single application, serverless APIs  
**Tournament format:** Dynamic groups → group winners → finalists → DSA final

---

## 1. Product Overview

Code Wars is a real-time, competitive coding platform designed for college coding competitions. Participants compete in head-to-head matches across three rounds:

1. **Predict the Output:** Multiple-choice questions about code execution.
2. **Debug the Code:** Identify and correct errors by submitting corrected code.
3. **DSA Final:** Qualified finalists solve two data structures and algorithms problems within 30 minutes.

The platform provides admin-controlled matchmaking, live player status, synchronized timers, programming-language selection, automatic question progression, scoring, group-wise leaderboards, and tournament advancement.

The interface uses a UCL-style knockout bracket as inspiration, with opening matchups labelled by dynamic group identifiers (A, B, C, D, etc.). These are tournament group labels, not permanent team memberships.

---

## 2. Core Product Goals

- Support dynamic tournament sizes with configurable participant limits.
- Allow the admin to see connected and eligible participants and manually create matchups.
- Provide three distinct rounds with different question types and timers.
- Automatically advance questions when their timers expire.
- Calculate scores on the server and maintain accurate leaderboards.
- Qualify the highest-scoring player from each opening group.
- Select the top qualifying group winners for the DSA final.
- Deploy the complete application from one repository through one Vercel project.
- Prevent players from accessing hidden questions, test cases, or other players' submissions.

---

## 3. User Roles

### 3.1 Admin

The admin can:

- Create and configure a tournament with flexible participant limits.
- Open and close the lobby.
- View online participants and their readiness.
- Create, rename, and assign participants to dynamic groups.
- Drag and drop participants to create or modify matches before they begin.
- Select and publish questions for each round.
- Configure languages, scoring rules, and time limits.
- Start, pause, resume, or cancel a round, subject to tournament state.
- View live scores, submissions, match status, and rankings.
- Resolve ties using configured tie-break rules.
- Advance qualified players and launch the DSA final.
- Handle odd numbers and late arrivals through explicit decisions.
- View final results and export the leaderboard.

### 3.2 Player

The player can:

- Sign in and join the tournament lobby.
- See their connection status and assigned matchup.
- Select a supported programming language.
- Participate in the three rounds.
- Submit answers or corrected code.
- View remaining time and submission feedback.
- See their match status and permitted leaderboard information.
- Reconnect and resume the current contest state after a temporary disconnection.

Players must not be able to change scores, extend timers, reveal hidden tests, or assign themselves to another match.

---

## 4. Tournament Format

### 4.1 Dynamic Tournament Structure

**Critical Rule: Never hardcode eight players or four groups.**

The tournament structure adapts to the number of registered participants:

- **Minimum participants:** Configurable (e.g., 4, 6, or 8).
- **Maximum participants:** Configurable (e.g., 16, 32).
- **Groups:** Created dynamically based on participant count.
- **Group size:** Always two players per match (1v1).
- **Odd numbers:** One player may remain in the waiting pool. **Never award an automatic win or free points.**
- **Late arrivals:** Admin decides whether to include them in the current stage or reserve for the next tournament.

#### Example Configurations

**8 participants → 4 groups:**
```
Group A: Player 1 vs Player 2
Group B: Player 3 vs Player 4
Group C: Player 5 vs Player 6
Group D: Player 7 vs Player 8
```

**10 participants → 5 groups:**
```
Group A: Player 1 vs Player 2
Group B: Player 3 vs Player 4
Group C: Player 5 vs Player 6
Group D: Player 7 vs Player 8
Group E: Player 9 vs Player 10
```

**7 participants → 3 groups + 1 waiting:**
```
Group A: Player 1 vs Player 2
Group B: Player 3 vs Player 4
Group C: Player 5 vs Player 6
Waiting: Player 7 (admin decision required)
```

### 4.2 Tournament Flow

1. Admin opens the lobby and sets tournament configuration.
2. Participants join (minimum required to start).
3. Admin creates groups and assigns two players to each opening group.
4. Admin confirms all matches.
5. Round 1 starts in all groups simultaneously.
6. Players complete 15 timed multiple-choice questions.
7. Round 2 starts in all groups simultaneously.
8. Players complete five timed debugging questions.
9. The platform calculates each group's winner.
10. All group winners appear on the qualification leaderboard.
11. The top qualifying group winners advance to the DSA final (configurable: typically top 2).
12. The final begins with a 10-second countdown.
13. Finalists solve two DSA problems in 30 minutes.
14. The platform calculates the final result and publishes the tournament leaderboard.

**Important:** If fewer than the minimum required finalists remain (e.g., only 1 qualified group winner when 2 are needed), require an admin decision rather than inventing a finalist or awarding automatic wins.

### 4.3 Fair Scoring Principle

**Every participant in the same stage follows the same timer, scoring, and judging rules.**

- All opening groups use identical Round 1 and Round 2configurations.
- All finalists use identical DSA round settings.
- No participant receives extra time, easier questions, or bonus points based on their group assignment.

---

## 5. Round 1 — Predict the Output

### 5.1 Requirements

- Question type: Multiple-choice question (MCQ).
- Number of questions: 15.
- Time per question: 45 seconds.
- Total nominal round duration: 11 minutes and 15 seconds.
- Supported content: Source code, output options, and one correct answer.
- Question navigation: Automatic progression when the timer expires.

### 5.2 Player Flow

1. Both matched players see a 10-second pre-round countdown.
2. Each player sees a programming-language selection popup.
3. The selected language is locked for the round once the contest begins.
4. The first question appears.
5. The player reads the code and selects one output option.
6. The answer is submitted and locked.
7. The next question appears automatically.
8. If the player does not answer within 45 seconds, the question is marked unanswered and the platform advances.
9. After question 15, the round is completed and the score is saved.

### 5.3 Language Selection

Recommended initial languages:

- C++
- Java
- Python
- JavaScript

Each player chooses their language independently. The question bank must provide equivalent questions and difficulty for the selected language.

The two players in a match should receive questions with equivalent difficulty and scoring, even when their chosen languages differ.

### 5.4 Scoring

Recommended initial configuration:

- Correct answer: +10 points.
- Incorrect answer: 0 points.
- Unanswered question: 0 points.
- No negative marking.

Maximum score: 150 points.

The admin should be able to change scoring settings before the tournament starts. Scoring rules must be locked for active rounds.

---

## 6. Round 2 — Debug the Code

### 6.1 Requirements

- Question type: Code debugging and correction.
- Number of questions: 5.
- Time per question: 2 minutes 30 seconds.
- Total nominal round duration: 12 minutes 30 seconds.
- Supported languages: C++, Java, Python, JavaScript.
- Submission type: Corrected source code.

### 6.2 Player Flow

1. Both players enter the debugging round.
2. The programming language selected in Round 1 remains selected by default.
3. The platform displays a buggy code snippet and the problem instructions.
4. The player edits the code in Monaco Editor.
5. The player submits the corrected code.
6. The judging service evaluates the submission against the question's test cases.
7. The player receives an allowed verdict, such as Accepted, Wrong Answer, Compilation Error, or Time Limit Exceeded.
8. The question is locked when the timer expires.
9. The next debugging question appears automatically.
10. After question five, the platform finalizes the round score.

### 6.3 Submission Rules

- Allow multiple submissions during the question timer.
- Only submissions received before the deadline may be considered.
- Use the best valid score obtained for that question.
- Apply any partial-credit rules configured by the admin.
- Do not reveal hidden test cases.
- Do not accept submissions after the question deadline.
- Preserve code drafts when navigating between questions or reconnecting.

### 6.4 Scoring

Recommended default:

- Each debugging question: maximum 50 points.
- Full correction passing all required tests: 50 points.
- Partial credit: proportional to passed tests, if enabled.
- No valid correction: 0 points.

Maximum score: 250 points.

The admin can configure scoring before the tournament begins. The backend must calculate the final score using trusted judging results.

---

## 7. Group Qualification and Leaderboard

### 7.1 Preliminary Group Scoring

For each participant:

```
Preliminary Score = Round 1 Score + Round 2 Score
```

Maximum preliminary score under the default configuration: 400 points.

Each group has two participants. The participant with the higher preliminary score becomes that group's winner.

### 7.2 Variable Qualification System

**Critical Rule: Rank eligible group winners using the configured scoring rules.**

The platform then ranks all group winners using the following order:

1. Higher preliminary score.
2. Higher Round 2 score.
3. Higher number of correct MCQ answers.
4. Lower total time taken to obtain accepted debugging solutions, where applicable.
5. Admin resolution if a tie remains.

Tie-break rules must be displayed to the admin and configured before the competition begins.

#### Qualification for DSA Final

- **Default configuration:** Top 2 group winners qualify for the DSA final.
- **Configurable:** Admin can set the number of finalists (e.g., 2, 4, or playoff bracket).
- **Insufficient qualifiers:** If fewer than the required number of eligible finalists remain, require an admin decision rather than inventing a finalist.

Example scenarios:

**Scenario 1: 4 groups, top 2 qualify**
- Group winners: A, B, C, D
- Qualification leaderboard ranks all four
- Top 2 advance to DSA final
- Remaining 2 are eliminated

**Scenario 2: 5 groups, top 2 qualify**
- Group winners: A, B, C, D, E
- Qualification leaderboard ranks all five
- Top 2 advance to DSA final
- Remaining 3 are eliminated

**Scenario 3: 3 groups, top 2 required**
- Group winners: A, B, C
- All three qualify for the qualification leaderboard
- Top 2 advance to DSA final
- Remaining 1 is eliminated

**Scenario 4: Only 1 group winner available**
- Require admin decision
- Options: declare winner by default, cancel final, or adjust tournament structure

### 7.3 Leaderboard Views

The application must provide:

- **Live match leaderboard:** Current scores for both players in each opening group.
- **Group leaderboard:** Ranking of the two participants in each group.
- **Qualification leaderboard:** Ranking of all group winners.
- **Final leaderboard:** Final DSA scores and winner.
- **Tournament results:** All participants, scores, match history, and final positions.

Scores should update in real time without requiring page refreshes. The client displays server-calculated scores and never calculates authoritative rankings independently.

---

## 8. Round 3 — DSA Final

### 8.1 Requirements

- Participants: Qualified finalists (configurable, typically 2).
- Number of problems: Two.
- Total duration: 30 minutes.
- Editor: Monaco Editor.
- Supported languages: C++, Java, Python, JavaScript.
- Execution: Existing judging service, once integration is verified.
- Timer: Server-authoritative.
- Scoring: Backend-calculated based on the configured judging and scoring rules.

### 8.2 Player Flow

1. The qualified finalists are notified of qualification.
2. All finalists enter the final room.
3. A synchronized 10-second countdown appears.
4. A language-selection popup appears.
5. Each finalist selects a supported language.
6. The DSA arena opens with two problems.
7. The player can navigate between the problems.
8. The code draft is preserved independently for each problem and language.
9. Run executes code against permitted sample or custom tests.
10. Submit evaluates code against the hidden judging tests.
11. At 30 minutes, submissions are closed.
12. Final scores are calculated and persisted.
13. The winner is announced.

### 8.3 Recommended DSA Scoring

Configure each problem for a maximum of 100 points, for a total of 200 points.

Use passed hidden tests and any configured partial-credit rules to determine scores. Tie-breaking should use the preconfigured scoring rules, such as the number of fully solved problems and submission time, followed by admin resolution if required.

The platform must not automatically declare the first submission to be the winner. The final result depends on the configured scoring rules and valid judging results.

---

## 9. Matchmaking System

### 9.1 Live Lobby

When a player clicks **Join Matchmaking**:

- Validate the player's authenticated identity.
- Register their participation in the active tournament.
- Display their name and connection status in the admin dashboard.
- Prevent duplicate active lobby entries.
- Show whether the participant is waiting, paired, ready, in a battle, or disconnected.

### 9.2 Admin-Controlled Pairing

The admin dashboard should include:

- Live participant panel showing all registered participants.
- Dynamic group creation interface.
- Group naming/labeling controls (A, B, C, D, etc.).
- Drag-and-drop participant cards.
- Manual assignment and reassignment.
- Auto-pair remaining participants option.
- Clear and confirm matchup actions.
- Warning for odd number of participants.
- Start all opening matches simultaneously.
- Match status and live scores for each group.

**Key behaviors:**

- Display waiting participants who have not been assigned.
- Show warning when participant count is odd.
- Allow admin to explicitly decide what to do with unmatched participants.
- Prevent starting the tournament if critical assignments are incomplete.

Match assignments must be saved to the database before the players are notified.

### 9.3 Match States

```
WAITING → PAIRED → READY → COUNTDOWN → IN_PROGRESS → COMPLETED
```

Additional terminal or recovery states:

- CANCELLED
- DISCONNECTED
- ABANDONED

A participant must not belong to two active matches simultaneously. Only authorized admins can change pairings, and pairings become locked when the match starts.

---

## 10. Countdown, Timer, and Question Progression

### 10.1 Initial Countdown

Every match begins with a 10-second countdown after the admin starts the round.

The countdown is generated from a server-authoritative start timestamp, not a browser-only timer.

### 10.2 Per-Question Timer

- Round 1: 45 seconds per question.
- Round 2: 150 seconds per question.
- Round 3: 30 minutes total.

### 10.3 Automatic Advancement

When a question expires:

1. The backend determines that the deadline has passed.
2. The current question is closed.
3. Unanswered questions receive zero points.
4. Late submissions are rejected.
5. The next question becomes available.
6. Clients receive a real-time state update.

Timer correctness must not depend on whether a browser tab remains open. When a player reconnects, the backend returns the current round, question index, and remaining time based on stored deadlines.

For the DSA round, the total contest deadline is authoritative. Players can switch between the two problems without resetting the timer.

---

## 11. Coding Arena Requirements

The coding arena must provide:

- Problem statement and constraints.
- Sample input and output.
- Monaco Editor.
- Language selector.
- Run and Submit actions.
- Test execution results.
- Submission history.
- Current score and remaining time.
- Question navigation.
- Connection status.
- Per-problem and per-language draft persistence.

Run and Submit must have separate semantics:

**Run:** Executes code against permitted sample or custom tests and displays results without awarding authoritative contest points.

**Submit:** Sends code to the secure judging service and records the official verdict and score.

The backend must enforce execution timeouts, memory limits, language restrictions, and request-size limits.

---

## 12. Admin Question Management

The admin can:

- Create questions for each round.
- Edit question statements.
- Select supported languages.
- Configure MCQ options and correct answers.
- Add buggy code and expected corrections.
- Add DSA problem statements.
- Configure sample and hidden tests.
- Save drafts.
- Publish questions.
- Archive unused questions.
- Configure points and time limits.

Drafts may contain incomplete fields, but published questions must satisfy all validation requirements.

Hidden answers, expected corrections, and private test cases must never be included in public API responses.

Question selection and scoring configuration must be locked once the relevant round begins.

---

## 13. Technical Architecture — Single Vercel Project

### 13.1 Repository Structure

The entire application should live in one repository and deploy through one Vercel project.

Suggested structure:

```
code-wars/
├── api/
│   ├── auth/
│   ├── tournaments/
│   ├── lobby/
│   ├── matches/
│   ├── rounds/
│   ├── questions/
│   ├── submissions/
│   ├── leaderboard/
│   └── admin/
├── src/
│   ├── components/
│   ├── pages/
│   ├── features/
│   │   ├── matchmaking/
│   │   ├── predict-output/
│   │   ├── debug-code/
│   │   ├── dsa-arena/
│   │   └── leaderboard/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validation/
│   ├── scoring/
│   ├── tournament/
│   ├── realtime/
│   └── judging/
├── models/
├── tests/
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

This is a single-repository structure, not two separately deployed applications.

### 13.2 Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS.
- **State management:** Zustand.
- **Editor:** Monaco Editor.
- **Backend APIs:** Vercel serverless functions using TypeScript.
- **Database:** MongoDB Atlas with Mongoose or compatible data-access modules.
- **Authentication:** Existing implementation, with server-side validation.
- **Real-time communication:** Managed provider such as Ably or Pusher.
- **Code execution:** Existing secure judging service (Piston).
- **Deployment:** One Vercel project connected to the repository.

### 13.3 Serverless Constraints

Vercel Functions are stateless request handlers and are not suitable for hosting a permanently running Socket.IO server.

The application must therefore use a managed real-time service for presence and event delivery, or another hosted real-time service compatible with serverless deployments.

There is no need for a separately maintained Express server. Express route handlers can be migrated into Vercel API functions while reusing application services, validation, database models, and scoring logic.

A single repository does not mean every process runs inside Vercel. The external database, real-time provider, and secure judging service are managed dependencies accessed through the same application.

---

## 14. Database Models

### User

- `_id`
- `username`
- `email`
- `role`
- `createdAt`

### Tournament

- `_id`
- `name`
- `status`
- `minParticipants` (e.g., 4, 6, 8)
- `maxParticipants` (e.g., 16, 32)
- `participantIds`
- `numFinalists` (e.g., 2, 4)
- `roundConfiguration`
- `scoringConfiguration`
- `startedAt`
- `completedAt`

### Match

- `_id`
- `tournamentId`
- `groupLabel` (dynamic: A, B, C, D, E, etc.)
- `playerIds` (always exactly 2)
- `status`
- `currentRound`
- `roundStartedAt`
- `roundDeadline`
- `winnerId`
- `createdAt`
- `completedAt`

### Question

- `_id`
- `roundType`
- `language`
- `difficulty`
- `statement`
- `publicExamples`
- `privateAnswerData`
- `testCaseReferences`
- `points`
- `status`

Private answer data must be excluded from player-facing queries.

### PlayerRoundState

- `_id`
- `matchId`
- `playerId`
- `roundType`
- `language`
- `currentQuestionIndex`
- `score`
- `answers`
- `startedAt`
- `completedAt`

### Submission

- `_id`
- `matchId`
- `playerId`
- `questionId`
- `language`
- `sourceCode`
- `verdict`
- `passedTests`
- `totalTests`
- `score`
- `submittedAt`

### LeaderboardEntry

- `_id`
- `tournamentId`
- `playerId`
- `groupLabel`
- `round1Score`
- `round2Score`
- `preliminaryScore`
- `qualified`
- `finalScore`
- `finalRank`

Leaderboard entries can be maintained as derived records, but the underlying match and submission records remain the source of truth.

---

## 15. API Requirements

Representative endpoints:

### Tournament and Lobby

- `POST /api/tournaments` — Create a tournament.
- `GET /api/tournaments/:id` — Read tournament state.
- `PATCH /api/tournaments/:id` — Update tournament configuration.
- `POST /api/tournaments/:id/join` — Join the lobby.
- `POST /api/tournaments/:id/leave` — Leave the lobby.
- `GET /api/tournaments/:id/participants` — List eligible participants.

### Matchmaking

- `POST /api/matches/groups` — Create a new group.
- `PATCH /api/matches/groups/:groupId` — Rename or update group.
- `POST /api/matches/assign` — Assign two players to a match.
- `POST /api/matches/unpair` — Remove an unstarted pairing.
- `POST /api/matches/auto-pair` — Pair eligible waiting players.
- `POST /api/matches/:id/start` — Start a match.
- `GET /api/matches/:id` — Retrieve authorized match state.

### Rounds and Questions

- `POST /api/matches/:id/rounds/start` — Start the configured round.
- `GET /api/matches/:id/state` — Retrieve the current round and deadline.
- `GET /api/matches/:id/questions/current` — Retrieve the current permitted question.
- `POST /api/answers` — Submit an MCQ answer.
- `POST /api/submissions/run` — Run permitted tests.
- `POST /api/submissions` — Submit code for official judging.

### Results and Administration

- `GET /api/tournaments/:id/leaderboard` — Read tournament rankings.
- `POST /api/tournaments/:id/qualify` — Finalize qualification through an authorized server operation.
- `POST /api/tournaments/:id/final/start` — Start the DSA final.
- `GET /api/tournaments/:id/results` — Read finalized results.

These are logical API contracts. The implementation should align route naming and HTTP methods with the existing project where possible.

---

## 16. Real-Time Events

The real-time layer should broadcast authorized events such as:

- `lobby:participant-joined`
- `lobby:participant-left`
- `lobby:presence-updated`
- `match:assigned`
- `match:ready`
- `match:started`
- `round:countdown`
- `round:started`
- `question:changed`
- `timer:updated`
- `submission:updated`
- `score:updated`
- `match:completed`
- `qualification:updated`
- `tournament:completed`

Events notify clients of changes; they do not independently authorize actions or determine scores. Sensitive data must only be delivered to the appropriate player, match, or admin channel.

---

## 17. Security Requirements

- Authenticate all private endpoints.
- Enforce admin authorization on tournament and matchmaking controls.
- Verify that a player belongs to the requested match before returning questions or accepting submissions.
- Use server-side scoring and judging.
- Never expose hidden tests, correct MCQ answers, or private answer data.
- Reject duplicate answers and duplicate state transitions.
- Use atomic database operations or transactions where necessary to prevent conflicting assignments.
- Validate deadlines on the backend.
- Rate-limit authentication, submission, and administrative endpoints.
- Validate programming languages, source-code sizes, and submission payloads.
- Keep credentials in Vercel environment variables.
- Verify signatures or authenticate incoming judging-service callbacks.
- Ensure realtime channel authorization is enforced by the backend.
- Record administrative actions and important tournament state changes.

---

## 18. Error Handling and Recovery

The application must gracefully handle:

- A player disconnecting during a question.
- A browser refresh or temporary network failure.
- A judging service timeout.
- A duplicate answer submission.
- Invalid or expired authentication.
- An invalid question configuration.
- A missing or unpublished question.
- Two simultaneous admin assignment requests.
- An attempt to modify a started match.
- A timer expiring during submission.
- A database or realtime provider outage.
- Odd number of participants when attempting to auto-pair.
- Fewer qualified finalists than required for the final round.

A reconnecting client should receive the authoritative match state and deadline. A failed realtime event must not permanently lose the underlying database update.

The admin must be able to identify failed or incomplete matches and resolve them using controlled recovery actions.

---

## 19. Testing Requirements

### Functional Tests

- Dynamic number of participants can join a tournament (4, 6, 8, 10, 12, etc.).
- The admin can create dynamic groups and assign exactly two players to each group.
- The admin receives a warning for odd participant counts.
- All groups can run concurrently.
- Round 1 displays 15 questions with 45-second deadlines.
- Round 2 displays five debugging questions with 150-second deadlines.
- Timed-out questions automatically advance.
- Code drafts persist independently for each question and language.
- Round 3 starts for the qualified finalists and lasts 30 minutes.
- Leaderboards correctly reflect official scores for any number of groups.
- All group winners appear on the qualification leaderboard.
- The correct number of finalists advance to the DSA final.
- Final results persist after page refreshes.

### Concurrency and Security Tests

- A player cannot be assigned to multiple active matches.
- Duplicate submissions do not award duplicate points.
- Late submissions are rejected.
- Unauthorized users cannot access admin endpoints.
- Players cannot retrieve hidden tests.
- A client cannot manipulate the official timer or score.
- Reconnecting clients receive the current authoritative state.
- Simultaneous assignment requests do not create conflicting matches.
- Tournament configuration cannot be changed after rounds begin.

### Edge Case Tests

- Tournament with 4 participants (2 groups).
- Tournament with 7 participants (3 groups + 1 waiting).
- Tournament with 10 participants (5 groups).
- Tournament with only 1 qualified finalist when 2 are required.
- Player disconnects and reconnects mid-round.
- Admin cancels a match before completion.
- Late arrival after matchmaking has started.

### Deployment Tests

- The project builds and deploys through a single Vercel project.
- API routes work in the deployed environment.
- Environment variables are configured correctly.
- MongoDB connections remain within configured resource limits.
- Realtime events work across different browser sessions.
- The judging service is reachable and returns valid results.
- The complete tournament works without running a separate, self-hosted Express server.

---

## 20. Definition of Done

Code Wars is ready for the college competition when:

1. Dynamic number of participants can join the lobby and be assigned to appropriate groups.
2. The admin can create, rename, modify, and start matches.
3. The admin receives clear warnings for odd participant counts and insufficient finalists.
4. Both players see the correct language-specific questions.
5. All countdowns and deadlines are enforced server-side.
6. Round 1 and Round 2 automatically advance after each deadline.
7. The platform records MCQ answers and genuine code-judging results.
8. All group winners are calculated correctly.
9. The correct number of qualifying group winners enter the DSA final.
10. All finalists can solve two problems within the 30-minute limit.
11. The final leaderboard and tournament results persist.
12. The application is deployed from one repository through Vercel.
13. End-to-end tests pass with variable participant counts (4, 6, 8, 10, etc.) and an admin session.
14. The system gracefully handles edge cases (odd numbers, disconnections, late arrivals).
15. No participant receives automatic wins or free points.

---

## 21. Dynamic Participant Rules Summary

### Critical Requirements

1. **Never hardcode eight players or four groups.**
2. **Dynamic groups:** The admin can create, rename, and assign groups according to the registered participants.
3. **Odd numbers:** One player may remain in the waiting pool. Never award an automatic win or free points.
4. **Late arrivals:** The admin can allow them into the current lobby or reserve them for the next stage.
5. **Variable qualification:** Rank eligible group winners using the configured scoring rules. If fewer than the required number of eligible finalists remain, require an admin decision rather than inventing a finalist.
6. **Configurable tournament size:** Support minimum and maximum participant limits through tournament settings.
7. **Fair scoring:** Every participant in the same stage follows the same timer, scoring, and judging rules.

### Admin Decision Points

The admin must make explicit decisions in these scenarios:

- **Odd participant count:** What to do with the unmatched player.
- **Late arrivals:** Include in current tournament or defer to next.
- **Insufficient finalists:** How to handle when fewer than required finalists qualify.
- **Tournament size:** Whether to wait for more participants or start with current count.

### System Behaviors

- **Display warnings:** Clear UI feedback when configuration issues exist.
- **Prevent invalid states:** Don't allow tournament start with incomplete or invalid matchups.
- **Fair treatment:** All participants in the same stage use identical rules.
- **No automatic wins:** The system never invents results or awards free advancement.

---

## Appendix: Migration from Fixed to Dynamic Structure

If implementing this system on an existing codebase that assumed 8 players:

### Code Patterns to Remove

❌ `const NUM_PLAYERS = 8`  
❌ `const NUM_GROUPS = 4`  
❌ `if (participants.length === 8)`  
❌ `for (let i = 0; i < 4; i++)`  
❌ Hard-coded group labels ['A', 'B', 'C', 'D']

### Code Patterns to Implement

✅ `tournament.minParticipants` and `tournament.maxParticipants`  
✅ `Math.floor(participants.length / 2)` for group calculation  
✅ `participants.length % 2 !== 0` for odd-number detection  
✅ Dynamic group label generation: `['A', 'B', 'C', ...]`  
✅ Configurable `tournament.numFinalists`  
✅ Validation: `qualifiedWinners.length >= tournament.numFinalists`

### Database Schema Updates

Add to Tournament model:
- `minParticipants: Number`
- `maxParticipants: Number`
- `numFinalists: Number`
- `allowPartialStart: Boolean`

Update Match model:
- `groupLabel: String` (not enum, to support any label)

### UI Components to Update

- **Lobby view:** Show dynamic participant count vs. configured limits
- **Matchmaking panel:** Generate group slots dynamically
- **Leaderboard:** Support variable number of groups
- **Qualification view:** Show all group winners, not just 4
- **Final assignment:** Handle variable finalist count

---

## Document Version

**Version:** 1.0  
**Date:** 2026-10-22  
**Status:** Draft — Ready for Implementation

