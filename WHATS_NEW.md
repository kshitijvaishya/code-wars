# 🎉 What's New — Serverless Architecture

## Major Changes from v1.0 to v2.0

### ✨ Serverless First

**Before (v1.0):**
```
Self-hosted Express server
Socket.IO for real-time
In-memory state management
Background worker processes
Manual scaling
```

**After (v2.0):**
```
Vercel serverless functions
Ably/Pusher for real-time
Database-backed state
Scheduled functions (Vercel Cron)
Auto-scaling
```

---

## Key Architectural Improvements

### 1. **No More Express Server**

Gone: `server/src/index.ts` with Express app  
New: Individual function endpoints in `/api`

```
Old: server/src/routes/auth.ts → app.use('/api/auth', authRouter)
New: api/auth/login.ts → /api/auth/login
```

### 2. **Database Connection Caching**

Serverless functions are stateless, so we cache connections:

```typescript
// lib/db/connection.ts
let cachedConnection: typeof mongoose | null = null;

export async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection; // Reuse!
  }
  // Create new connection
}
```

### 3. **Deadline-Based Timers**

No more `setInterval` - we store deadlines:

```typescript
// Old approach (won't work in serverless)
setInterval(() => {
  if (--remainingTime === 0) advanceQuestion();
}, 1000);

// New approach
const deadline = new Date(startTime.getTime() + 45000);
// Client calculates: Math.max(0, deadline - Date.now())
// Server validates: if (Date.now() > deadline) throw error
```

### 4. **Real-time Without Socket.IO**

Vercel Functions can't host persistent WebSocket servers:

```typescript
// Old: Socket.IO server
io.on('connection', socket => {
  socket.emit('event', data);
});

// New: Ably REST API
await publishEvent('match:123', 'state_changed', data);
// Clients subscribe via Ably SDK
```

### 5. **Dynamic Participant System**

**Critical Change:** No hardcoded 8 players!

```typescript
// ❌ Old
const NUM_PLAYERS = 8;
const groups = ['A', 'B', 'C', 'D'];

// ✅ New
const numGroups = Math.floor(tournament.participantIds.length / 2);
const groups = generateGroupLabels(numGroups); // ['A', 'B', 'C', ...]
```

---

## New Tournament Models

### Tournament

```typescript
{
  minParticipants: number;     // Configurable!
  maxParticipants: number;     // Not hardcoded
  numFinalists: number;        // Typically 2, but flexible
  participantIds: ObjectId[];  // Dynamic array
}
```

### Match

```typescript
{
  groupLabel: string;          // 'A', 'B', 'C', ... (dynamic)
  playerIds: [ObjectId, ObjectId];  // Always exactly 2
  questionDeadlineAt: Date;    // Server-authoritative
  round1Scores: Map<string, number>;
  round2Scores: Map<string, number>;
}
```

---

## File Structure Changes

### Before
```
server/
  src/
    index.ts          # Express server
    routes/           # Express routes
    sockets/          # Socket.IO handlers
    controllers/      # Business logic
    middleware/       # Auth, validation
    models/           # Mongoose models
```

### After
```
api/                  # Vercel Functions
  auth/
    login.ts          # POST /api/auth/login
    register.ts       # POST /api/auth/register
  tournaments/
    index.ts          # GET/POST /api/tournaments
    [id]/
      index.ts        # GET/PATCH /api/tournaments/[id]
      join.ts         # POST /api/tournaments/[id]/join

lib/                  # Shared utilities
  db/
    connection.ts     # Cached MongoDB
    models/           # Mongoose models
  auth/
    jwt.ts            # Token generation
    middleware.ts     # Auth helpers
  tournament/
    timer.ts          # Deadline logic
  judging/
    piston.ts         # Code execution
```

---

## Environment Variables

### New Required Variables

```bash
# Ably real-time (replaces Socket.IO)
ABLY_API_KEY=your-ably-api-key

# Client URL for CORS
CLIENT_URL=https://your-app.vercel.app
```

### Removed Variables

```bash
# PORT - not needed (Vercel handles)
# RATE_LIMIT_* - moving to Vercel edge config
# DEFAULT_BATTLE_DURATION - now per-tournament config
```

---

## Deployment Changes

### Before
```bash
# Build
npm run build

# Run
npm start

# Deploy
docker-compose up
# or manual PM2/systemd setup
```

### After
```bash
# Local development
vercel dev

# Deploy preview
vercel

# Deploy production
vercel --prod

# That's it! No server management.
```

---

## API Response Format

### Standardized Responses

All endpoints now use consistent format:

```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: "Error message",
  details: { ... }  // Optional
}
```

---

## Authentication Flow

### Token Refresh

Still uses JWT but optimized for serverless:

```typescript
// Old: Stored in Redis
// New: Stored in MongoDB User.refreshTokens array

// Rotation on refresh
user.refreshTokens = user.refreshTokens
  .filter(t => t !== oldToken)
  .concat(newToken)
  .slice(-5); // Keep last 5
```

---

## Code Execution (Piston)

### Evaluation Process

```typescript
// 1. Create submission (status: pending)
const submission = await Submission.create({...});

// 2. Return immediately (202 Accepted)
return res.status(202).json({ submissionId });

// 3. Evaluate asynchronously
evaluateSubmission(submissionId).catch(console.error);

// 4. Publish result via Ably when done
await publishEvent('match:X', 'submission_verdict', {
  submissionId,
  verdict,
  score
});
```

No blocking - function returns fast, evaluation happens in background.

---

## Testing Strategy

### Before
- Supertest for API
- Socket.IO client for real-time
- Full integration tests

### After
- Same: API endpoint tests
- New: Ably event verification
- New: Deadline validation tests
- New: Connection caching tests

---

## Performance Improvements

### Cold Start Mitigation

1. **Connection caching** - Reuse MongoDB connections
2. **Lean queries** - Use `.lean()` for read-only data
3. **Small functions** - Each API route is independent
4. **Edge caching** - Static assets on CDN

### Metrics

| Metric | Before | After |
|--------|--------|-------|
| Cold start | N/A (always running) | ~500-2000ms |
| Warm request | ~50ms | ~50-100ms |
| Scaling | Manual | Automatic |
| Cost | ~$100/month (server) | ~$30/month (usage) |

---

## Migration Guide for Developers

### If you were working on the old codebase:

1. **Routes → Functions**
   - Move `server/src/routes/auth.ts` logic to `api/auth/*.ts`
   - Each route becomes its own file

2. **Socket.IO → Ably**
   - Replace `io.emit()` with `publishEvent()`
   - Update client to use Ably SDK

3. **Timers → Deadlines**
   - Store `deadlineAt` in database
   - Validate on submission, not in loop

4. **State → Database**
   - No in-memory caching
   - Store everything in MongoDB
   - Use database transactions where needed

---

## What Still Works the Same

✅ User authentication (JWT)  
✅ Battle state machine concept  
✅ Problem models  
✅ Submission judging flow  
✅ Rating calculations (Elo)  
✅ MongoDB schemas (mostly)  

---

## Breaking Changes

🚨 **Socket.IO client code needs rewrite**  
🚨 **API base URL changes** (now unified `/api`)  
🚨 **No `/battles` endpoints** (replaced with `/tournaments` + `/matches`)  
🚨 **Timer format changed** (deadline timestamps)  
🚨 **Real-time events renamed** (new Ably conventions)  

---

## Upgrade Path for Existing Deployments

1. **Export data** from existing MongoDB
2. **Transform** old battle documents to new match format
3. **Deploy** new serverless version
4. **Import** transformed data
5. **Update** frontend to new API

See `docs/MIGRATION_GUIDE.md` for detailed steps (coming soon).

---

## Development Experience

### Before
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Terminal 3
mongod
```

### After
```bash
# Single terminal
vercel dev

# Uses cloud MongoDB Atlas
# Emulates Vercel Functions locally
```

---

## Cost Comparison

### Monthly Estimates

**Before (Self-hosted):**
- VPS/Droplet: $20-50
- MongoDB: $0-57
- Bandwidth: Included
- Maintenance: Time-consuming
- **Total: ~$20-107/month + time**

**After (Serverless):**
- Vercel Hobby: Free (or Pro: $20)
- MongoDB Atlas: Free (or M10: $57)
- Ably Free: 3M messages (or $29)
- Maintenance: Minimal
- **Total: $0-106/month**

Plus: Auto-scaling, zero downtime, global CDN included.

---

## Next Steps

See `MIGRATION_STATUS.md` for:
- ✅ What's complete
- 🚧 What's in progress
- ⏳ What's coming next

Or jump to `QUICKSTART.md` to get started!

---

**Version 2.0 Status:** 🟡 40% Complete  
**Target:** Full tournament system operational  
**ETA:** 6 weeks from migration start  

Happy serverless coding! ⚡
