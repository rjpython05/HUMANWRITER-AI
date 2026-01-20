# Security Quick Start Guide

## Immediate Actions Required

### 1. Generate Secure Secrets

**CRITICAL:** Before deploying to production, generate secure secrets:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32
```

Update your `.env` file with these values:

```env
JWT_SECRET="<paste generated secret here>"
NEXTAUTH_SECRET="<paste generated secret here>"
SESSION_SECRET="<paste generated secret here>"
```

### 2. Change Default Passwords

Update `.env` file:

```env
# Database
POSTGRES_PASSWORD="<strong password here>"

# Update DATABASE_URL with new password
DATABASE_URL="postgresql://humanwriter:<strong-password>@localhost:5432/humanwriter_db"
```

### 3. Run Security Setup

```bash
cd backend-api
chmod +x security-setup.sh
./security-setup.sh
```

### 4. Install Dependencies

```bash
# Backend API
cd backend-api
npm install

# AI Engine
cd ../ai-engine
pip install -r requirements.txt

# Web App
cd ../webapp
npm install
```

### 5. Security Checklist

- [ ] Generated strong JWT_SECRET (32+ characters)
- [ ] Generated strong NEXTAUTH_SECRET (32+ characters)
- [ ] Changed database password
- [ ] Updated CORS allowed origins
- [ ] Set NODE_ENV=production for production
- [ ] Enabled HTTPS/SSL
- [ ] Reviewed SECURITY.md
- [ ] Ran npm audit and fixed vulnerabilities
- [ ] Configured rate limiting
- [ ] Set up logging and monitoring

---

## Security Features Enabled

### Backend API (TypeScript/Express)

**New Security Middleware:**
- ✅ Input sanitization (XSS, NoSQL injection, SQL injection)
- ✅ Advanced security headers (HSTS, CSP, CORP, etc.)
- ✅ Suspicious pattern detection
- ✅ File upload sanitization

**Enhanced Features:**
- ✅ Bcrypt rounds increased to 12
- ✅ JWT secret validation
- ✅ Shorter access token expiry (15 min)
- ✅ Comprehensive error handling
- ✅ Rate limiting on all endpoints

**Configuration:**
- ✅ Centralized security config
- ✅ Password policy enforcement
- ✅ Brute force protection
- ✅ Audit logging ready

### AI Engine (Python/FastAPI)

**Enhanced Features:**
- ✅ Restricted CORS policy
- ✅ Configurable allowed origins
- ✅ Request validation with Pydantic
- ✅ Proper error handling

---

## New Files Created

### Middleware Files

1. **`/backend-api/src/middleware/security-headers.middleware.ts`**
   - Advanced security headers
   - CSP with nonce support
   - HSTS implementation
   - CORP, COEP, COOP headers

2. **`/backend-api/src/middleware/input-sanitization.middleware.ts`**
   - XSS protection
   - NoSQL injection prevention
   - SQL injection detection
   - Command injection detection
   - Path traversal protection
   - File upload sanitization

### Configuration Files

3. **`/backend-api/src/config/security.config.ts`**
   - Centralized security settings
   - Password policy
   - JWT configuration
   - Rate limiting config
   - CORS policy
   - File upload restrictions
   - And more...

### Documentation

4. **`/SECURITY.md`**
   - Complete security audit report
   - All vulnerabilities found and fixed
   - OWASP Top 10 compliance
   - Security best practices
   - Configuration details

5. **`/SECURITY_QUICK_START.md`** (this file)
   - Quick setup instructions
   - Security checklist

### Scripts

6. **`/backend-api/security-setup.sh`**
   - Automated security setup
   - Installs additional security packages
   - Creates git hooks
   - Validates environment

---

## Files Modified

### Backend API

1. **`/backend-api/src/app.ts`**
   - Added security headers middleware
   - Added input sanitization middleware
   - Added suspicious pattern detection

2. **`/backend-api/src/config/config.ts`**
   - Added JWT secret validation
   - Added environment variable validation
   - Improved security defaults

3. **`/backend-api/src/services/user.service.ts`**
   - Increased bcrypt rounds from 10 to 12
   - Enhanced password security

### AI Engine

4. **`/ai-engine/src/main.py`**
   - Restricted CORS to specific origins
   - Removed wildcard CORS

5. **`/ai-engine/src/config/settings.py`**
   - Added CORS configuration

### Configuration

6. **`/.env.example`**
   - Updated with security warnings
   - Changed default passwords
   - Added security settings

---

## Quick Commands

### Security Checks

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Run security setup script
cd backend-api && ./security-setup.sh

# Lint code
npm run lint

# Type check
npm run type-check
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Development

```bash
# Start backend API
cd backend-api && npm run dev

# Start AI Engine
cd ai-engine && python -m uvicorn src.main:app --reload

# Start webapp
cd webapp && npm run dev
```

### Production

```bash
# Build backend API
cd backend-api && npm run build

# Start backend API
npm start

# Start AI Engine
cd ../ai-engine
uvicorn src.main:app --host 0.0.0.0 --port 8001 --workers 4
```

---

## Environment Variables Reference

### Required (Critical)

```env
# Database
DATABASE_URL="postgresql://..."
POSTGRES_PASSWORD="<strong-password>"

# Authentication
JWT_SECRET="<32+ character secret>"
NEXTAUTH_SECRET="<32+ character secret>"

# Node Environment
NODE_ENV="production"
```

### Recommended

```env
# CORS
CORS_ORIGIN="https://yourdomain.com"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"

# Security
BCRYPT_ROUNDS="12"
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION="15"

# AI Engine
ALLOWED_ORIGINS="https://yourdomain.com,https://api.yourdomain.com"
```

---

## Security Monitoring

### Recommended Tools

1. **Snyk** - Vulnerability scanning
   ```bash
   npm install -g snyk
   snyk auth
   snyk test
   ```

2. **Sentry** - Error tracking
   - Sign up at sentry.io
   - Add SENTRY_DSN to .env

3. **Winston** - Logging (already configured)
   - Check logs in `/logs` directory

4. **npm audit** - Dependency scanning
   ```bash
   npm audit
   ```

---

## Testing Security

### Manual Testing

1. **Test Rate Limiting:**
   ```bash
   # Send multiple requests quickly
   for i in {1..10}; do curl http://localhost:3001/api/auth/login; done
   ```

2. **Test Input Sanitization:**
   ```bash
   # Try XSS payload
   curl -X POST http://localhost:3001/api/test \
     -H "Content-Type: application/json" \
     -d '{"input": "<script>alert(1)</script>"}'
   ```

3. **Test JWT Validation:**
   ```bash
   # Try invalid token
   curl http://localhost:3001/api/auth/me \
     -H "Authorization: Bearer invalid-token"
   ```

### Automated Testing

```bash
# Run test suite
npm test

# Run security-focused tests
npm run test:security
```

---

## Common Issues & Solutions

### Issue: JWT_SECRET validation error

**Solution:**
```bash
# Generate a new secret
openssl rand -base64 32

# Update .env
JWT_SECRET="<paste generated secret>"
```

### Issue: CORS errors in browser

**Solution:**
Update `CORS_ORIGIN` in `.env`:
```env
CORS_ORIGIN="http://localhost:3000,https://yourdomain.com"
```

### Issue: Rate limit too restrictive

**Solution:**
Adjust rate limits in `/backend-api/src/config/security.config.ts` or via environment variables.

### Issue: File upload rejected

**Solution:**
Check file type is in allowed list:
```env
ALLOWED_FILE_TYPES=".pdf,.docx,.doc,.txt"
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All secrets generated and configured
- [ ] Database passwords changed
- [ ] `NODE_ENV=production`
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] All tests passing
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

### Server Configuration

- [ ] HTTPS/SSL certificate installed
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Rate limiting configured for production load
- [ ] Log rotation set up
- [ ] Automated backups scheduled

### Security Headers

- [ ] HSTS enabled
- [ ] CSP configured for your domain
- [ ] CORS restricted to production origins
- [ ] Security headers verified

### Post-Deployment

- [ ] Monitor logs for errors
- [ ] Check security headers with securityheaders.com
- [ ] Test all endpoints
- [ ] Verify rate limiting
- [ ] Monitor resource usage

---

## Support & Resources

### Documentation

- **Full Security Policy:** `/SECURITY.md`
- **Architecture:** `/ARCHITECTURE.md`
- **Setup Guide:** `/SETUP.md`

### External Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Getting Help

- **Security Issues:** Create a private security advisory on GitHub
- **General Questions:** Open an issue on GitHub
- **Email:** security@humanwriter.ai

---

## Summary

Your HUMANWRITER AI system now has enterprise-grade security:

✅ **Input Validation** - All inputs sanitized and validated
✅ **Authentication** - Strong JWT with bcrypt password hashing
✅ **Authorization** - Role-based access control
✅ **Rate Limiting** - Protection against DDoS and brute force
✅ **Security Headers** - OWASP recommended headers
✅ **CORS Protection** - Restricted cross-origin requests
✅ **Error Handling** - No sensitive data leakage
✅ **Logging** - Comprehensive security event logging

**Next Steps:**
1. Complete the security checklist above
2. Run `./backend-api/security-setup.sh`
3. Review `/SECURITY.md` for detailed policies
4. Deploy with confidence!

---

**Security is a journey, not a destination. Keep your dependencies updated and monitor your logs regularly.**
