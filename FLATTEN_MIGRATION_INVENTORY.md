# Code Wars Repository Flattening — Complete Migration Inventory

**Date:** October 22, 2026  
**Objective:** Flatten client/server structure into single Vercel-deployable repository  
**Constraint:** Preserve ALL existing functionality

---

## Current Structure Analysis

### Client (`client/`)
```
client/
├── src/
│   ├── api/              # API client modules (6 files)
│   ├── components/       # React components
│   ├── hooks/            # React hooks (useSocket, useBattleSocket)
│   ├── pages/            # 14 page components
│   ├── store/            # Zustand stores (authStore, battleStore)
│   ├── types/            # TypeScript types
│   ├── utils/            # Client utilities
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML entry
├── vite.config.ts        # Vite configuration
├── package.json          # Client dependencies
└── tsconfig.json         # Client TypeScript config
```

### Server (`server/`)
```
server/
├── src/
│   ├── config/           # Env, database config
│   ├── controllers/      # 6 controllers (auth, battle, problem, submission, user, admin)
│   ├── judge/            # Piston integration
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # 7 Mongoose models
│   ├── routes/           # 6 Express routers
│   ├── scripts/          # Seed scripts
│   ├── services/         # Business logic (battle, matchmaking, rating, etc.)
│   ├── sockets/          # Socket.IO initialization and handlers
│   ├── types/            # Server types
│   ├── utils/            # Server utilities (JWT, logger, etc.)
│   └── index.ts          # Express server entry
├── package.json          # Server dependencies
└── tsconfig.json         # Server TypeScript config
```

### Shared (`shared/`)
```
shared/
├── src/
│   └── types.ts          # Shared TypeScript types
├── package.json
└── tsconfig.json
```

### Partially Created (`api/`, `lib/`)
```
api/                      # New serverless functions (partial)
lib/                      # New server utilities (partial)
```

---

## Target Flat Structure

```
code-wars/
├── public/               # Static assets (from client/public)
├── src/                  # React application (from client/src)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── stores/           # Renamed from store/
│   ├── services/         # Renamed from api/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/                  # Vercel Functions (adapt from server/src/routes + controllers)
│   ├── auth/
│   ├── battles/
│   ├── problems/
│   ├── submissions/
│   ├── users/
│   └── admin/
├── lib/                  # Server-only utilities (from server/src)
│   ├── db/
│   │   ├── connection.ts
│   │   └── models/       # From server/src/models
│   ├── auth/             # From server/src/middleware/authenticate + utils/jwt
│   ├── judge/            # From server/src/judge
│   ├── services/         # From server/src/services
│   ├── socket/           # Socket.IO adapter
│   ├── middleware/       # From server/src/middleware
│   └── utils/            # From server/src/utils
├── shared/               # Shared types (keep as-is)
│   └── types.ts
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── vercel.json           # Vercel configuration
├── package.json          # Unified dependencies
├── tsconfig.json         # Root TypeScript config
└── tsconfig.node.json    # Node/API TypeScript config
```

---

## File-by-File Migration Map

### Frontend Files (client/src → src/)

| Source | Destination | Action | Notes |
|--------|-------------|--------|-------|
| `client/src/App.tsx` | `src/App.tsx` | MOVE | No changes needed |
| `client/src/main.tsx` | `src/main.tsx` | MOVE | No changes needed |
| `client/src/index.css` | `src/index.css` | MOVE | No changes needed |
| `client/src/vite-env.d.ts` | `src/vite-env.d.ts` | MOVE | No changes needed |
| `client/src/api/*` | `src/services/*` | MOVE + RENAME | Rename api/ to services/ |
| `client/src/store/*` | `src/stores/*` | MOVE + RENAME | Rename store/ to stores/ |
| `client/src/components/**` | `src/components/**` | MOVE | Keep structure |
| `client/src/hooks/**` | `src/hooks/**` | MOVE | Keep hooks |
| `client/src/pages/**` | `src/pages/**` | MOVE | 14 pages |
| `client/src/types/**` | `src/types/**` | MOVE | Client types |
| `client/src/utils/**` | `src/utils/**` | MOVE | Client utilities |

### Backend-to-API Migration (server/src → api/ + lib/)

#### Controllers → API Functions

| Server Route | Controller | Target API | Notes |
|--------------|------------|------------|-------|
| `POST /api/auth/register` | `auth.controller.ts::register` | `api/auth/register.ts` | Adapt to Vercel Function |
| `POST /api/auth/login` | `auth.controller.ts::login` | `api/auth/login.ts` | Preserve JWT logic |
| `POST /api/auth/refresh` | `auth.controller.ts::refresh` | `api/auth/refresh.ts` | Keep token rotation |
| `POST /api/auth/logout` | `auth.controller.ts::logout` | `api/auth/logout.ts` | Simple endpoint |
| `GET /api/auth/me` | `auth.controller.ts::me` | `api/auth/me.ts` | Auth required |
| `GET /api/battles` | `battle.controller.ts::list` | `api/battles/index.ts` | List battles |
| `POST /api/battles` | `battle.controller.ts::create` | `api/battles/index.ts` | Create private battle |
| `GET /api/battles/:id` | `battle.controller.ts::get` | `api/battles/[id].ts` | Get battle state |
| `GET /api/battles/join/:code` | `battle.controller.ts::getByCode` | `api/battles/join/[code].ts` | Join by invite |
| `GET /api/battles/:id/result` | `battle.controller.ts::getResult` | `api/battles/[id]/result.ts` | Battle results |
| `GET /api/battles/history` | `battle.controller.ts::history` | `api/battles/history.ts` | User history |
| `GET /api/problems` | `problem.controller.ts::list` | `api/problems/index.ts` | List problems |
| `POST /api/problems` | `problem.controller.ts::create` | `api/problems/index.ts` | Create (admin) |
| `GET /api/problems/:id` | `problem.controller.ts::get` | `api/problems/[id].ts` | Get problem |
| `PUT /api/problems/:id` | `problem.controller.ts::update` | `api/problems/[id].ts` | Update (admin) |
| `DELETE /api/problems/:id` | `problem.controller.ts::delete` | `api/problems/[id].ts` | Delete (admin) |
| `POST /api/submissions/run` | `submission.controller.ts::run` | `api/submissions/run.ts` | Run code |
| `POST /api/submissions` | `submission.controller.ts::submit` | `api/submissions/index.ts` | Submit code |
| `GET /api/submissions/:id` | `submission.controller.ts::get` | `api/submissions/[id].ts` | Get submission |
| `GET /api/submissions/languages` | `submission.controller.ts::languages` | `api/submissions/languages.ts` | Supported languages |
| `GET /api/users/:id` | `user.controller.ts::get` | `api/users/[id].ts` | Get user profile |
| `GET /api/admin/stats` | `admin.controller.ts::stats` | `api/admin/stats.ts` | Admin stats |
| `GET /api/admin/battles` | `admin.controller.ts::battles` | `api/admin/battles.ts` | Admin battle list |
| `POST /api/admin/suspend` | `admin.controller.ts::suspend` | `api/admin/suspend.ts` | Suspend user |

#### Models → lib/db/models

| Server Model | Target | Action | Notes |
|--------------|--------|--------|-------|
| `server/src/models/User.ts` | `lib/db/models/User.ts` | MERGE | Merge with existing lib/db/models/User.ts |
| `server/src/models/Battle.ts` | `lib/db/models/Battle.ts` | MOVE | Battle schema |
| `server/src/models/Problem.ts` | `lib/db/models/Problem.ts` | MOVE | Problem schema |
| `server/src/models/Submission.ts` | `lib/db/models/Submission.ts` | MERGE | Merge with existing |
| `server/src/models/RatingHistory.ts` | `lib/db/models/RatingHistory.ts` | MOVE | Rating history |
| `server/src/models/Notification.ts` | `lib/db/models/Notification.ts` | MOVE | Notifications |
| `server/src/models/AuditLog.ts` | `lib/db/models/AuditLog.ts` | MOVE | Audit logs |

#### Services → lib/services

| Server Service | Target | Action | Notes |
|----------------|--------|--------|-------|
| `server/src/services/battle.service.ts` | `lib/services/battle.service.ts` | MOVE | Battle business logic |
| `server/src/services/matchmaking.service.ts` | `lib/services/matchmaking.service.ts` | MOVE | Matchmaking queue |
| `server/src/services/rating.service.ts` | `lib/services/rating.service.ts` | MOVE | Elo rating calculations |
| `server/src/services/submission.service.ts` | `lib/services/submission.service.ts` | MOVE | Submission processing |

#### Middleware → lib/middleware

| Server Middleware | Target | Action | Notes |
|-------------------|--------|--------|-------|
| `server/src/middleware/authenticate.ts` | `lib/auth/middleware.ts` | MERGE | Adapt for Vercel Functions |
| `server/src/middleware/validate.ts` | `lib/middleware/validate.ts` | MOVE | Zod validation |
| `server/src/middleware/errorHandler.ts` | `lib/middleware/errorHandler.ts` | MOVE | Error handling |
| `server/src/middleware/requireAdmin.ts` | `lib/auth/requireAdmin.ts` | MOVE | Admin check |

#### Utilities → lib/utils

| Server Utility | Target | Action | Notes |
|----------------|--------|--------|-------|
| `server/src/utils/jwt.ts` | `lib/auth/jwt.ts` | MERGE | JWT generation/verification |
| `server/src/utils/logger.ts` | `lib/utils/logger.ts` | MOVE | Winston logger |
| `server/src/utils/apiResponse.ts` | `lib/utils/response.ts` | MERGE | Response helpers |
| `server/src/utils/requestId.ts` | `lib/utils/requestId.ts` | MOVE | Request ID |
| `server/src/config/env.ts` | `lib/config/env.ts` | MOVE | Environment validation |
| `server/src/config/database.ts` | `lib/db/connection.ts` | MERGE | Connection caching |

#### Judge Integration → lib/judge

| Server Judge | Target | Action | Notes |
|--------------|--------|--------|-------|
| `server/src/judge/piston.ts` | `lib/judge/piston.ts` | MERGE | Piston client |
| `server/src/judge/executor.ts` | `lib/judge/executor.ts` | MOVE | Code execution logic |

### Socket.IO Migration → lib/socket

**Critical:** Socket.IO requires persistent server. Options:

1. **Keep Socket.IO with Express in Vercel** (Not Recommended)
   - Won't work: Vercel Functions are stateless
   
2. **Migrate to Ably/Pusher** (Recommended)
   - Create adapter: `lib/socket/adapter.ts`
   - Map all Socket.IO events to Ably channels
   - Update client to use Ably SDK

3. **Hybrid: Express Dev + Ably Prod** (Fallback)
   - Keep `server/` for local development
   - Use Ably in production
   - Maintain event interface compatibility

**Socket.IO Events to Preserve:**

| Event | Direction | Purpose | Migration |
|-------|-----------|---------|-----------|
| `battle:join` | Client → Server | Join battle room | → Ably presence |
| `battle:ready` | Client → Server | Mark ready | → API + Ably notify |
| `battle:unready` | Client → Server | Unmark ready | → API + Ably notify |
| `battle:status_update` | Client → Server | Update coding status | → API + Ably notify |
| `battle:state_changed` | Server → Client | Battle state transition | → Ably channel |
| `battle:participant_updated` | Server → Client | Participant status | → Ably channel |
| `battle:countdown` | Server → Client | Countdown tick | → Ably channel |
| `battle:timer_sync` | Server → Client | Timer sync | → Ably channel |
| `battle:completed` | Server → Client | Battle finished | → Ably channel |
| `matchmaking:join` | Client → Server | Join queue | → API + Ably notify |
| `matchmaking:cancel` | Client → Server | Leave queue | → API call |
| `matchmaking:found` | Server → Client | Match found | → Ably channel |
| `opponent:disconnected` | Server → Client | Opponent left | → Ably channel |
| `opponent:reconnected` | Server → Client | Opponent returned | → Ably channel |

---

## Critical Dependencies

### Must Preserve

- ✅ JWT authentication (access + refresh tokens)
- ✅ MongoDB connection (Battle, Problem, Submission, User models)
- ✅ Piston code execution
- ✅ Socket.IO real-time events (via Ably adapter)
- ✅ Battle state machine (WAITING → READY_CHECK → COUNTDOWN → ACTIVE → COMPLETED)
- ✅ Matchmaking queue
- ✅ Elo rating calculations
- ✅ Admin permissions
- ✅ Code draft persistence
- ✅ Submission history

### Import Path Changes

| Old Import | New Import |
|------------|------------|
| `from '@/api/auth.api'` | `from '@/services/auth.api'` |
| `from '@/store/authStore'` | `from '@/stores/authStore'` |
| `from '@code-wars/shared'` | `from '@/shared/types'` |
| `from '../models/User'` | `from '@/lib/db/models/User'` |
| `from '../services/battle.service'` | `from '@/lib/services/battle.service'` |

---

## Configuration Changes

### package.json (Root)

Merge dependencies from:
- `client/package.json`
- `server/package.json`
- Keep existing root dependencies

### vite.config.ts

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000',  // Proxy to Vercel dev
    '/socket.io': 'ws://localhost:3001' // Separate Socket.IO dev server
  }
}
```

### vercel.json

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/lib/*": ["./lib/*"],
      "@/shared/*": ["./shared/*"]
    }
  }
}
```

---

## Migration Steps

### Phase 1: Preserve Existing
1. ✅ Create complete inventory (this document)
2. Create backup branch
3. Run all existing tests
4. Document current behavior

### Phase 2: Move Frontend
1. Move `client/src/*` → `src/*`
2. Move `client/public/*` → `public/*`
3. Move `client/index.html` → `index.html`
4. Update imports: `@/api/` → `@/services/`
5. Update imports: `@/store/` → `@/stores/`
6. Test Vite dev server

### Phase 3: Migrate Backend to API Functions
1. Move models to `lib/db/models/`
2. Move services to `lib/services/`
3. Move utilities to `lib/utils/`
4. Convert controllers to API functions
5. Test each endpoint

### Phase 4: Socket.IO Migration
1. Set up Ably account
2. Create `lib/socket/adapter.ts`
3. Update server-side event publishing
4. Update client hook `useSocket.ts`
5. Test real-time events

### Phase 5: Configuration & Build
1. Merge package.json files
2. Update tsconfig paths
3. Configure Vercel routing
4. Test local dev (`npm run dev`)
5. Test Vercel build

### Phase 6: Verification
1. Run all tests
2. Test authentication flow
3. Test battle lifecycle
4. Test matchmaking
5. Test admin functions
6. Test code execution
7. Deploy to preview

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Socket.IO migration breaks real-time | HIGH | Keep Express dev server as fallback |
| Import path errors | MEDIUM | Systematic find-replace with verification |
| MongoDB connection issues | MEDIUM | Reuse existing cached connection pattern |
| Lost functionality | HIGH | Complete test suite before proceeding |
| Duplicate code | LOW | Careful merge of lib/ and server/ code |

---

## Rollback Plan

1. Keep `client/` and `server/` directories until verification complete
2. Use git branches for each phase
3. Maintain working dev environment in separate branch
4. Only delete old structure after production deployment success

---

**Status:** Inventory Complete — Ready for Phase 2  
**Next Step:** Move frontend files and update imports


## Migration Progress (Session 2)

### ✅ Completed
1. **Dependencies merged** - Combined client + server dependencies into root package.json
2. **Dependencies installed** - Ran `npm install` successfully (800 packages)
3. **Frontend files migrated** - All client/src → src/, client/public → public/
4. **Import paths updated** - `@/api/` → `@/services/`, `@/store/` → `@/stores/`
5. **Models migrated** - All 7 server/src/models → lib/db/models/:
   - User.ts (role updated to match server: contest_admin, super_admin)
   - Problem.ts
   - Battle.ts
   - Submission.ts
   - RatingHistory.ts
   - Notification.ts
   - AuditLog.ts
6. **Services copied** - server/src/services → lib/services (battle, matchmaking, scoring, submission)
7. **Utils copied** - server/src/utils → lib/utils
8. **Middleware copied** - server/src/middleware → lib/middleware
9. **Judge implementation copied** - server/src/judge → lib/judge (Piston integration)
10. **Shared types built** - @code-wars/shared package built and linked
11. **TypeScript config updated** - Added @code-wars/shared path mappings to tsconfig files
12. **Vite config updated** - Added alias for @code-wars/shared resolution

### 🚧 In Progress
1. **TypeScript compilation errors** - Build fails with 129 errors, mainly:
   - Express imports in lib/services (socket.io Server type incompatible with Vercel)
   - Missing dependencies (p-retry, uuid, express types)
   - Model path imports (`../models/` → `./db/models/`)
   - Config/env imports (`../config/env` needs to be created or removed)

### ⏳ Remaining Tasks
1. **Fix lib/ import paths**:
   - Update lib/services/*.ts: `../models/X` → `../db/models/X`
   - Update lib/middleware/*.ts: `../models/X` → `../db/models/X`
   - Remove/update `../config/env` imports (create lib/config/env.ts or use process.env directly)
   
2. **Remove Express dependencies from lib/ files**:
   - lib/middleware/authenticate.ts, errorHandler.ts, validate.ts use Express types
   - These need to be adapted for Vercel Functions (VercelRequest/VercelResponse)
   - Or keep Express versions and create separate Vercel-compatible versions
   
3. **Install missing dependencies**:
   - `p-retry` (used in lib/judge/piston.provider.ts)
   - `uuid` (used in lib/services/submission.service.ts, lib/utils/requestId.ts)
   - Express types (if keeping Express middleware)
   - socket.io (if keeping realtime features)

4. **Convert Express controllers to Vercel API functions**:
   - server/src/controllers/auth.controller.ts → api/auth/*.ts
   - server/src/controllers/battle.controller.ts → api/battles/*.ts
   - server/src/controllers/problem.controller.ts → api/problems/*.ts
   - server/src/controllers/submission.controller.ts → api/submissions/*.ts
   - server/src/controllers/user.controller.ts → api/users/*.ts
   - server/src/controllers/admin.controller.ts → api/admin/*.ts

5. **Handle Socket.IO for development**:
   - Keep server/ folder for Socket.IO development server
   - Create adapter/abstraction layer for realtime events
   - Document Ably/Pusher migration path for production

6. **Update API functions** (partially created ones in api/):
   - Fix references to old Tournament/Match models → Battle/Problem models
   - Update to use correct service layer functions
   - Fix TypeScript errors in existing api/ functions

7. **Test and verify**:
   - `npm run dev` (Vite frontend)
   - `npm run dev:api` (Vercel Functions)
   - Fix 403 authentication errors
   - Test battle flows, matchmaking, judging

### 📝 Notes
- Socket.IO persistent connections incompatible with Vercel Functions → need Ably/Pusher for production
- Keep server/ folder for development Socket.IO server (can run separately)
- Shared types package successfully linked as local dependency
- All 800 npm packages installed, 48 vulnerabilities noted (not blocking)
