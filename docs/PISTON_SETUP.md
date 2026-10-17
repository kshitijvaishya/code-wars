# Piston Setup Guide

Quick reference for setting up Piston with Code Wars.

## Quick Start (Development)

### Option 1: Use Public Instance (Easiest)

Already configured by default! Just start the server:

```bash
cd server
npm run dev
```

The server will use `https://emkc.org/api/v2/piston` by default.

### Option 2: Self-Host with Docker

```bash
# Clone Piston
git clone https://github.com/engineer-man/piston
cd piston

# Start services
docker-compose up -d

# Verify it's running
curl http://localhost:2000/api/v2/piston/runtimes | jq
```

Update `.env`:
```env
PISTON_BASE_URL=http://localhost:2000/api/v2/piston
```

---

## Environment Variables

```env
# Required
PISTON_BASE_URL=https://emkc.org/api/v2/piston

# Optional (only if your Piston deployment requires authentication)
PISTON_API_KEY=your_api_key_here
```

---

## Verify Installation

### 1. Check Server Connection

```bash
curl http://localhost:5000/api/submissions/languages
```

Expected: JSON array of supported languages

### 2. Test Code Execution

Login first, then:

```bash
curl -X POST http://localhost:5000/api/submissions/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": "some_problem_id",
    "languageId": 71,
    "sourceCode": "print(\"Hello, Piston!\")"
  }'
```

### 3. Run Tests

```bash
cd server
npm test
```

All 77 tests should pass.

---

## Supported Languages

| Language | ID | Version |
|----------|----|---------| 
| C | 50 | 10.2.0 |
| C++ | 54 | 10.2.0 |
| C# | 51 | 6.12.0 |
| Go | 60 | 1.16.2 |
| Java | 62 | 15.0.2 |
| JavaScript | 63 | 18.15.0 |
| Kotlin | 78 | 1.8.20 |
| PHP | 68 | 8.2.3 |
| Python | 71 | 3.10.0 |
| Ruby | 72 | 3.0.1 |
| Rust | 73 | 1.68.2 |
| SQL | 82 | 3.36.0 |
| Swift | 83 | 5.3.3 |
| TypeScript | 74 | 5.0.3 |

Get current list: `GET /api/submissions/languages`

---

## Troubleshooting

### Cannot connect to Piston

**Check 1**: Verify Piston is running
```bash
curl http://localhost:2000/api/v2/piston/runtimes
```

**Check 2**: Check environment variable
```bash
echo $PISTON_BASE_URL
```

**Check 3**: Check server logs
```bash
cd server
npm run dev
# Look for Piston-related errors
```

### Unsupported language error

Check available runtimes on your Piston instance:
```bash
curl http://localhost:2000/api/v2/piston/runtimes | jq
```

Update language mapping in `server/src/judge/piston.provider.ts` if needed.

### Execution timeouts

Increase timeout in `piston.provider.ts`:
```typescript
this.client = axios.create({
  baseURL: env.PISTON_BASE_URL,
  timeout: 120000, // Increase this value
});
```

---

## Production Deployment

### 1. Self-Host Piston

**DO NOT** use the public instance for production!

```bash
# On your production server
git clone https://github.com/engineer-man/piston
cd piston

# Configure resource limits in docker-compose.yml
nano docker-compose.yml

# Start with proper resource constraints
docker-compose up -d
```

### 2. Configure Code Wars

```env
PISTON_BASE_URL=http://your-piston-server:2000/api/v2/piston
PISTON_API_KEY=  # Optional
```

### 3. Security Hardening

- Run Piston in isolated network
- Set up firewall rules (only allow Code Wars server)
- Monitor resource usage
- Set up alerts for failures
- Implement rate limiting
- Regular updates and patches

### 4. Scaling

For high traffic:
- Run multiple Piston instances
- Load balance requests
- Use Redis for result caching
- Implement job queuing
- Monitor performance metrics

---

## Self-Hosting Piston

### Basic Setup

```bash
# Clone repository
git clone https://github.com/engineer-man/piston.git
cd piston

# Start with default configuration
docker-compose up -d

# Verify
curl http://localhost:2000/api/v2/piston/runtimes
```

### Custom Configuration

Edit `docker-compose.yml`:

```yaml
version: '3'
services:
  piston_api:
    image: ghcr.io/engineer-man/piston
    container_name: piston_api
    restart: always
    ports:
      - 2000:2000
    environment:
      - PISTON_LOG_LEVEL=INFO
      - PISTON_MAX_PROCESS_COUNT=64
      - PISTON_MAX_MEMORY_LIMIT=256000000
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### Install Additional Runtimes

```bash
# List available packages
docker exec piston_api piston ppman list

# Install specific runtime
docker exec piston_api piston ppman install python=3.11.0
```

---

## API Reference

### Get Runtimes

```bash
GET /api/v2/piston/runtimes
```

Response:
```json
[
  {
    "language": "python",
    "version": "3.10.0",
    "aliases": ["py", "python3"]
  }
]
```

### Execute Code

```bash
POST /api/v2/piston/execute
```

Request:
```json
{
  "language": "python",
  "version": "3.10.0",
  "files": [
    {
      "content": "print('Hello World')"
    }
  ],
  "stdin": "",
  "run_timeout": 3000
}
```

Response:
```json
{
  "run": {
    "stdout": "Hello World\n",
    "stderr": "",
    "code": 0,
    "signal": null,
    "output": "Hello World\n"
  }
}
```

---

## Monitoring

### Health Check

```bash
#!/bin/bash
# health-check.sh

PISTON_URL="${PISTON_BASE_URL:-http://localhost:2000/api/v2/piston}"

# Test runtimes endpoint
if curl -f -s "$PISTON_URL/runtimes" > /dev/null; then
  echo "✓ Piston is healthy"
  exit 0
else
  echo "✗ Piston is not responding"
  exit 1
fi
```

### Log Monitoring

```bash
# View Piston logs
docker logs -f piston_api

# View Code Wars server logs
cd server
npm run dev
```

### Metrics to Track

1. Request count and rate
2. Average execution time
3. Error rate by language
4. Resource usage (CPU, memory)
5. Timeout frequency

---

## Development Tips

### Testing Piston Directly

```bash
# Test Python execution
curl -X POST http://localhost:2000/api/v2/piston/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.10.0",
    "files": [{"content": "print(2 + 2)"}]
  }'
```

### Debugging

Enable debug logging in `piston.provider.ts`:

```typescript
logger.debug('Piston request', { request: pistonRequest });
logger.debug('Piston response', { response });
```

### Local Testing

```bash
# Start MongoDB
docker-compose up -d mongodb

# Start server with Piston
cd server
npm run dev

# In another terminal, run tests
npm test
```

---

## Resources

- **Piston GitHub**: https://github.com/engineer-man/piston
- **Piston Docs**: https://github.com/engineer-man/piston#usage
- **Code Wars Docs**: `/docs/PISTON_MIGRATION_GUIDE.md`
- **Architecture**: `/docs/SYSTEM_ARCHITECTURE.md`

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check TypeScript
npx tsc --noEmit

# View logs
docker logs -f piston_api

# Restart Piston
docker restart piston_api

# Check Piston health
curl http://localhost:2000/api/v2/piston/runtimes
```
