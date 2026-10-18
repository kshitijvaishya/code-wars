# ⚔️ Code Wars — 1v1 Coding Battle Platform

A production-oriented real-time 1v1 coding battle platform built with React, Node.js, MongoDB, Socket.IO, and Piston API.

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional, for full stack)
- Piston API access (public or self-hosted)

### 1. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — 64+ character random string
- `JWT_REFRESH_SECRET` — Another 64+ character random string
- `PISTON_BASE_URL` — Piston API URL (defaults to https://emkc.org/api/v2/piston)
- `PISTON_API_KEY` — Optional: API key if your Piston deployment requires authentication

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Install Dependencies

```bash
npm install         # root (installs workspaces)
cd server && npm install --legacy-peer-deps
cd ../client && npm install --legacy-peer-deps
```

### 3. Seed Database

```bash
cd server
npm run seed
```
This creates the admin user (from `.env` `ADMIN_*` vars) and sample problems.

### 4. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

App: http://localhost:5173
API: http://localhost:5000

---

## Docker Compose (Full Stack)

```bash
docker-compose up -d
```

This starts:
- MongoDB (port 27017)
- API server (port 5000)
- Nginx frontend (port 80)

The server uses the public Piston API by default. For production, consider:
- Using a self-hosted Piston instance for better reliability and control
- Setting up rate limiting and monitoring
- Configuring appropriate resource limits

Access at: http://localhost

---

## Architecture

```
client/          React + Vite + TypeScript + Tailwind + Monaco Editor
server/          Node.js + Express + TypeScript + Mongoose
shared/          Shared TypeScript types
docker-compose   MongoDB + server + client
```

### Battle State Machine
```
WAITING → READY_CHECK → COUNTDOWN → ACTIVE → FINALIZING → COMPLETED
                    ↘                      ↘
                 CANCELLED              FAILED
```

### Scoring Modes
| Mode | Description |
|------|-------------|
| `first_accepted` | First full solution wins (server timestamp) |
| `score_based` | Most test cases passed wins |
| `time_based` | Score first, then fastest accepted submission |
| `best_of_three` | Three rounds, overall winner |

### Rating System
Elo-based with K-factor:
- Rating < 1400: K = 32
- Rating 1400–1999: K = 24  
- Rating ≥ 2000: K = 16
- Minimum rating: 100

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Battles
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/battles` | Create private battle |
| GET | `/api/battles/:id` | Get battle details |
| GET | `/api/battles/join/:code` | Get battle by invite code |
| GET | `/api/battles/:id/result` | Get completed battle result |
| GET | `/api/battles/history` | Get user's battle history |

### Problems
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/problems` | List published problems |
| GET | `/api/problems/:id` | Get problem (no hidden tests) |
| POST | `/api/problems` | Create problem (admin) |
| PUT | `/api/problems/:id` | Update problem (admin) |
| DELETE | `/api/problems/:id` | Delete an unreferenced problem (super admin) |

### Submissions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/submissions/run` | Run against sample tests |
| POST | `/api/submissions` | Submit for judging |
| GET | `/api/submissions/:id` | Get submission result |
| GET | `/api/submissions/languages` | Supported languages |

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `battle:join` | `{ battleId?, inviteCode? }` | Join a battle room |
| `battle:ready` | `{ battleId }` | Mark as ready |
| `battle:unready` | `{ battleId }` | Unmark ready |
| `battle:status_update` | `{ battleId, status }` | Update coding status |
| `matchmaking:join` | `{ difficulty, scoringMode }` | Enter matchmaking queue |
| `matchmaking:cancel` | — | Leave matchmaking queue |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `battle:state_changed` | `{ battleId, state, startTime?, endTime? }` | State transition |
| `battle:participant_updated` | `{ battleId, participant }` | Player status update |
| `battle:countdown` | `{ battleId, secondsRemaining }` | Countdown tick |
| `battle:timer_sync` | `{ battleId, secondsRemaining, serverTime }` | Timer sync |
| `battle:completed` | `{ battleId, winnerId, isDraw }` | Battle finished |
| `submission:queued` | `{ submissionId, battleId }` | Submission accepted |
| `submission:verdict` | `{ submissionId, userId, verdict, score }` | Judge result |
| `matchmaking:found` | `{ battleId, inviteCode }` | Match found |
| `opponent:disconnected` | `{ battleId, userId, gracePeriodSeconds }` | Opponent left |

---

## Testing

```bash
# Server tests
cd server && npm test

# Client tests  
cd client && npm test
```

---

## Security Notes

- User code **never** executes in the Node.js process. All execution goes through Piston's API, which provides sandboxed code execution.
- **Important**: The public Piston API (emkc.org) is a free community service. For production use, consider:
  - Self-hosting Piston for better control and reliability
  - Implementing additional rate limiting
  - Monitoring execution patterns
  - Understanding that public instance availability and limits may vary
- Hidden test cases are stored with MongoDB `select: false` and stripped from all public API responses.
- JWT access tokens expire in 15 minutes; refresh tokens rotate on use.
- Rate limiting on auth (10 req/15min) and submissions (10 req/min).
- All Socket.IO events validate the authenticated user's identity server-side. Client-supplied scores, verdicts, and timestamps are never trusted.
- Battle finalization is atomic (MongoDB `findOneAndUpdate` with state guard) — prevents double finalization.

## Code Execution Engine

This platform uses **Piston** for code compilation and execution:

- **Public Instance**: https://emkc.org/api/v2/piston (free, community-hosted)
- **Self-Hosted**: Follow the [Piston installation guide](https://github.com/engineer-man/piston) for production deployments

### Supported Languages

The platform supports multiple languages through Piston's runtime system. Use the `/api/submissions/languages` endpoint to get the current list of available languages and versions.

Common supported languages include:
- C, C++, C#
- Java, JavaScript, TypeScript
- Python, Ruby, Go
- Rust, Kotlin, Swift
- PHP, SQL

### Self-Hosting Piston

For production use, self-hosting is recommended:

```bash
git clone https://github.com/engineer-man/piston
cd piston
docker-compose up -d
```

Then update your `.env`:
```
PISTON_BASE_URL=http://your-piston-host:2000/api/v2/piston
```
