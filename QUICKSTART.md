# 🚀 Quick Start Guide — Code Wars Serverless

Get the tournament platform running locally in 5 minutes.

---

## Prerequisites

- Node.js 20+
- MongoDB Atlas account (free tier works)
- Vercel CLI
- Text editor

---

## Step 1: Clone and Install

```bash
# Clone repository
cd code-wars

# Install dependencies
npm install
cd client && npm install && cd ..

# Install Vercel CLI globally
npm i -g vercel
```

---

## Step 2: MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0)
3. Create database user
4. Get connection string
5. Whitelist your IP or use 0.0.0.0/0 for development

Your connection string looks like:
```
mongodb+srv://username:password@cluster.mongodb.net/codewars?retryWrites=true&w=majority
```

---

## Step 3: Environment Variables

Create `.env.local` in project root:

```bash
# Database
MONGODB_URI=mongodb+srv://your-connection-string

# JWT Secrets (generate with command below)
JWT_SECRET=your-64-char-secret
JWT_REFRESH_SECRET=your-other-64-char-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Piston (use public for now)
PISTON_BASE_URL=https://emkc.org/api/v2/piston

# App
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 4: Run Locally

```bash
# Start Vercel dev server
vercel dev
```

When prompted:
- Link to existing project? **No**
- Project name? **code-wars** (or your choice)
- Directory? **.** (current directory)
- Override settings? **No**

The app will start at: **http://localhost:3000**

API endpoints available at: **http://localhost:3000/api/***

---

## Step 5: Test the API

Open another terminal:

```bash
# Health check
curl http://localhost:3000/api/health

# Should return: {"status":"healthy","timestamp":"...","database":"connected"}
```

---

## Step 6: Create Admin User

For now, create admin user manually in MongoDB:

1. Go to MongoDB Atlas Console
2. Browse Collections → codewars → users
3. Insert document:

```json
{
  "username": "admin",
  "email": "admin@codewars.local",
  "passwordHash": "$2a$12$your-hashed-password",
  "role": "admin",
  "rating": 1200,
  "wins": 0,
  "losses": 0,
  "draws": 0,
  "totalBattles": 0,
  "refreshTokens": [],
  "createdAt": {"$date": "2026-10-22T00:00:00.000Z"},
  "updatedAt": {"$date": "2026-10-22T00:00:00.000Z"}
}
```

Or use this quick script:

```bash
# Create seed script
cat > seed-admin.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    email: String,
    passwordHash: String,
    role: String,
    rating: Number,
    wins: Number,
    losses: Number,
    draws: Number,
    totalBattles: Number,
    refreshTokens: [String],
  }, { timestamps: true }));

  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  await User.create({
    username: 'admin',
    email: 'admin@codewars.local',
    passwordHash: hashedPassword,
    role: 'admin',
    rating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    totalBattles: 0,
    refreshTokens: [],
  });

  console.log('Admin user created!');
  console.log('Email: admin@codewars.local');
  console.log('Password: admin123');
  
  await mongoose.disconnect();
}

seed().catch(console.error);
EOF

node seed-admin.js
```

---

## Step 7: Test Authentication

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the returned `accessToken` for authenticated requests.

---

## Step 8: Create Tournament

```bash
# Login as admin first
TOKEN="your-access-token-here"

# Create tournament
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Tournament",
    "minParticipants": 4,
    "maxParticipants": 16,
    "numFinalists": 2
  }'
```

---

## Next Steps

### Frontend Development
```bash
cd client
npm run dev
# Opens at http://localhost:5173
```

### Add Real-time (Ably)
1. Sign up at [ably.com](https://ably.com)
2. Get API key
3. Add to `.env.local`:
```bash
ABLY_API_KEY=your-ably-api-key
```

### Deploy to Vercel
```bash
# Deploy preview
vercel

# Deploy production
vercel --prod
```

---

## Troubleshooting

### MongoDB Connection Error
- Check connection string format
- Verify database user credentials
- Check IP whitelist in Atlas

### Vercel Dev Not Starting
- Make sure port 3000 is available
- Try `vercel dev --listen 3001`

### API Returns 500
- Check MongoDB connection
- Verify environment variables are loaded
- Check logs in terminal

### CORS Errors
- Check `CLIENT_URL` in `.env.local`
- Verify `vercel.json` CORS headers

---

## Useful Commands

```bash
# Check API health
curl http://localhost:3000/api/health

# View Vercel logs
vercel logs

# Build for production
npm run build

# Test specific endpoint
curl -X GET http://localhost:3000/api/tournaments

# Clear Vercel cache
vercel --force
```

---

## Architecture at a Glance

```
Browser → Vercel CDN → Vercel Functions → MongoDB Atlas
                    ↓
                 Ably (realtime)
                    ↓
                 Piston (code execution)
```

---

## What's Working

✅ User authentication (register, login, refresh)  
✅ Tournament CRUD  
✅ Join tournament  
✅ Code submission  
✅ Code execution (Piston)  
✅ Health checks  
✅ MongoDB connection caching  

---

## What's Next

⏳ Match creation and assignment  
⏳ Real-time updates with Ably  
⏳ Question management  
⏳ MCQ answer submission  
⏳ Leaderboard calculation  
⏳ Admin dashboard UI  

See `MIGRATION_STATUS.md` for full roadmap.

---

**Ready to build?** Start by exploring:
- `api/` - Serverless function endpoints
- `lib/` - Shared backend utilities
- `client/src` - React frontend

Happy coding! 🚀
