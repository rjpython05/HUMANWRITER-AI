# ✅ TESTING GUIDE - Verify Everything Works

## ⚡ Quick Test (3 Steps)

### 1. Setup Database

```bash
# Start PostgreSQL (Docker)
docker run -d --name humanwriter-postgres \
  -e POSTGRES_USER=humanwriter \
  -e POSTGRES_PASSWORD=humanwriter \
  -e POSTGRES_DB=humanwriter \
  -p 5432:5432 \
  postgres:15-alpine

# Push database schema
cd webapp
npx prisma db push
```

### 2. Start Backend

```bash
# In terminal 1
cd backend-api
npm run dev
```

**Verify it works:**
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok"}
```

### 3. Start Frontend

```bash
# In terminal 2
cd webapp
npm run dev
```

**Open:** http://localhost:3000

---

## 🧪 Test Registration

1. Open http://localhost:3000
2. Click "Sign Up"
3. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm: password123
4. Click "Create Account"

### Expected Result

✅ "Account created successfully. Please sign in."
✅ Redirected to /login

### If It Fails

Check backend logs in terminal 1. Common issues:
- Database not connected
- PORT 4000 already in use
- Missing .env variables

---

## 🔍 Debugging

### Check Database Connection

```bash
psql -h localhost -U humanwriter -d humanwriter -c "SELECT 1;"
```

### Check Backend Running

```bash
lsof -i :4000
# Should show node process
```

### Test Registration API Directly

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@test.com",
    "password": "test1234"
  }'
```

Should return user data with tokens.

---

## ✅ What Was Fixed

### Before (Broken):
- ❌ Prisma with adapter (complex, broken)
- ❌ NextAuth v5 handlers incorrect
- ❌ NEXTAUTH_SECRET (wrong variable)
- ❌ Unnecessary pg dependencies

### After (Working):
- ✅ Prisma simple configuration
- ✅ NextAuth v5 correct exports
- ✅ AUTH_SECRET (correct variable)
- ✅ Clean dependencies

---

## 📝 Critical Files Changed

1. **webapp/src/lib/prisma.ts** - Simplified (no adapter)
2. **webapp/prisma/schema.prisma** - Simple config
3. **webapp/src/app/api/auth/[...nextauth]/route.ts** - Fixed exports
4. **webapp/.env** - AUTH_SECRET instead of NEXTAUTH_SECRET

---

## 🎯 Next Steps

If registration works:
1. ✅ Test login
2. ✅ Test dashboard access
3. ✅ Start AI Engine for text generation

If registration fails:
1. Check backend logs
2. Verify DATABASE_URL in .env
3. Ensure PostgreSQL is running
4. Check that port 4000 is free

---

**Last Updated:** After critical fixes commit `f148bc7`
