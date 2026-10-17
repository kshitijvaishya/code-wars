# User Flows — Code Wars

_Based on directly observed HackerRank behavior and logical inference for unobservable transitions._

---

## Flow 1: Participant Registers and Solves a Practice Problem

```
[Landing Page]
    └─► Click "Register"
          └─► Fill: username, email, password
                └─► Email verification (optional v1)
                      └─► [Dashboard]
                            └─► Click "Practice"
                                  └─► [Problem List]
                                        └─► Filter by difficulty / tag
                                              └─► Click problem title
                                                    └─► [Problem Page]
                                                          ├─► Read problem statement (left panel)
                                                          ├─► Select language from dropdown
                                                          ├─► Write code in Monaco editor (right panel)
                                                          ├─► Click "Run Code"
                                                          │     └─► Sample test cases execute
                                                          │           └─► View STDOUT / Expected Output
                                                          │                 └─► Fix bugs, repeat
                                                          └─► Click "Submit"
                                                                └─► All test cases run (hidden + sample)
                                                                      └─► View verdict + score
                                                                            └─► Mark as solved if score > 0
```

---

## Flow 2: Problem Setter Creates a Challenge

```
[Admin / Problem Setter Dashboard]
    └─► Click "New Challenge"
          └─► Step 1: Problem Details
          │     ├─► Enter name, description (Markdown editor)
          │     ├─► Set recommended time
          │     ├─► Add tags (difficulty, topic)
          │     └─► Click "Next"
          ├─► Step 2: Languages
          │     ├─► Select "Popular Languages" (auto-generates stubs)
          │     ├─► Or select specific languages
          │     └─► Click "Next"
          ├─► Step 3: Code Stubs
          │     ├─► Enter function name + return type + parameters
          │     ├─► Click "Generate Code" → stubs created for all selected languages
          │     ├─► (Optional) Review in IDE view
          │     └─► Click "Next"
          └─► Step 4: Test Cases
                ├─► Upload solution file (auto-judged) OR
                ├─► Add test cases manually:
                │     ├─► Name, Difficulty, Score, Input, Expected Output
                │     └─► Mark 2-3 as "Sample" (0 score)
                ├─► (Optional) Bulk upload ZIP
                └─► Click "Save Question"
```

---

## Flow 3: Admin Creates a Contest

```
[Admin Dashboard]
    └─► Click "New Contest"
          └─► Fill: name, tagline, description, start datetime, end datetime
                └─► Click "Save Contest"
                      └─► [Contest Config Page]
                            ├─► Add Challenges tab:
                            │     ├─► Search challenges by name/tag
                            │     ├─► Add to contest
                            │     ├─► Drag-and-drop to reorder
                            │     ├─► Set per-challenge weight
                            │     └─► Toggle Binary / Dynamic scoring
                            ├─► Settings tab:
                            │     ├─► Public / Private / Invite-only
                            │     ├─► Enable/disable flags
                            │     └─► Save
                            └─► Publish Contest
```

---

## Flow 4: Participant Joins and Competes in a Contest

```
[Contest List Page]
    └─► Find upcoming / active contest
          └─► Click "Register" or "Join"
                └─► (If private: enter invite code)
                      └─► [Contest Dashboard]
                            ├─► Contest timer (countdown to start or to end)
                            ├─► Problem list with scores
                            │     └─► Click a problem
                            │           └─► [Problem Solving Page] (same as Flow 1)
                            │                 └─► Submit → score recorded on leaderboard
                            └─► Leaderboard tab
                                  └─► View live rankings
                                        └─► [Rank | Username | Score | Per-problem | Time]
```

---

## Flow 5: Submission Processing (Backend Flow)

```
[User clicks Submit]
    └─► Frontend sends: source_code, language_id, problem_id, contest_id (optional)
          └─► Backend:
                ├─► Create Submission record (status: "queued")
                ├─► For each test case:
                │     ├─► POST to code execution engine (Judge0 API or internal)
                │     │     Body: { source_code, language_id, stdin, expected_output, time_limit, memory_limit }
                │     ├─► Poll / wait for result (status 1→2→3+)
                │     └─► Record test case result (verdict, time, memory, stdout)
                ├─► Aggregate: total score = Σ(score_i × passed_i)
                ├─► Update Submission record (status: "done", score, verdict)
                ├─► Update user's best score for this problem
                ├─► If contest submission:
                │     └─► Recalculate contest leaderboard entry for user
                └─► Push result to frontend via WebSocket
                      └─► Frontend updates verdict panel and leaderboard
```

---

## Flow 6: Leaderboard State Update

```
[Every accepted/scored submission in a contest]
    └─► Backend recalculates user's total contest score:
          total_score = Σ max_score_per_problem
    └─► Recalculates penalty time:
          penalty_time = submission_time of last score-improving submission (from contest start)
    └─► Updates leaderboard entry
    └─► Broadcasts leaderboard diff via WebSocket
          └─► All connected participants receive updated standings
```

---

## Flow 7: Post-Contest

```
[Contest end time reached]
    └─► Contest state transitions: Active → Ended
          ├─► Leaderboard frozen
          ├─► Editorial unlocked (if provided)
          ├─► Public test cases revealed (if flag set)
          ├─► Public solutions revealed (if flag set)
          └─► Participants can still view their submissions
```

---

## Flow 8: Run Code (Detailed)

```
[User clicks "Run Code"]
    └─► Frontend sends: source_code, language_id, custom_input (optional), problem_id
          └─► Backend:
                ├─► If custom_input provided: run against custom input only
                ├─► Else: run against all sample test cases
                ├─► POST to execution engine per test case
                └─► Return results:
                      ├─► Test case 1: STDOUT, Expected (if sample), Debug Output, Time, Memory
                      ├─► Test case 2: …
                      └─► Custom: STDOUT only (no expected)
          └─► Frontend renders output panel
```

---

## Flow 9: Version History

```
[User clicks "Version History"]
    └─► Fetch saved drafts for current problem (auto-save triggered every ~30s)
          └─► Show diff view: current code vs. selected saved version
                └─► Click "Revert" → replace editor content with saved version
```

---

## State Machine: Contest

```
[Created] ──► [Published / Upcoming] ──► [Active] ──► [Ended]
                                              │
                                        (submissions accepted)
```

## State Machine: Submission

```
[Created] ──► [Queued] ──► [Processing] ──► [Done]
                                                └─► verdict: Accepted | Wrong Answer | TLE | MLE | RE | CE | IE
```
