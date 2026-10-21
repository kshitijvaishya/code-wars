# Code Wars — Serverless Migration Plan

## Executive Summary

This document outlines the complete migration of Code Wars from a traditional Express.js + Socket.IO architecture to a fully serverless architecture deployable on Vercel as a single project.

**Migration Goals:**
- Single repository, single Vercel project deployment
- Eliminate self-hosted Express server dependency
- Replace Socket.IO with managed realtime service
- Maintain all existing functionality
- Preserve database models and business logic
- Enable horizontal scaling through serverless architecture

---

## 1. Current Architecture Analysis

### 1.1 Existing Components

**Backend (server/):**
- Express.js HTTP server
- Socket.IO for real-time communication
- MongoDB with Mongoose
- JWT authentication
- Battle state management
- Submission queue
- Piston API integration

**Frontend (client/):**
- React + TypeScript + Vite
- Socket.IO client
- Monaco Editor
- Zustand state management

### 1.2 Migration Challenges

| Component | Current | Challenge | Solution |
|-----------|---------|-----------|----------|
| Express Server | Self-hosted | Stateless required | Vercel Functions |
| Socket.IO | Persistent connection | No persistent processes | Ably/Pusher |
| Session State | In-memory | Lost on restart | Database + managed cache |
| Background Jobs | Node workers | No long-running processes | Webhooks + scheduled functions |
| File Uploads | Direct to server | Ephemeral filesystem | Direct to cloud storage or base64 |

---

## 2. Target Serverless Architecture

### 2.1 Technology Stack

**Frontend:**
- React 18+
- TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- Monaco Editor
- Ably Client SDK (realtime)

**Backend (Serverless):**
- Vercel Functions (Node.js 20+)
- TypeScript
- Mongoose (MongoDB Atlas)
- JWT with server-side validation
- Ably REST API (realtime events)
- Piston API (code execution)

**Infrastructure:**
- Vercel (hosting + functions)
- MongoDB Atlas (database)
- Ably (realtime communication)
- Vercel KV or Upstash Redis (optional caching)

### 2.2 Deployment Structure

```
code-wars/
├── api/                          # Vercel Functions
│   ├── auth/
│   │   ├── register.ts          # POST /api/auth/register
│   │   ├── login.ts             # POST /api/auth/login
│   │   ├── refresh.ts           # POST /api/auth/refresh
│   │   ├── logout.ts            # POST /api/auth/logout
│   │   └── me.ts                # GET /api/auth/me
│   ├── tournaments/
│   │   ├── index.ts             # GET/POST /api/tournaments
│   │   ├── [id]/
│   │   │   ├── index.ts         # GET/PATCH /api/tournaments/[id]
│   │   │   ├── join.ts          # POST /api/tournaments/[id]/join
│   │   │   ├── leave.ts         # POST /api/tournaments/[id]/leave
│   │   │   ├── participants.ts  # GET /api/tournaments/[id]/participants
│   │   │   ├── start.ts         # POST /api/tournaments/[id]/start
│   │   │   └── leaderboard.ts   # GET /api/tournaments/[id]/leaderboard
│   ├── matches/
│   │   ├── index.ts             # POST /api/matches
│   │   ├── [id]/
│   │   │   ├── index.ts         # GET /api/matches/[id]
│   │   │   ├── assign.ts        # POST /api/matches/[id]/assign
│   │   │   ├── start.ts         # POST /api/matches/[id]/start
│   │   │   ├── state.ts         # GET /api/matches/[id]/state
│   │   │   └── questions/
│   │   │       └── current.ts   # GET /api/matches/[id]/questions/current
│   │   └── auto-pair.ts         # POST /api/matches/auto-pair
│   ├── questions/
│   │   ├── index.ts             # GET/POST /api/questions
│   │   └── [id].ts              # GET/PUT/DELETE /api/questions/[id]
│   ├── answers/
│   │   └── index.ts             # POST /api/answers
│   ├── submissions/
│   │   ├── index.ts             # POST /api/submissions
│   │   ├── [id].ts              # GET /api/submissions/[id]
│   │   ├── run.ts               # POST /api/submissions/run
│   │   └── languages.ts         # GET /api/submissions/languages
│   ├── leaderboard/
│   │   └── index.ts             # GET /api/leaderboard
│   ├── admin/
│   │   ├── qualify.ts           # POST /api/admin/qualify
│   │   └── results.ts           # POST /api/admin/results
│   └── realtime/
│       └── auth.ts              # POST /api/realtime/auth (Ably token)
├── lib/                          # Shared server-side utilities
│   ├── db/
│   │   ├── connection.ts        # MongoDB connection with caching
│   │   └── models/              # Mongoose models
│   ├── auth/
│   │   ├── jwt.ts               # JWT utilities
│   │   ├── middleware.ts        # Auth middleware for functions
│   │   └── validate.ts          # Token validation
│   ├── realtime/
│   │   ├── ably.ts              # Ably client initialization
│   │   └── events.ts            # Event publishing helpers
│   ├── judging/
│   │   ├── piston.ts            # Piston API client
│   │   └── queue.ts             # Submission queue logic
│   ├── tournament/
│   │   ├── matchmaking.ts       # Matchmaking logic
│   │   ├── scoring.ts           # Scoring calculations
│   │   └── qualification.ts     # Qualification logic
│   └── utils/
│       ├── validation.ts        # Input validation schemas
│       ├── errors.ts            # Custom error classes
│       └── response.ts          # Response formatting
├── src/                          # Frontend React application
│   ├── components/
│   ├── pages/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   │   ├── api.ts               # Axios client
│   │   └── realtime.ts          # Ably client wrapper
│   ├── stores/
│   └── types/
├── public/
├── vercel.json                   # Vercel configuration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Realtime Communication Migration

### 3.1 Socket.IO → Ably Migration

**Why Ably:**
- Native serverless support
- Channel-based pub/sub
- Presence tracking
- Private channel authentication
- Built-in reconnection and message history
- No persistent server required

**Alternative: Pusher** (similar features, different pricing model)

### 3.2 Event Mapping

| Socket.IO Event | Ably Channel Pattern | Notes |
|-----------------|---------------------|-------|
| `battle:join` | `match:[matchId]` | Private channel per match |
| `battle:state_changed` | `match:[matchId]:state` | State updates |
| `battle:countdown` | `match:[matchId]:timer` | Timer events |
| `submission:verdict` | `match:[matchId]:submissions:[userId]` | User-specific |
| `matchmaking:found` | `user:[userId]:notifications` | Private user channel |
| `lobby:updated` | `tournament:[tournamentId]:lobby` | Tournament-wide |

### 3.3 Ably Implementation Pattern

**Backend (Vercel Function):**

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
  event: string,
  data: any
) {
  const client = getAblyClient();
  await client.channels.get(channel).publish(event, data);
}

// Generate token for client authentication
export async function generateAblyToken(userId: string) {
  const client = getAblyClient();
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: userId,
    capability: {
      [`user:${userId}:*`]: ['subscribe', 'presence'],
      [`tournament:*:lobby`]: ['subscribe'],
      // Dynamic capabilities based on user's matches
    }
  });
  return tokenRequest;
}
```

**Frontend:**

```typescript
// src/services/realtime.ts
import Ably from 'ably/promises';
import { apiClient } from './api';

class RealtimeService {
  private client: Ably.Realtime | null = null;

  async connect(userId: string) {
    const { data: tokenRequest } = await apiClient.post('/api/realtime/auth');
    
    this.client = new Ably.Realtime({
      authCallback: async (tokenParams, callback) => {
        try {
          const { data } = await apiClient.post('/api/realtime/auth');
          callback(null, data);
        } catch (error) {
          callback(error as Error, null);
        }
      },
      clientId: userId
    });

    return this.client;
  }

  subscribeToMatch(matchId: string, callbacks: {
    onStateChange?: (data: any) => void;
    onTimer?: (data: any) => void;
    onSubmission?: (data: any) => void;
  }) {
    if (!this.client) throw new Error('Not connected');

    const channel = this.client.channels.get(`match:${matchId}`);
    
    if (callbacks.onStateChange) {
      channel.subscribe('state_changed', callbacks.onStateChange);
    }
    if (callbacks.onTimer) {
      channel.subscribe('timer', callbacks.onTimer);
    }
    if (callbacks.onSubmission) {
      channel.subscribe('submission', callbacks.onSubmission);
    }

    return () => channel.unsubscribe();
  }
}

export const realtimeService = new RealtimeService();
```

---

## 4. Database Connection Management

### 4.1 Connection Caching Pattern

Vercel Functions are stateless but can reuse connections between invocations in the same container.

```typescript
// lib/db/connection.ts
import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not defined');
  }

  console.log('Creating new MongoDB connection');
  
  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  cachedConnection = connection;
  return connection;
}
```

### 4.2 MongoDB Atlas Configuration

**Connection String Format:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/codewars?retryWrites=true&w=majority
```

**Recommended Settings:**
- Connection pooling: 10-50 connections per function region
- Read preference: primaryPreferred
- Write concern: majority
- Auto-index: false in production

---

## 5. API Function Structure

### 5.1 Standard Function Template

```typescript
// api/matches/[id]/start.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/db/connection';
import { authenticate } from '../../../lib/auth/middleware';
import { Match } from '../../../lib/db/models';
import { publishEvent } from '../../../lib/realtime/ably';
import { ApiError } from '../../../lib/utils/errors';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    // Connect to database
    await connectDB();

    // Authenticate user
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract and validate parameters
    const { id: matchId } = req.query;
    if (!matchId || typeof matchId !== 'string') {
      return res.status(400).json({ error: 'Invalid match ID' });
    }

    // Business logic
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify permissions
    const isAdmin = user.role === 'admin';
    const isParticipant = match.playerIds.some(
      id => id.toString() === user._id.toString()
    );

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate state transition
    if (match.status !== 'READY') {
      return res.status(400).json({ 
        error: 'Match not ready to start',
        currentStatus: match.status
      });
    }

    // Update match state
    match.status = 'COUNTDOWN';
    match.startedAt = new Date();
    await match.save();

    // Publish realtime event
    await publishEvent(
      `match:${matchId}`,
      'state_changed',
      {
        status: 'COUNTDOWN',
        startedAt: match.startedAt,
        countdown: 10
      }
    );

    // Return response
    return res.status(200).json({
      success: true,
      match: {
        id: match._id,
        status: match.status,
        startedAt: match.startedAt
      }
    });

  } catch (error) {
    console.error('Error starting match:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : undefined
    });
  }
}
```

### 5.2 Authentication Middleware

```typescript
// lib/auth/middleware.ts
import type { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { User } from '../db/models';

export interface AuthenticatedUser {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export async function authenticate(
  req: VercelRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string };

    const user = await User.findById(decoded.userId)
      .select('username email role')
      .lean();

    if (!user) {
      return null;
    }

    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'superadmin';
}
```

---

## 6. Timer and Background Jobs

### 6.1 Problem: No Long-Running Processes

Vercel Functions have a maximum execution time (10s hobby, 60s pro, 300s enterprise).

Cannot run:
- Continuous timer loops
- Background workers
- Cron jobs (without Vercel Cron)

### 6.2 Solution: Client-Side Timers + Server Validation

**Pattern:**
1. Store deadline timestamps in database
2. Clients calculate remaining time from deadline
3. Clients auto-advance on deadline expiry
4. Server validates all submissions against deadline
5. Optional: Vercel Cron functions for cleanup/fallback

**Implementation:**

```typescript
// lib/tournament/timer.ts
export interface TimerState {
  startedAt: Date;
  duration: number; // seconds
  deadlineAt: Date;
}

export function createTimer(duration: number): TimerState {
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + duration * 1000);
  
  return {
    startedAt,
    duration,
    deadlineAt
  };
}

export function getRemainingTime(deadlineAt: Date): number {
  const now = new Date();
  const remaining = Math.max(0, deadlineAt.getTime() - now.getTime());
  return Math.ceil(remaining / 1000); // seconds
}

export function hasExpired(deadlineAt: Date): boolean {
  return getRemainingTime(deadlineAt) === 0;
}

export function validateDeadline(deadlineAt: Date): void {
  if (hasExpired(deadlineAt)) {
    throw new Error('Deadline has expired');
  }
}
```

**Frontend Timer:**

```typescript
// src/hooks/useTimer.ts
import { useState, useEffect } from 'react';

export function useTimer(deadlineAt: string | null) {
  const [remaining, setRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadlineAt) {
      setRemaining(0);
      return;
    }

    const deadline = new Date(deadlineAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, deadline - now);
      const seconds = Math.ceil(diff / 1000);
      
      setRemaining(seconds);
      
      if (seconds === 0 && !expired) {
        setExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [deadlineAt, expired]);

  return { remaining, expired };
}
```

### 6.3 Optional: Vercel Cron for Cleanup

```typescript
// api/cron/cleanup-expired.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/connection';
import { Match } from '../../lib/db/models';

// Secured by Vercel Cron secret
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDB();

    // Find matches with expired deadlines
    const expiredMatches = await Match.find({
      status: 'IN_PROGRESS',
      'deadlineAt': { $lt: new Date() }
    });

    for (const match of expiredMatches) {
      // Auto-advance or finalize
      match.status = 'COMPLETED';
      await match.save();
      
      // Publish event
      await publishEvent(
        `match:${match._id}`,
        'auto_completed',
        { reason: 'deadline_expired' }
      );
    }

    return res.status(200).json({
      processed: expiredMatches.length
    });

  } catch (error) {
    console.error('Cron error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
```

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-expired",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## 7. Code Execution (Piston Integration)

### 7.1 Current Pattern (Preserved)

The existing Piston integration can remain largely unchanged:

```typescript
// lib/judging/piston.ts
import axios from 'axios';

const pistonClient = axios.create({
  baseURL: process.env.PISTON_BASE_URL || 'https://emkc.org/api/v2/piston',
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
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface ExecuteResult {
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  language: string;
  version: string;
}

export async function executeCode(
  request: ExecuteRequest
): Promise<ExecuteResult> {
  const response = await pistonClient.post<ExecuteResult>('/execute', request);
  return response.data;
}

export async function getRuntimes() {
  const response = await pistonClient.get('/runtimes');
  return response.data;
}
```

### 7.2 Submission Handler

```typescript
// api/submissions/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/connection';
import { authenticate } from '../../lib/auth/middleware';
import { Submission, Match } from '../../lib/db/models';
import { executeCode } from '../../lib/judging/piston';
import { publishEvent } from '../../lib/realtime/ably';
import { validateDeadline } from '../../lib/tournament/timer';

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

    const { matchId, questionId, language, sourceCode, type } = req.body;

    // Validate inputs
    if (!matchId || !questionId || !language || !sourceCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify match membership and deadline
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const isParticipant = match.playerIds.some(
      id => id.toString() === user._id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a match participant' });
    }

    // Check deadline
    try {
      validateDeadline(match.deadlineAt);
    } catch (error) {
      return res.status(400).json({ error: 'Deadline expired' });
    }

    // Create submission record
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

    // Execute asynchronously (don't wait)
    executeSubmission(submission._id.toString()).catch(error => {
      console.error('Execution error:', error);
    });

    // Return immediately
    return res.status(202).json({
      submissionId: submission._id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function executeSubmission(submissionId: string) {
  await connectDB();
  
  const submission = await Submission.findById(submissionId)
    .populate('questionId');
    
  if (!submission) return;

  try {
    // Get test cases
    const question = submission.questionId;
    const testCases = question.testCases || [];

    // Execute against test cases
    const results = await Promise.all(
      testCases.map(async (testCase: any) => {
        const result = await executeCode({
          language: submission.language,
          version: '*',
          files: [{
            content: submission.sourceCode
          }],
          stdin: testCase.input,
          run_timeout: 3000,
          compile_timeout: 10000
        });

        const passed = result.run.stdout.trim() === testCase.output.trim();
        
        return { passed, result };
      })
    );

    // Calculate score
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const score = (passedTests / totalTests) * question.maxPoints;

    // Update submission
    submission.status = 'completed';
    submission.verdict = passedTests === totalTests ? 'Accepted' : 'Wrong Answer';
    submission.passedTests = passedTests;
    submission.totalTests = totalTests;
    submission.score = score;
    submission.judgedAt = new Date();
    await submission.save();

    // Publish result
    await publishEvent(
      `match:${submission.matchId}:submissions:${submission.playerId}`,
      'verdict',
      {
        submissionId: submission._id,
        verdict: submission.verdict,
        score: submission.score,
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

## 8. Frontend API Client

### 8.1 Axios Configuration

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

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken
        });

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

### 8.2 API Service Layer

```typescript
// src/services/tournament.api.ts
import { apiClient } from './api';

export const tournamentApi = {
  async create(data: CreateTournamentDto) {
    const response = await apiClient.post('/tournaments', data);
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/tournaments/${id}`);
    return response.data;
  },

  async join(id: string) {
    const response = await apiClient.post(`/tournaments/${id}/join`);
    return response.data;
  },

  async leave(id: string) {
    const response = await apiClient.post(`/tournaments/${id}/leave`);
    return response.data;
  },

  async getParticipants(id: string) {
    const response = await apiClient.get(`/tournaments/${id}/participants`);
    return response.data;
  },

  async getLeaderboard(id: string) {
    const response = await apiClient.get(`/tournaments/${id}/leaderboard`);
    return response.data;
  }
};
```

---

## 9. Environment Variables

### 9.1 Required Variables

```bash
# .env.local (development)
# .env (production - set in Vercel dashboard)

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codewars

# JWT
JWT_SECRET=your-64-char-secret-here
JWT_REFRESH_SECRET=your-64-char-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Ably (Realtime)
ABLY_API_KEY=your-ably-api-key

# Piston (Code Execution)
PISTON_BASE_URL=https://emkc.org/api/v2/piston
PISTON_API_KEY=optional-if-self-hosted

# Application
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app

# Optional: Vercel Cron
CRON_SECRET=random-secret-for-cron-auth

# Optional: Redis Cache (Vercel KV or Upstash)
REDIS_URL=redis://...
```

### 9.2 Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
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
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS,PATCH" },
        { "key": "Access-Control-Allow-Headers", "value": "Authorization, Content-Type" }
      ]
    }
  ]
}
```

---

## 10. Migration Checklist

### 10.1 Phase 1: Setup Infrastructure
- [ ] Create MongoDB Atlas cluster
- [ ] Set up Ably account and get API key
- [ ] Create Vercel project
- [ ] Configure environment variables in Vercel

### 10.2 Phase 2: Backend Migration
- [ ] Create `/api` directory structure
- [ ] Move database models to `/lib/db/models`
- [ ] Implement database connection caching
- [ ] Convert Express routes to Vercel Functions
- [ ] Implement authentication middleware
- [ ] Set up Ably event publishing
- [ ] Test API endpoints locally with `vercel dev`

### 10.3 Phase 3: Realtime Migration
- [ ] Replace Socket.IO server code with Ably REST API
- [ ] Implement Ably token generation endpoint
- [ ] Replace Socket.IO client with Ably client
- [ ] Update event listeners and emitters
- [ ] Test realtime communication

### 10.4 Phase 4: Timer & Background Jobs
- [ ] Implement deadline-based timer system
- [ ] Update submission validation to check deadlines
- [ ] Add client-side timer hooks
- [ ] Set up Vercel Cron (optional)
- [ ] Test deadline enforcement

### 10.5 Phase 5: Frontend Updates
- [ ] Update API client to use REST endpoints
- [ ] Implement Ably realtime service
- [ ] Update state management for async operations
- [ ] Test all user flows
- [ ] Handle loading and error states

### 10.6 Phase 6: Testing
- [ ] Test authentication flow
- [ ] Test tournament creation and joining
- [ ] Test matchmaking and pairing
- [ ] Test all three rounds
- [ ] Test code execution and judging
- [ ] Test leaderboard calculations
- [ ] Test reconnection scenarios
- [ ] Load test with multiple concurrent users

### 10.7 Phase 7: Deployment
- [ ] Deploy to Vercel staging
- [ ] Run end-to-end tests
- [ ] Monitor function execution times
- [ ] Monitor database connections
- [ ] Optimize cold start times
- [ ] Deploy to production
- [ ] Set up monitoring and logging

---

## 11. Performance Optimization

### 11.1 Cold Start Mitigation

**Problem:** First request to a function may be slow.

**Solutions:**
1. Keep functions small and focused
2. Use dynamic imports for heavy dependencies
3. Cache database connections
4. Consider Vercel Pro for faster cold starts
5. Use warming functions (periodic health checks)

### 11.2 Database Query Optimization

```typescript
// Bad: Multiple round trips
const tournament = await Tournament.findById(id);
const participants = await User.find({ _id: { $in: tournament.participantIds }});
const matches = await Match.find({ tournamentId: id });

// Good: Use aggregation or populate
const tournament = await Tournament.findById(id)
  .populate('participantIds', 'username email')
  .lean();

const matches = await Match.find({ tournamentId: id }).lean();
```

### 11.3 Caching Strategy (Optional)

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = process.env.REDIS_URL 
  ? new Redis({ url: process.env.REDIS_URL })
  : null;

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60
): Promise<T> {
  if (!redis) return fetcher();

  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.setex(key, ttl, data);
  
  return data;
}
```

---

## 12. Monitoring and Debugging

### 12.1 Logging

```typescript
// lib/utils/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date() }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date()
    }));
  },
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date() }));
  }
};
```

### 12.2 Error Tracking

Consider integrating:
- Sentry (error tracking)
- LogRocket (session replay)
- Vercel Analytics (performance)

### 12.3 Health Checks

```typescript
// api/health.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/db/connection';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await connectDB();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
}
```

---

## 13. Cost Estimation

### 13.1 Vercel

**Hobby Plan (Free):**
- 100GB bandwidth
- 100 hours function execution
- Serverless function execution

**Pro Plan ($20/month):**
- 1TB bandwidth
- 1000 hours function execution
- Faster cold starts
- Cron jobs

### 13.2 MongoDB Atlas

**Free Tier (M0):**
- 512MB storage
- Shared CPU
- Suitable for development

**M10 ($57/month):**
- 10GB storage
- Dedicated cluster
- Recommended for production

### 13.3 Ably

**Free Tier:**
- 3M messages/month
- 200 concurrent connections
- Suitable for small tournaments

**Standard ($29/month):**
- 6M messages/month
- 500 concurrent connections

**Total Estimated Cost for Production:**
- Vercel Pro: $20/month
- MongoDB M10: $57/month
- Ably Standard: $29/month
- **Total: ~$106/month**

---

## 14. Next Steps

1. **Week 1:** Set up infrastructure (MongoDB, Ably, Vercel)
2. **Week 2:** Migrate core API endpoints and models
3. **Week 3:** Implement realtime communication
4. **Week 4:** Update frontend and test integration
5. **Week 5:** Testing, optimization, and deployment

## 15. Support Resources

- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Ably Documentation](https://ably.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose + Serverless Best Practices](https://mongoosejs.com/docs/lambda.html)

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-22  
**Status:** Ready for Implementation
