# 📘 HumanWriter AI - API Reference

Comprehensive documentation for HumanWriter AI REST API.

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.humanwriter.ai/api
```

## Authentication

All endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

Common HTTP Status Codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "clx123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "plan": "FREE"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh_token_here"
}
```

### POST /api/auth/login

Login with existing credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "clx123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "plan": "FREE"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh_token_here"
}
```

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`
```json
{
  "token": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

### GET /api/auth/me

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "clx123abc",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "plan": "FREE",
  "generationsCount": 45,
  "generationsThisMonth": 12,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Generation Endpoints

### POST /api/generate

Generate academic text from a prompt.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "prompt": "Escribe sobre la importancia de la ingeniería industrial en República Dominicana",
  "discipline": "INGENIERIA",
  "maxWords": 1000,
  "temperature": 0.7,
  "fromDocument": false
}
```

**Parameters:**
- `prompt` (string, required): Generation instruction
- `discipline` (enum, required): `INGENIERIA`, `CIENCIAS_SOCIALES`, `EXACTAS_NATURALES`, `AGRARIAS`
- `maxWords` (number, optional): Target word count (100-5000, default: 1000)
- `temperature` (number, optional): Creativity (0.1-1.0, default: 0.7)
- `fromDocument` (boolean, optional): Whether generating from uploaded document

**Response:** `201 Created`
```json
{
  "id": "gen_abc123",
  "status": "COMPLETED",
  "rawText": "La ingeniería industrial desempeña un papel crucial...",
  "humanizedText": "Fíjate que la ingeniería industrial, la verdad es que tiene...",
  "metrics": {
    "burstiness": 8.5,
    "humanizationScore": 87,
    "aiWordsCount": 2,
    "colloquialismsCount": 5,
    "sentenceVariation": {
      "min": 8,
      "max": 35,
      "avg": 18.5
    }
  },
  "duration": 5420,
  "tokensGenerated": 512,
  "createdAt": "2024-01-15T14:22:00Z"
}
```

### POST /api/generate/stream

Stream generation in real-time using Server-Sent Events (SSE).

**Headers:** 
- `Authorization: Bearer <token>`
- `Accept: text/event-stream`

**Request:** Same as `/api/generate`

**Response:** Server-Sent Events stream
```
data: {"type":"chunk","text":"La ingeniería"}

data: {"type":"chunk","text":" industrial"}

data: {"type":"complete","metrics":{...}}
```

### GET /api/generate/:id

Get a specific generation by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "gen_abc123",
  "prompt": "...",
  "discipline": "INGENIERIA",
  "rawText": "...",
  "humanizedText": "...",
  "metrics": {...},
  "duration": 5420,
  "createdAt": "2024-01-15T14:22:00Z"
}
```

### GET /api/history

Get generation history with pagination and filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `discipline` (enum, optional): Filter by discipline
- `search` (string, optional): Search in prompts and text
- `sortBy` (string, default: "createdAt"): Sort field
- `sortOrder` (string, default: "desc"): `asc` or `desc`

**Response:** `200 OK`
```json
{
  "generations": [
    {
      "id": "gen_abc123",
      "prompt": "...",
      "discipline": "INGENIERIA",
      "metrics": {...},
      "createdAt": "2024-01-15T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

## Corpus Endpoints

### POST /api/corpus/upload

Upload a document to expand the corpus.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:** Form data with file

**Response:** `201 Created`
```json
{
  "id": "doc_xyz789",
  "status": "PROCESSING",
  "message": "Document uploaded successfully and is being processed"
}
```

### GET /api/corpus

List corpus documents with filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `discipline` (enum, optional)
- `year` (number, optional)
- `validated` (boolean, optional)

**Response:** `200 OK`
```json
{
  "documents": [
    {
      "id": "doc_xyz789",
      "title": "Análisis de Producción Industrial...",
      "authors": ["Juan Pérez", "María García"],
      "year": 2015,
      "institution": "UASD",
      "discipline": "INGENIERIA",
      "wordCount": 8500,
      "validated": true,
      "createdAt": "2024-01-10T09:00:00Z"
    }
  ],
  "pagination": {...},
  "stats": {
    "total": 1050,
    "byDiscipline": {
      "INGENIERIA": 315,
      "CIENCIAS_SOCIALES": 315,
      "EXACTAS_NATURALES": 210,
      "AGRARIAS": 210
    }
  }
}
```

### GET /api/corpus/:id

Get document details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "doc_xyz789",
  "title": "...",
  "authors": [...],
  "year": 2015,
  "institution": "UASD",
  "source": "https://...",
  "discipline": "INGENIERIA",
  "subdiscipline": "Ingeniería Industrial",
  "language": "es",
  "keywords": ["industria", "producción"],
  "wordCount": 8500,
  "validated": true,
  "validationScore": 92.5,
  "vectorized": true,
  "createdAt": "2024-01-10T09:00:00Z"
}
```

### DELETE /api/corpus/:id

Delete a document (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Document deleted successfully"
}
```

---

## Admin Endpoints

All admin endpoints require `ADMIN` role.

### GET /api/admin/users

List all users with filters.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page`, `limit` (pagination)
- `role` (filter by role)
- `plan` (filter by plan)
- `search` (search by name/email)

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "plan": "FREE",
      "isActive": true,
      "generationsCount": 45,
      "createdAt": "2024-01-01T10:00:00Z",
      "lastLoginAt": "2024-01-15T14:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### PUT /api/admin/users/:id

Update user (change role, plan, status).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "role": "ADMIN",
  "plan": "PRO",
  "isActive": true
}
```

**Response:** `200 OK`
```json
{
  "message": "User updated successfully",
  "user": {...}
}
```

### GET /api/admin/metrics

Get system metrics.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `period` (string, optional): `hour`, `day`, `week`, `month`

**Response:** `200 OK`
```json
{
  "system": {
    "cpuUsage": 45.2,
    "ramUsage": 62.8,
    "diskUsage": 35.5
  },
  "application": {
    "totalUsers": 150,
    "activeUsers": 45,
    "totalGenerations": 2500,
    "generationsToday": 120,
    "apiCalls": 5000,
    "errors": 12,
    "avgResponseTime": 1250.5
  },
  "corpus": {
    "totalDocuments": 1050,
    "totalWords": 8500000,
    "byDiscipline": {...}
  },
  "aiEngine": {
    "avgGenerationTime": 5200.0,
    "ollamaUptime": 99.5
  }
}
```

### GET /api/admin/logs

Get application logs.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `level` (string, optional): `error`, `warn`, `info`, `debug`
- `limit` (number, default: 100)
- `offset` (number, default: 0)

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T14:22:30Z",
      "level": "INFO",
      "service": "backend-api",
      "message": "Generation completed successfully",
      "userId": "user_123",
      "generationId": "gen_abc123",
      "duration": 5420
    }
  ],
  "total": 5000
}
```

---

## Rate Limiting

Rate limits are applied per user:

**Free Plan:**
- 100 generations per month
- 60 API requests per minute
- 1000 API requests per day

**Pro Plan:**
- Unlimited generations
- 120 API requests per minute
- Unlimited daily requests

**Enterprise Plan:**
- Unlimited everything
- Dedicated resources

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1610000000
```

---

## Webhooks (Future)

Not yet implemented. Will be available in v1.1.

---

## Code Examples

### JavaScript/TypeScript

```typescript
const API_URL = 'http://localhost:3001/api';
const token = 'your_jwt_token';

// Generate text
async function generateText() {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Escribe sobre ingeniería industrial',
      discipline: 'INGENIERIA',
      maxWords: 500,
    }),
  });
  
  const data = await response.json();
  console.log(data.humanizedText);
}
```

### Python

```python
import requests

API_URL = 'http://localhost:3001/api'
token = 'your_jwt_token'

def generate_text():
    response = requests.post(
        f'{API_URL}/generate',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        json={
            'prompt': 'Escribe sobre ingeniería industrial',
            'discipline': 'INGENIERIA',
            'maxWords': 500,
        }
    )
    
    data = response.json()
    print(data['humanizedText'])
```

### cURL

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Escribe sobre ingeniería industrial",
    "discipline": "INGENIERIA",
    "maxWords": 500
  }'
```

---

## Changelog

### v1.0.0 (2024-01-19)
- Initial API release
- Authentication endpoints
- Generation endpoints
- Corpus management
- Admin endpoints

---

For issues or questions, contact: api@humanwriter.ai
