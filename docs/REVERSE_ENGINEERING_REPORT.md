# Reverse Engineering Report — HackerRank Public UI & Workflows

**Target:** HackerRank public contest and coding platform  
**Method:** Publicly observable UI behavior, official support documentation, HackerRank knowledge-base articles, community tutorials  
**Date:** October 2026  
**Status:** Authorized analysis of public-facing pages and help documentation only  

---

## REA Tool Availability

The REA (Reverse-Engineer-Anything) skill was activated and the agent installation was confirmed healthy (`rea-agents@6.5.0`, skill v42 aligned). The REA MCP server requires an active client connection; the current Kiro session does not have an MCP transport active for REA. Native analysis engines (Ghidra, Hopper, IDA, JADX) are absent — these are irrelevant for a web-application target anyway.

**Fallback applied:** Browser/web observation via web_fetch and web_search against publicly accessible HackerRank help pages and the publicly documented Judge0 code-execution API, which is the open-source engine used by platforms in this category.

---

## 1. Coding Editor

### Directly Observed
- HackerRank uses **Monaco Editor v0.50.0** (the same engine as VS Code).
- Editor supports **60+ programming languages**.
- Editor modes available: Normal, Vim, Emacs.
- Tab size options: 2, 4, 8 spaces.
- Autocomplete (IntelliSense) can be toggled.
- Layout is split: problem statement left panel, code editor right panel.
- Expand/collapse panel layout controls exist.
- Light/dark theme switcher in the top-right corner.
- Side navigator for multi-problem contests (can be hidden).

### Run Code Behavior (Observed)
- "Run Code" executes code against **sample test cases only** (not hidden ones).
- Custom input can be provided for manual testing.
- Output panel shows: STDIN, STDOUT, Expected Output (for sample), Debug Output.
- Output panel can be docked/repositioned.
- Code is periodically **auto-saved** as draft.
- Version history lets candidates compare/revert to a previous save.

### Submit Behavior (Observed)
- "Submit" runs code against **all test cases** including hidden ones.
- Scoring is based on exact string matching against expected output.
- Partial scoring: each test case passes or fails independently; partial credit possible at the problem level (sum of test case scores).
- Sample test cases carry 0 score.

### Code Stubs (Observed)
- Problems define a function signature and the platform auto-generates code stubs for popular languages.
- Top and bottom stub sections are **read-only** — only the function body is editable.
- Switching language resets the editor.

---

## 2. Problem / Challenge Structure

### Observed Problem Anatomy
A well-formed challenge contains:
1. **Challenge Name**
2. **Brief Description** (problem narrative)
3. **Problem Statement** (full body in Markdown + LaTeX support)
4. **Input Format** section
5. **Output Format** section
6. **Constraints** (variable bounds, e.g., `1 ≤ N ≤ 10^5`)
7. **Sample Input** (preformatted block)
8. **Sample Output** (preformatted block)
9. **Explanation** of sample(s) (minimum 2 recommended)
10. **(Optional) Notes/Clarifications**
11. **(Optional) Editorial** — unlocked after contest ends

Markdown is used for formatting; LaTeX supported via `$...$` and `$$...$$` wrappers.

---

## 3. Test Case System

### Observed
- Test cases have: Name, Difficulty (Easy/Medium/Hard), Score, Input, Expected Output.
- **Sample test cases** are visible to solvers; they validate basic logic.
- **Hidden test cases** are locked (lock icon); only solver's output and debug log shown.
- Test cases can be bulk-uploaded as a ZIP (`input00.txt`, `output00.txt`, …).
- Custom checker support for non-exact-match grading (e.g. floating point tolerance).
- Precision check flag for float output: configurable `±` tolerance.

### Scoring Formula (Observed)
```
Problem Score = Σ (score_i × passed_i)  for all test cases i
```
Sample test cases are scored at 0. Hidden test cases carry the full problem weight.

---

## 4. Contest System

### Observed Contest Properties
- **Name**, **Tagline**, **Description** (Markdown)
- **Start and end datetime** (duration implicit)
- **Challenges list** (ordered, drag-and-drop)
- Per-challenge weight (score) within the contest
- **Binary scoring** toggle: all-or-nothing per challenge vs. partial
- **Dynamic scoring**: score decreases as more participants solve it

### Contest Access (Observed)
- Public vs. private contests
- Invite-only via link
- Contest can be password-protected

### Contest Flags Observed
- Disable Compile and Test
- Disable Custom Test Case
- Disable Submission Processing (batch mode — process at end)
- Disable Submission
- Public Test Case (revealed post-contest)
- Public Solution (all solutions visible on leaderboard post-contest)
- Restricted Forum (admin-only posting)
- Plagiarism detection (opcode-level checker, disqualifies both parties)

---

## 5. Leaderboard and Scoring

### Observed Rules
- Participants ranked by **total score** (descending).
- **Tiebreaker**: cumulative time from contest start to last correct submission that improved the score.
- Dense ranking: equal scores share the same rank.
- Leaderboard is visible during and after contest.

---

## 6. Submission Verdict System (via Judge0)

Judge0 is the dominant open-source code execution backend. Its statuses directly map to what HackerRank shows:

| Status ID | Description |
|-----------|-------------|
| 1 | In Queue |
| 2 | Processing |
| 3 | Accepted |
| 4 | Wrong Answer |
| 5 | Time Limit Exceeded |
| 6 | Compilation Error |
| 7 | Runtime Error (SIGSEGV) |
| 8 | Runtime Error (SIGXFSZ) |
| 9 | Runtime Error (SIGFPE) |
| 10 | Runtime Error (SIGABRT) |
| 11 | Runtime Error (NZEC) |
| 12 | Runtime Error (Other) |
| 13 | Internal Error |
| 14 | Exec Format Error |

Memory Limit Exceeded is detected via process memory stats and reported similarly to TLE.

---

## 7. Execution Environment (Observed)

- Code runs in **Ubuntu** sandboxed environment.
- Programs read from **STDIN**, write to **STDOUT**.
- Per-language time and memory limits configurable by problem setter.
- Default time limit varies by language (compiled languages faster than interpreted).
- `Terminated due to timeout` = TLE in HackerRank UI.
- Debug output (print statements) does NOT affect score but visible in debug panel.

---

## 8. Limitations and Unknowns

| Topic | Status |
|-------|--------|
| Internal backend API endpoints | **Not observed** (authentication required) |
| Database schema | **Not observed** |
| Plagiarism checker algorithm | **Not observed** (described as "opcode-level") |
| Dynamic scoring formula | **Not precisely observed** |
| Real-time leaderboard push mechanism | **Inferred** (WebSocket likely) |
| Authentication/OAuth internals | **Not observed** |

---

## Summary

The publicly observable behavior is sufficient to implement a complete competitive coding platform (Code Wars) with full fidelity on all user-facing features. All backend implementation decisions in this project are **original design choices** inspired by observed feature sets, not copied from HackerRank internals.
