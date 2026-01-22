# 🚀 HUMANWRITER AI - Quick Start Guide

## ⚡ TL;DR - Start Development

```bash
# 1. Start PostgreSQL (you need Docker or a local PostgreSQL server)
docker run -d --name humanwriter-postgres \
  -e POSTGRES_USER=humanwriter \
  -e POSTGRES_PASSWORD=humanwriter \
  -e POSTGRES_DB=humanwriter \
  -p 5432:5432 \
  postgres:15-alpine

# 2. Run database migrations
cd webapp
npx prisma migrate deploy  # or: npx prisma db push
cd ..

# 3. Start all services (in separate terminals)
# Terminal 1: Backend API
cd backend-api && npm run dev

# Terminal 2: AI Engine
cd ai-engine && python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Frontend
cd webapp && npm run dev
```

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **Python 3.11+** installed
- ✅ **PostgreSQL 15+** running (local or Docker)
- ✅ **Redis** (optional, for caching)
- ✅ All dependencies installed (already done ✅)

---

## 🔧 Detailed Setup

### Step 1: Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL
docker run -d \
  --name humanwriter-postgres \
  -e POSTGRES_USER=humanwriter \
  -e POSTGRES_PASSWORD=humanwriter \
  -e POSTGRES_DB=humanwriter \
  -p 5432:5432 \
  -v humanwriter_pg_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Start Redis (optional)
docker run -d \
  --name humanwriter-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### Option B: Using Local PostgreSQL

1. Install PostgreSQL 15+
2. Create database:
```sql
CREATE DATABASE humanwriter;
CREATE USER humanwriter WITH PASSWORD 'humanwriter';
GRANT ALL PRIVILEGES ON DATABASE humanwriter TO humanwriter;
```

3. Update `.env` files with your connection string

### Step 2: Database Migrations

```bash
cd webapp
npx prisma generate
npx prisma migrate deploy
# Or if no migrations exist:
npx prisma db push
cd ..
```

### Step 3: Start Backend API

```bash
cd backend-api
npm run dev
```

**Expected output:**
```
Server running on port 4000
Connected to database
```

**Check it works:**
```bash
curl http://localhost:4000/health
```

### Step 4: Start AI Engine

```bash
cd ai-engine
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Check it works:**
```bash
curl http://localhost:8000/health
```

### Step 5: Start Frontend

```bash
cd webapp
npm run dev
```

**Expected output:**
```
▲ Next.js 16.1.4
- Local:        http://localhost:3000
```

**Open in browser:** http://localhost:3000

---

## 🎯 Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | 3000 | http://localhost:3000 | Next.js web interface |
| **Backend API** | 4000 | http://localhost:4000 | Express REST API |
| **AI Engine** | 8000 | http://localhost:8000 | FastAPI AI services |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Redis** | 6379 | localhost:6379 | Cache (optional) |

---

## 🐛 Troubleshooting

### Error: "Can't connect to database"

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   # or
   pg_isready -h localhost -p 5432
   ```

2. Check connection string in `.env`:
   ```bash
   cd webapp && cat .env | grep DATABASE_URL
   ```

3. Test connection:
   ```bash
   psql -h localhost -U humanwriter -d humanwriter
   ```

### Error: "Port 4000 already in use"

**Solution:**
```bash
# Find and kill process using port 4000
lsof -ti:4000 | xargs kill -9

# Or use a different port
PORT=4001 npm run dev
```

### Error: "Registration failed - An error occurred"

**Causes:**
1. ❌ Backend API not running → Start backend-api
2. ❌ Database not connected → Check PostgreSQL
3. ❌ Wrong API URL → Check `NEXT_PUBLIC_API_URL` in webapp/.env

**Debug steps:**
```bash
# 1. Check backend is running
curl http://localhost:4000/health

# 2. Check backend logs
cd backend-api
# Look at console output

# 3. Try registration via curl
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Error: "Module not found" in Python

**Solution:**
```bash
cd ai-engine
pip install -r requirements.txt
```

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Database connection
psql -h localhost -U humanwriter -d humanwriter -c "SELECT version();"

# 2. Backend API health
curl http://localhost:4000/health

# 3. AI Engine health
curl http://localhost:8000/health

# 4. Frontend accessible
curl -I http://localhost:3000

# 5. Try registration
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test1234"}'
```

All should return successful responses.

---

## 📝 Environment Variables

### Backend API (.env)
```env
DATABASE_URL="postgresql://humanwriter:humanwriter@localhost:5432/humanwriter"
JWT_SECRET="your-secret-key-min-32-characters-long"
PORT=4000
AI_ENGINE_URL="http://localhost:8000"
```

### Frontend (.env)
```env
DATABASE_URL="postgresql://humanwriter:humanwriter@localhost:5432/humanwriter"
NEXTAUTH_SECRET="this-is-a-very-long-secret-key-for-nextauth-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_AI_ENGINE_URL="http://localhost:8000"
```

### AI Engine (.env)
```env
DATABASE_URL="postgresql://humanwriter:humanwriter@localhost:5432/humanwriter"
ENVIRONMENT="development"
```

---

## 🎉 Success!

If all services are running, you should be able to:

1. ✅ Open http://localhost:3000
2. ✅ Click "Sign Up"
3. ✅ Register a new account
4. ✅ Login successfully
5. ✅ Access the dashboard
6. ✅ Generate humanized text

---

## 🆘 Need Help?

If you're still having issues:

1. Check the logs in `./logs/` directory
2. Verify all services are running with `ps aux | grep -E "node|python|postgres"`
3. Check ports with `lsof -i :3000 -i :4000 -i :8000 -i :5432`
4. Review the VALIDATION_FINAL_2026.md for system status

---

**System Status**: ✅ 95% Functional (as of validation)
**Last Updated**: January 22, 2026
