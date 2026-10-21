# Code Wars — Serverless Tournament Platform PRD

**Version:** 2.0 (Serverless Edition)  
**Target:** Vercel Serverless Deployment  
**Architecture:** Single repository, serverless functions, managed services  
**Last Updated:** October 22, 2026

---

## Executive Summary

This PRD defines a real-time competitive coding tournament platform deployed entirely on serverless infrastructure. The platform eliminates the need for self-hosted Express servers and Socket.IO while maintaining all competitive tournament features through Vercel Functions and managed services.

**Key Architectural Decisions:**
- ✅ Vercel Functions (no Express server)
- ✅ Ably or Pusher (no Socket.IO)
- ✅ MongoDB Atlas (persistent state)
- ✅ Deadline-based timers (no background processes)
- ✅ Piston API (existing code execution)
- ✅ Single repository deployment

---

## 1. Serverless Architecture Overview

### 1.1 Why Serverless?

**Benefits:**
- No server maintenance
- Automatic scaling
- Pay-per-use pricing
- Global edge distribution
- Built-in HTTPS and domains
- Integrated monitoring

**Constraints:**
- Stateless function execution
- No persistent processes
- Limited execution time (10-300s)
- Cold start latency
- No Socket.IO server hosting

### 1.2 Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel Platform                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐        ┌──────────────────────────┐  │
│  │   Frontend   │        │   Serverless Functions   │  │
│  │  (React +    │◄──────►│   (TypeScript API)       │  │
│  │   Vite)      │   API  │   /api/**/*.ts           │  │
│  └──────────────┘        └──────────────────────────┘  │
│         │                          │                    │
│         │ Ably SDK                 │ Ably REST API      │
│         ▼                          ▼                    │
└─────────────────────────────────────────────────────────┘
         │                           │
         │                           │
   ┌─────▼────────┐         ┌────────▼─────────┐
   │    Ably      │         │  MongoDB Atlas   │
   │  (Realtime)  │         │   (Database)     │
   └──────────────┘         └──────────────────┘
                                     │
                            ┌────────▼─────────┐
                            │   Piston API     │
                            │ (Code Execution) │
                            └──────────────────┘
```

---

## 2. Dynamic Tournament Rules (CRITICAL)

### 2.1 Never Hardcode Participant Counts

**❌ FORBIDDEN:**
```typescript
const NUM_PLAYERS = 8;
const NUM_GROUPS = 4;
const FINALISTS = 2;
```

**✅ REQUIRED:**
```typescript
const numGroups = Math.floor(tournament.participants.length / 2);
const finalists = tournament.config.numFinalists; // from DB
```

### 2.2 Participant Count Flexibility

| Participants | Groups | Unmatched | Finalists |
|-------------:|-------:|----------:|----------:|
| 4 | 2 | 0 | 2 |
| 6 | 3 | 0 | 2 |
| 7 | 3 | 1 | 2 |
| 8 | 4 | 0 | 2 |
| 10 | 5 | 0 | 2 |
| 11 | 5 | 1 | 2 |

**Rules:**
1. Admin creates groups dynamically
2. Odd participants remain unmatched (no free wins)
3. Admin decides what to do with unmatched players
4. All groups use identical rules and scoring
5. Variable number of finalists based on config

---

## 3. Serverless API Structure

### 3.1 Directory Layout

```
code-wars/
├── api/                              # Vercel Functions
│   ├── auth/
│   │   ├── register.ts              # POST /api/auth/register
│   │   ├── login.ts                 # POST /api/auth/login
│   │   ├── refresh.ts               # POST /api/auth/refresh
│   │   └── me.ts                    # GET /api/auth/me
│   ├── tournaments/
│   │   ├── index.ts                 # GET/POST /api/tournaments
│   │   └── [id]/
│   │       ├── index.ts             # GET/PATCH /api/tournaments/[id]
│   │       ├── join.ts              # POST /api/tournaments/[id]/join
│   │       ├── leave.ts             # POST /api/tournaments/[id]/leave
│   │       ├── participants.ts      # GET /api/tournaments/[id]/participants
│   │       ├── start.ts             # POST /api/tournaments/[id]/start
│   │       └── leaderboard.ts       # GET /api/tournaments/[id]/leaderboard
│   ├── matches/
│   │   ├── index.ts                 # POST /api/matches
│   │   ├── auto-pair.ts             # POST /api/matches/auto-pair
│   │   └── [id]/
│   │       ├── index.ts             # GET /api/matches/[id]
│   │       ├── assign.ts            # POST /api/matches/[id]/assign
│   │       ├── start.ts             # POST /api/matches/[id]/start
│   │       ├── state.ts             # GET /api/matches/[id]/state
│   │       └── questions/
│   │           └── current.ts       # GET /api/matches/[id]/questions/current
│   ├── questions/
│   │   ├── index.ts                 # GET/POST /api/questions
│   │   └── [id].ts                  # GET/PUT/DELETE /api/questions/[id]
│   ├── answers/
│   │   └── index.ts                 # POST /api/answers
│   ├── submissions/
│   │   ├── index.ts                 # POST /api/submissions
│   │   ├── [id].ts                  # GET /api/submissions/[id]
│   │   ├── run.ts                   # POST /api/submissions/run
│   │   └── languages.ts             # GET /api/submissions/languages
│   ├── admin/
│   │   ├── qualify.ts               # POST /api/admin/qualify
│   │   └── finalize.ts              # POST /api/admin/finalize
│   ├── realtime/
│   │   └── auth.ts                  # POST /api/realtime/auth
│   └── health.ts                    # GET /api/health
├── lib/                              # Shared backend logic
│   ├── db/
│   │   ├── connection.ts            # Cached MongoDB connection
│   │   └── models/
│   │       ├── User.ts
│   │       ├── Tournament.ts
│   │       ├── Match.ts
│   │       ├── Question.ts
│   │       ├── Submission.ts
│   │       └── Leaderboard.ts
│   ├── auth/
│   │   ├── jwt.ts
│   │   ├── middleware.ts
│   │   └── validate.ts
│   ├── realtime/
│   │   ├── ably.ts
│   │   └── events.ts
│   ├── tournament/
│   │   ├── matchmaking.ts
│   │   ├── scoring.ts
│   │   ├── qualification.ts
│   │   └── timer.ts
│   ├── judging/
│   │   ├── piston.ts
│   │   └── evaluate.ts
│   └── utils/
│       ├── validation.ts
│       ├── errors.ts
│       └── response.ts
├── src/                              # Frontend React app
│   ├── components/
│   ├── pages/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   │   ├── api.ts
│   │   └── realtime.ts
│   ├── stores/
│   └── types/
├── vercel.json
├── package.json
└── tsconfig.json
```

### 3.2 Function Handler Template

```typescript
// api/matches/[id]/start.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/db/connection';
import { authenticate } from '../../../lib/auth/middleware';
import { Match } from '../../../lib/db/models/Match';
import { publishEvent } from '../../../lib/realtime/ably';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database (cached)
    await connectDB();

    // Authenticate
    const user = await authenticate(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get match ID
    const { id: matchId } = req.query;

    // Business logic
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'READY') {
      return res.status(400).json({ error: 'Match not ready' });
    }

    // Update state
    match.status = 'COUNTDOWN';
    match.startedAt = new Date();
    match.countdownEndsAt = new Date(Date.now() + 10000);
    await match.save();

    // Publish realtime event
    await publishEvent(`match:${matchId}`, 'countdown_started', {
      countdown: 10,
      startsAt: match.countdownEndsAt
    });

    return res.status(200).json({
      success: true,
      match: {
        id: match._id,
        status: match.status,
        countdown: 10
      }
    });

  } catch (error) {
    console.error('Start match error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 4. Real-Time Communication (Ably)

### 4.1 Why Not Socket.IO?

**Problem:** Vercel Functions are stateless request-response handlers. They cannot:
- Maintain persistent WebSocket connections
- Run continuously as a Socket.IO server
- Store connection state in memory

**Solution:** Use managed real-time service (Ably or Pusher)

### 4.2 Ably Architecture

```
Backend Flow:
1. API function updates database
2. API function publishes event via Ably REST API
3. Ably broadcasts to subscribed clients

Frontend Flow:
1. Client connects to Ably with auth token
2. Client subscribes to relevant channels
3. Client receives real-time updates
4. Client updates UI reactively
```

### 4.3 Channel Design

| Channel Pattern | Purpose | Access |
|-----------------|---------|--------|
| `tournament:{id}:lobby` | Lobby updates | All participants |
| `tournament:{id}:leaderboard` | Score updates | All participants |
| `match:{id}` | Match state | Match participants only |
| `match:{id}:timer` | Timer events | Match participants |
| `match:{id}:question` | Question changes | Match participants |
| `user:{id}:notifications` | Personal notifications | User only |

### 4.4 Backend Implementation

```typescript
// lib/realtime/ably.ts
import Ably from 'ably/promises';

let ablyClient: Ably.Rest | null = null;

export function getAblyClient(): Ably.Rest {
  if (!ablyClient) {
    ablyClient = new Ably.Rest({
      key: process.env.ABLY_API_KEY!
    });
  }
  return ablyClient;
}

export async function publishEvent(
  channel: string,
  eventName: string,
  data: any
) {
  try {
    const client = getAblyClient();
    await client.channels.get(channel).publish(eventName, data);
  } catch (error) {
    console.error('Failed to publish event:', error);
    // Don't throw - realtime is best-effort
  }
}

// Generate client token with appropriate permissions
export async function generateAblyToken(
  userId: string,
  matchIds: string[]
) {
  const client = getAblyClient();
  
  const capability: Record<string, string[]> = {
    [`user:${userId}:*`]: ['subscribe'],
    [`tournament:*:lobby`]: ['subscribe'],
    [`tournament:*:leaderboard`]: ['subscribe']
  };

  // Add match-specific permissions
  for (const matchId of matchIds) {
    capability[`match:${matchId}:*`] = ['subscribe'];
  }

  const tokenRequest = await client.auth.createTokenRequest({
    clientId: userId,
    capability
  });

  return tokenRequest;
}
```

```typescript
// api/realtime/auth.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/connection';
import { authenticate } from '../../lib/auth/middleware';
import { generateAblyToken } from '../../lib/realtime/ably';
import { Match } from '../../lib/db/models/Match';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const user = await authenticate(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user's active matches
    const matches = await Match.find({
      playerIds: user._id,
      status: { $in: ['READY', 'COUNTDOWN', 'IN_PROGRESS'] }
    }).select('_id');

    const matchIds = matches.map(m => m._id.toString());

    // Generate token
    const tokenRequest = await generateAblyToken(user._id, matchIds);

    return res.status(200).json(tokenRequest);

  } catch (error) {
    console.error('Ably auth error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
```

### 4.5 Frontend Implementation

```typescript
// src/services/realtime.ts
import Ably from 'ably/promises';
import { apiClient } from './api';

class RealtimeService {
  private client: Ably.Realtime | null = null;
  private subscriptions = new Map<string, Ably.Types.RealtimeChannel>();

  async connect() {
    this.client = new Ably.Realtime({
      authCallback: async (tokenParams, callback) => {
        try {
          const { data } = await apiClient.post('/api/realtime/auth');
          callback(null, data);
        } catch (error) {
          callback(error as Error, null);
        }
      }
    });

    return new Promise<void>((resolve, reject) => {
      this.client!.connection.once('connected', () => resolve());
      this.client!.connection.once('failed', reject);
    });
  }

  subscribeToMatch(
    matchId: string,
    handlers: {
      onStateChange?: (data: any) => void;
      onTimer?: (data: any) => void;
      onQuestion?: (data: any) => void;
      onSubmission?: (data: any) => void;
    }
  ) {
    if (!this.client) throw new Error('Not connected');

    const channel = this.client.channels.get(`match:${matchId}`);
    
    if (handlers.onStateChange) {
      channel.subscribe('state_changed', handlers.onStateChange);
    }
    if (handlers.onTimer) {
      channel.subscribe('timer_update', handlers.onTimer);
    }
    if (handlers.onQuestion) {
      channel.subscribe('question_changed', handlers.onQuestion);
    }
    if (handlers.onSubmission) {
      channel.subscribe('submission_verdict', handlers.onSubmission);
    }

    this.subscriptions.set(matchId, channel);

    return () => {
      channel.unsubscribe();
      this.subscriptions.delete(matchId);
    };
  }

  disconnect() {
    this.client?.close();
    this.client = null;
    this.subscriptions.clear();
  }
}

export const realtimeService = new RealtimeService();
```

---

## 5. Timer System (Deadline-Based)

### 5.1 Problem: No Background Processes

Traditional approach (won't work):
```typescript
// ❌ Cannot do this in serverless
setInterval(() => {
  if (remaining === 0) {
    advanceQuestion();
  }
}, 1000);
```

### 5.2 Solution: Store Deadlines

```typescript
// lib/tournament/timer.ts
export interface Timer {
  startedAt: Date;
  duration: number; // seconds
  deadlineAt: Date;
}

export function createTimer(durationSeconds: number): Timer {
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);
  
  return { startedAt, duration: durationSeconds, deadlineAt };
}

export function getRemainingSeconds(deadlineAt: Date): number {
  const now = Date.now();
  const deadline = new Date(deadlineAt).getTime();
  const remaining = Math.max(0, deadline - now);
  return Math.ceil(remaining / 1000);
}

export function hasExpired(deadlineAt: Date): boolean {
  return getRemainingSeconds(deadlineAt) === 0;
}

export function validateDeadline(deadlineAt: Date): void {
  if (hasExpired(deadlineAt)) {
    throw new Error('Deadline has expired');
  }
}
```

### 5.3 Database Schema

```typescript
// lib/db/models/Match.ts
const MatchSchema = new Schema({
  // ... other fields
  
  currentRound: Number,
  currentQuestionIndex: Number,
  
  // Timer fields
  roundStartedAt: Date,
  questionStartedAt: Date,
  questionDeadlineAt: Date, // Key field
  roundDeadlineAt: Date,    // For DSA round
});
```

### 5.4 Client-Side Timer

```typescript
// src/hooks/useDeadlineTimer.ts
import { useState, useEffect } from 'react';

export function useDeadlineTimer(deadlineAt: string | null) {
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadlineAt) return;

    const deadline = new Date(deadlineAt).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, deadline - now);
      const seconds = Math.ceil(diff / 1000);
      
      setRemaining(seconds);
      
      if (seconds === 0 && !expired) {
        setExpired(true);
      }
    };

    update();
    const interval = setInterval(update, 100); // Update 10x/second for smooth countdown

    return () => clearInterval(interval);
  }, [deadlineAt, expired]);

  return { remaining, expired };
}
```

### 5.5 Auto-Advancement

**Option 1: Client-initiated (Recommended)**
```typescript
// When timer expires, client calls API
const { expired } = useDeadlineTimer(questionDeadlineAt);

useEffect(() => {
  if (expired) {
    api.advanceQuestion(matchId).catch(console.error);
  }
}, [expired]);
```

**Option 2: Server validation**
```typescript
// Every API call checks and advances if needed
async function getCurrentQuestion(matchId: string) {
  const match = await Match.findById(matchId);
  
  // Auto-advance if deadline passed
  if (hasExpired(match.questionDeadlineAt)) {
    await advanceToNextQuestion(match);
  }
  
  return match.currentQuestion;
}
```

**Option 3: Vercel Cron (Fallback)**
```typescript
// api/cron/advance-expired.ts
// Runs every 1 minute to clean up any stuck matches
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const expiredMatches = await Match.find({
    questionDeadlineAt: { $lt: new Date() },
    status: 'IN_PROGRESS'
  });

  for (const match of expiredMatches) {
    await advanceToNextQuestion(match);
  }

  return res.json({ processed: expiredMatches.length });
}
```

---

## 6. Database Connection Management

### 6.1 Connection Caching Pattern

```typescript
// lib/db/connection.ts
import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export async function connectDB() {
  // Reuse existing connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not defined');
  }

  console.log('Creating new MongoDB connection');

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 2,
      
      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Performance
      maxIdleTimeMS: 30000,
      
      // Reliability
      retryWrites: true,
      w: 'majority'
    });

    cachedConnection = connection;
    return connection;

  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Optional: Handle connection events
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  cachedConnection = null;
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
  cachedConnection = null;
});
```

### 6.2 MongoDB Atlas Configuration

**Connection String:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/codewars?retryWrites=true&w=majority
```

**Recommended Settings:**
- Cluster tier: M10+ for production
- Connection pooling: 10-50 per region
- Read preference: primaryPreferred
- Write concern: majority
- Auto-index: Disable in production

### 6.3 Query Optimization

```typescript
// ❌ Bad: Multiple round trips
const tournament = await Tournament.findById(id);
const participants = await User.find({ _id: { $in: tournament.participantIds }});
const matches = await Match.find({ tournamentId: id });

// ✅ Good: Use populate and lean()
const tournament = await Tournament.findById(id)
  .populate('participantIds', 'username email role')
  .lean(); // Return plain objects, not Mongoose documents

const matches = await Match.find({ tournamentId: id })
  .lean()
  .exec();
```

---

## 7. Tournament Data Models

### 7.1 Tournament

```typescript
interface Tournament {
  _id: ObjectId;
  name: string;
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
  
  // Dynamic configuration
  minParticipants: number;
  maxParticipants: number;
  numFinalists: number; // e.g., 2, 4
  
  participantIds: ObjectId[];
  
  roundConfiguration: {
    round1: {
      questionCount: number;
      timePerQuestion: number;
      points: number;
    };
    round2: {
      questionCount: number;
      timePerQuestion: number;
      maxPointsPerQuestion: number;
    };
    round3: {
      problemCount: number;
      totalDuration: number;
      maxPointsPerProblem: number;
    };
  };
  
  scoringRules: {
    tieBreakers: string[]; // ['round2Score', 'round1Score', 'submissionTime']
  };
  
  createdBy: ObjectId;
  registrationOpenedAt?: Date;
  registrationClosedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}
```

### 7.2 Match

```typescript
interface Match {
  _id: ObjectId;
  tournamentId: ObjectId;
  stage: 'preliminary' | 'final';
  groupLabel: string; // Dynamic: 'A', 'B', 'C', etc.
  
  playerIds: [ObjectId, ObjectId]; // Always exactly 2
  
  status: 'waiting' | 'paired' | 'ready' | 'countdown' | 'in_progress' | 'completed';
  
  currentRound: number; // 1, 2, or 3
  currentQuestionIndex: number;
  
  // Timer fields
  roundStartedAt?: Date;
  questionStartedAt?: Date;
  questionDeadlineAt?: Date; // Server-authoritative
  roundDeadlineAt?: Date;    // For round 3
  
  // Scores
  round1ScoreByPlayer: Map<string, number>;
  round2ScoreByPlayer: Map<string, number>;
  preliminaryScoreByPlayer: Map<string, number>;
  finalScoreByPlayer?: Map<string, number>;
  
  winnerId?: ObjectId;
  
  startedAt?: Date;
  completedAt?: Date;
}
```

### 7.3 Question

```typescript
interface Question {
  _id: ObjectId;
  roundType: 1 | 2 | 3;
  type: 'mcq' | 'debug' | 'dsa';
  
  title: string;
  statement: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // MCQ specific
  options?: string[];
  correctAnswer?: string; // Never sent to client
  
  // Code specific
  buggyCode?: string;
  sampleTests?: TestCase[];
  hiddenTests?: TestCase[]; // select: false in schema
  
  executionLimits?: {
    timeLimit: number; // ms
    memoryLimit: number; // MB
  };
  
  maxPoints: number;
  status: 'draft' | 'published' | 'archived';
  
  createdBy: ObjectId;
  publishedAt?: Date;
}

interface TestCase {
  input: string;
  output: string;
  weight?: number; // For partial credit
}
```

### 7.4 Submission

```typescript
interface Submission {
  _id: ObjectId;
  matchId: ObjectId;
  playerId: ObjectId;
  questionId: ObjectId;
  
  language: string;
  sourceCode: string;
  submissionType: 'run' | 'submit';
  
  status: 'pending' | 'judging' | 'completed' | 'failed';
  verdict?: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'TLE' | 'Compilation Error';
  
  passedTests?: number;
  totalTests?: number;
  score?: number;
  
  executionTime?: number;
  memoryUsed?: number;
  
  submittedAt: Date;
  judgedAt?: Date;
}
```

### 7.5 PlayerAnswer (MCQ)

```typescript
interface PlayerAnswer {
  _id: ObjectId;
  matchId: ObjectId;
  playerId: ObjectId;
  questionId: ObjectId;
  roundType: number;
  
  selectedOption: string;
  isCorrect: boolean;
  score: number;
  
  submittedAt: Date;
}
```

### 7.6 CodeDraft

```typescript
interface CodeDraft {
  _id: ObjectId;
  matchId: ObjectId;
  playerId: ObjectId;
  questionId: ObjectId;
  language: string;
  
  sourceCode: string;
  
  updatedAt: Date;
}

// Unique index: matchId + playerId + questionId + language
```

---

## 8. Environment Configuration

### 8.1 Required Variables

```bash
# .env (Vercel Environment Variables)

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codewars?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Ably Realtime
ABLY_API_KEY=<your-ably-api-key>

# Piston Code Execution
PISTON_BASE_URL=https://emkc.org/api/v2/piston
PISTON_API_KEY=<optional-if-self-hosted>

# Application
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app

# Optional: Vercel Cron
CRON_SECRET=<random-secret-for-cron-authentication>

# Optional: Redis Cache
REDIS_URL=<upstash-or-vercel-kv-url>
```

### 8.2 Generate Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate cron secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 8.3 Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30,
      "memory": 1024
    }
  },
  
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,PATCH,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Authorization, Content-Type" }
      ]
    }
  ],
  
  "crons": [
    {
      "path": "/api/cron/advance-expired",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 9. Frontend Integration

### 9.1 API Client

```typescript
// src/services/api.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 9.2 Match Hook Example

```typescript
// src/hooks/useMatch.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { realtimeService } from '../services/realtime';

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatch() {
      try {
        const { data } = await apiClient.get(`/matches/${matchId}`);
        setMatch(data);

        if (data.currentQuestionIndex !== null) {
          const { data: question } = await apiClient.get(
            `/matches/${matchId}/questions/current`
          );
          setCurrentQuestion(question);
        }
      } catch (error) {
        console.error('Failed to load match:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMatch();

    // Subscribe to realtime updates
    const unsubscribe = realtimeService.subscribeToMatch(matchId, {
      onStateChange: (data) => {
        setMatch((prev) => prev ? { ...prev, ...data } : null);
      },
      onQuestion: (data) => {
        setCurrentQuestion(data.question);
        setMatch((prev) => prev ? { ...prev, currentQuestionIndex: data.index } : null);
      }
    });

    return () => unsubscribe();
  }, [matchId]);

  return { match, currentQuestion, loading };
}
```

---

## 10. Code Execution (Piston)

### 10.1 Piston Client

```typescript
// lib/judging/piston.ts
import axios from 'axios';

const pistonClient = axios.create({
  baseURL: process.env.PISTON_BASE_URL || 'https://emkc.org/api/v2/piston',
  timeout: 15000,
  headers: process.env.PISTON_API_KEY ? {
    'Authorization': `Bearer ${process.env.PISTON_API_KEY}`
  } : {}
});

export interface ExecuteRequest {
  language: string;
  version: string;
  files: Array<{
    name?: string;
    content: string;
  }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
}

export interface ExecuteResult {
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
  run: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
  language: string;
  version: string;
}

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResult> {
  const response = await pistonClient.post<ExecuteResult>('/execute', request);
  return response.data;
}

export async function getRuntimes() {
  const response = await pistonClient.get('/runtimes');
  return response.data;
}
```

### 10.2 Submission Handler

```typescript
// api/submissions/index.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { matchId, questionId, language, sourceCode, type } = req.body;

    // Validate match and deadline
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const isParticipant = match.playerIds.some(id => id.toString() === user._id);
    if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

    validateDeadline(match.questionDeadlineAt);

    // Create submission
    const submission = await Submission.create({
      matchId,
      playerId: user._id,
      questionId,
      language,
      sourceCode,
      submissionType: type || 'submit',
      status: 'pending',
      submittedAt: new Date()
    });

    // Execute asynchronously
    executeSubmission(submission._id.toString()).catch(console.error);

    return res.status(202).json({
      submissionId: submission._id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}

async function executeSubmission(submissionId: string) {
  await connectDB();
  
  const submission = await Submission.findById(submissionId)
    .populate('questionId');
    
  if (!submission) return;

  try {
    const question = submission.questionId as any;
    const testCases = question.hiddenTests || [];

    const results = await Promise.all(
      testCases.map(async (testCase: any) => {
        const result = await executeCode({
          language: submission.language,
          version: '*',
          files: [{ content: submission.sourceCode }],
          stdin: testCase.input,
          run_timeout: 3000,
          compile_timeout: 10000
        });

        return {
          passed: result.run.stdout.trim() === testCase.output.trim(),
          output: result.run.output
        };
      })
    );

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const score = (passedTests / totalTests) * question.maxPoints;

    submission.status = 'completed';
    submission.verdict = passedTests === totalTests ? 'Accepted' : 'Wrong Answer';
    submission.passedTests = passedTests;
    submission.totalTests = totalTests;
    submission.score = score;
    submission.judgedAt = new Date();
    await submission.save();

    // Publish verdict
    await publishEvent(
      `match:${submission.matchId}`,
      'submission_verdict',
      {
        submissionId: submission._id,
        playerId: submission.playerId,
        verdict: submission.verdict,
        score,
        passedTests,
        totalTests
      }
    );

  } catch (error) {
    console.error('Execution failed:', error);
    submission.status = 'failed';
    submission.verdict = 'Runtime Error';
    await submission.save();
  }
}
```

---

## 11. Security Requirements

### 11.1 Authentication

- ✅ JWT-based authentication
- ✅ Access tokens (15min expiry)
- ✅ Refresh tokens (7 day expiry)
- ✅ Token rotation on refresh
- ✅ Secure httpOnly cookies (optional)

### 11.2 Authorization

- ✅ Role-based access control (admin, participant)
- ✅ Match membership validation
- ✅ Tournament participation verification
- ✅ Private channel authentication (Ably tokens)

### 11.3 Data Protection

- ✅ Hide correct MCQ answers from clients
- ✅ Hide hidden test cases (Mongoose `select: false`)
- ✅ Hide other players' source code
- ✅ Validate all inputs (zod/joi schemas)
- ✅ Rate limiting on auth endpoints
- ✅ CORS configuration

### 11.4 Code Execution

- ✅ Never execute code in Node.js process
- ✅ Use Piston sandboxed execution
- ✅ Enforce time limits (3-10 seconds)
- ✅ Enforce memory limits
- ✅ Validate source code size (<100KB)
- ✅ Limit concurrent executions

### 11.5 Deadline Validation

```typescript
// Always validate on server
export function validateDeadline(deadlineAt: Date): void {
  if (new Date() > deadlineAt) {
    throw new ApiError(400, 'Deadline has expired');
  }
}

// Use in all submission endpoints
validateDeadline(match.questionDeadlineAt);
```

---

## 12. Testing Strategy

### 12.1 Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with function emulation
vercel dev

# Test API endpoints
curl http://localhost:3000/api/health
```

### 12.2 Integration Tests

```typescript
// tests/api/tournaments.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../api/tournaments/index';

describe('POST /api/tournaments', () => {
  it('creates a tournament', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-admin-token'
      },
      body: {
        name: 'Test Tournament',
        minParticipants: 4,
        maxParticipants: 16
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toHaveProperty('id');
  });
});
```

### 12.3 End-to-End Tests

```typescript
// tests/e2e/tournament-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete tournament flow', async ({ page, context }) => {
  // Login as admin
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Create tournament
  await page.goto('/admin/tournaments/new');
  await page.fill('[name="name"]', 'Test Tournament');
  await page.fill('[name="minParticipants"]', '4');
  await page.click('button:has-text("Create")');

  // Open registration
  await page.click('button:has-text("Open Registration")');

  // Create participant sessions
  const player1 = await context.newPage();
  await player1.goto('/tournaments/join');
  // ... test player joins

  // Verify matchmaking works
  await expect(page.locator('.participant-card')).toHaveCount(4);
});
```

---

## 13. Deployment Checklist

### Phase 1: Infrastructure Setup
- [ ] Create MongoDB Atlas cluster (M10+)
- [ ] Create Ably account and get API key
- [ ] Create Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Set up custom domain (optional)

### Phase 2: Code Migration
- [ ] Create `/api` directory structure
- [ ] Implement database connection caching
- [ ] Convert Express routes to Vercel Functions
- [ ] Implement authentication middleware
- [ ] Set up Ably event publishing
- [ ] Migrate database models
- [ ] Implement timer system

### Phase 3: Frontend Updates
- [ ] Update API client for REST endpoints
- [ ] Replace Socket.IO with Ably client
- [ ] Implement deadline-based timers
- [ ] Test realtime communication
- [ ] Handle loading and error states

### Phase 4: Testing
- [ ] Test locally with `vercel dev`
- [ ] Test authentication flow
- [ ] Test tournament creation and joining
- [ ] Test matchmaking (4, 6, 8, 10 participants)
- [ ] Test all three rounds
- [ ] Test code execution and judging
- [ ] Test leaderboard calculations
- [ ] Test reconnection scenarios

### Phase 5: Deployment
- [ ] Deploy to Vercel preview
- [ ] Run E2E tests on preview
- [ ] Monitor function execution times
- [ ] Monitor database connection pool
- [ ] Optimize cold starts if needed
- [ ] Deploy to production
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Document API endpoints

---

## 14. Cost Estimation

### Vercel
- **Hobby (Free):** 100GB bandwidth, 100 hours functions
- **Pro ($20/mo):** 1TB bandwidth, 1000 hours functions, faster cold starts ✅

### MongoDB Atlas
- **M0 (Free):** 512MB, shared CPU (development only)
- **M10 ($57/mo):** 10GB, dedicated cluster ✅

### Ably
- **Free:** 3M messages/month, 200 connections (small tournaments)
- **Standard ($29/mo):** 6M messages, 500 connections ✅

### Total: ~$106/month for production

---

## 15. Performance Optimization

### 15.1 Cold Start Mitigation
- Keep functions small (<1MB)
- Use dynamic imports for heavy libraries
- Cache database connections
- Consider Vercel Pro for faster cold starts

### 15.2 Database Optimization
- Use `.lean()` for read-only queries
- Index frequently queried fields
- Use aggregation for complex queries
- Limit result sets with pagination

### 15.3 Caching (Optional)
```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({ url: process.env.REDIS_URL! });

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 60
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}
```

---

## 16. Monitoring and Debugging

### 16.1 Structured Logging

```typescript
// lib/utils/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### 16.2 Error Tracking

Integrate Sentry:
```typescript
// lib/utils/sentry.ts
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1
  });
}

export { Sentry };
```

---

## 17. Success Criteria

✅ Tournament supports 4-16 participants dynamically  
✅ Admin can create and manage matches visually  
✅ Real-time updates work across all clients  
✅ Timers are accurate and deadline-enforced  
✅ Code execution is secure and sandboxed  
✅ Leaderboards calculate correctly  
✅ Players can reconnect without losing state  
✅ Deploys with single Vercel project  
✅ No self-hosted Express server required  
✅ Handles concurrent matches gracefully  
✅ Response times < 500ms for most endpoints  
✅ Cold starts < 2 seconds  

---

**Document Version:** 2.0 Serverless Edition  
**Status:** Ready for Implementation  
**Target Completion:** 4-6 weeks

