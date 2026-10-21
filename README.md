# ⚔️ Code Wars — Serverless Tournament Platform

A real-time competitive coding tournament platform built with React, Vercel Functions, MongoDB Atlas, and Piston API. Supports dynamic participant counts with admin-controlled matchmaking for college coding competitions.

---

## 🎯 Architecture

**Serverless Deployment:**
- ✅ Vercel Functions (no Express server)
- ✅ MongoDB Atlas (cached connections)
- ✅ Ably or Pusher (replaces Socket.IO)
- ✅ Piston API (code execution)
- ✅ Single repository deployment

**Key Features:**
- Dynamic participant counts (4, 6, 8, 10+)
- Admin-controlled matchmaking with drag-and-drop
- Three competitive rounds (MCQ, Debug, DSA)
- Server-authoritative timers
- Real-time leaderboards
- Automatic question progression

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Vercel account
- Ably account (for realtime) or Pusher
- Piston API access (public or self-hosted)

### 1. Environment Setup

Create `.env.local` for development:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codewars

# JWT Authentication
JWT_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Ably Realtime (get from ably.com)
ABLY_API_KEY=your-ably-api-key

# Piston Code Execution
PISTON_BASE_URL=https://emkc.org/api/v2/piston
PISTON_API_KEY=

# Application
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**For Production:** Set all variables in Vercel Dashboard → Project Settings → Environment Variables

### 2. Install Dependencies

```bash
npm install
cd client && npm install
```

### 3. Run Development with Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Run locally (emulates Vercel Functions)
vercel dev
```

This starts:
- Frontend: http://localhost:3000
- API Functions: http://localhost:3000/api/*

**Or run client separately:**
```bash
# Terminal 1 - API
vercel dev

# Terminal 2 - Client
cd client && npm run dev
```

### 4. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy (preview)
vercel

# Deploy to production
vercel --prod
```

After deployment:
1. Set environment variables in Vercel Dashboard
2. Connect MongoDB Atlas
3. Configure Ably credentials
4. Optionally configure custom domain

---

## Architecture

### Serverless Structure

```
code-wars/
├── api/                    # Vercel Functions (Serverless)
│   ├── auth/              # Authentication endpoints
│   ├── tournaments/       # Tournament management
│   ├── matches/           # Match operations
│   ├── submissions/       # Code submission & judging
│   └── health.ts          # Health check
├── lib/                    # Shared backend logic
│   ├── db/
│   │   ├── connection.ts  # Cached MongoDB connection
│   │   └── models/        # Mongoose models
│   ├── auth/              # JWT & middleware
│   ├── judging/           # Piston integration
│   ├── tournament/        # Timer & matchmaking logic
│   └── utils/             # Errors, logging, validation
├── client/                 # React frontend
└── vercel.json            # Vercel configuration
```

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
