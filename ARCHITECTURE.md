# 🏗️ HUMANWRITER AI - Arquitectura del Sistema

## Visión General

HumanWriter AI es un sistema distribuido basado en microservicios que combina scraping web, procesamiento NLP, fine-tuning de LLMs, vectorización RAG y generación de texto humanizado.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                   (Next.js 14 + React 18)                       │
│          Browser ──────────── Web Application                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│                  (Node.js + Express + TypeScript)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth       │  │  Generation  │  │   Corpus     │         │
│  │ Middleware   │  │  Controller  │  │ Controller   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────┬──────────────┬──────────────┬──────────────────┘
               │              │              │
    ┌──────────┘              │              └──────────┐
    ▼                         ▼                         ▼
┌─────────┐           ┌──────────────┐          ┌─────────────┐
│PostgreSQL│◄──────────┤  AI ENGINE   │◄─────────┤  ChromaDB   │
│  +pgvector│          │ (FastAPI)    │          │  (Vectors)  │
└─────────┘           │              │          └─────────────┘
                      │  ┌────────┐  │
                      │  │ Ollama │  │
                      │  │LLaMA 8B│  │
                      │  └────────┘  │
                      │              │
                      │ Humanization │
                      │  Pipeline    │
                      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │    Redis     │
                      │  (Cache)     │
                      └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SCRAPING LAYER                             │
│                  (Node.js + Puppeteer)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Universidad│  │Instituciones│ │Organismos│  │ Journals │      │
│  │ Scrapers │  │ Scrapers   │ │ Scrapers │  │ Scrapers │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│        │              │              │              │           │
│        └──────────────┴──────────────┴──────────────┘           │
│                            │                                    │
│                     ┌──────▼────────┐                          │
│                     │  Processors   │                          │
│                     │ (PDF, DOCX)   │                          │
│                     └──────┬────────┘                          │
│                            │                                    │
│                     ┌──────▼────────┐                          │
│                     │  Classifier   │                          │
│                     │  (ML-based)   │                          │
│                     └──────┬────────┘                          │
│                            │                                    │
│                            ▼                                    │
│                    ┌───────────────┐                           │
│                    │   Storage     │                           │
│                    │  (Filesystem) │                           │
│                    └───────────────┘                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  FINE-TUNING LAYER (Google Colab)               │
│                                                                 │
│  Corpus Data ──► Prepare Dataset ──► Unsloth + LoRA ──►        │
│  ──► Train (3 epochs) ──► Merge Adapters ──► Export GGUF ──►   │
│  ──► Download ──► Load to Ollama                               │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos Principal

### 1. Flujo de Scraping y Preparación de Corpus

```
1. Scraper ejecuta → Puppeteer navega sitios web
2. Descarga PDFs/DOCX → Guarda en /data/raw
3. Processor extrae texto → Limpia contenido
4. Classifier analiza → Determina disciplina
5. Metadata Extractor → Guarda JSON metadata
6. Vectorizer → Genera embeddings
7. ChromaDB → Almacena vectores + metadata
8. PostgreSQL → Guarda registro documento
```

### 2. Flujo de Generación de Texto

```
Usuario envía prompt
    │
    ▼
Next.js API Route (/api/generate)
    │
    ▼
Backend API Gateway (validación + auth)
    │
    ▼
AI Engine FastAPI
    │
    ├─► 1. Voice Selector (selecciona modelo por disciplina)
    │
    ├─► 2. RAG Retrieval (busca contexto en ChromaDB)
    │       │
    │       └─► Top 5 documentos similares
    │
    ├─► 3. Prompt Builder (construye prompt dinámico)
    │       │
    │       └─► Inyecta contexto + instrucciones
    │
    ├─► 4. Ollama Client (genera texto)
    │       │
    │       └─► LLaMA 3.1 8B fine-tuned
    │
    ├─► 5. Humanization Pipeline
    │       │
    │       ├─► Adjust Burstiness
    │       ├─► Inject Colloquialisms
    │       ├─► Add Thinking Markers
    │       ├─► Replace Approximators
    │       ├─► Add Uncertainty
    │       └─► Inject Imperfections
    │
    ├─► 6. Validation & Metrics
    │       │
    │       └─► Calculate scores
    │
    └─► 7. Return Response
            │
            ▼
Backend API → Guarda en PostgreSQL
            │
            ▼
Next.js → Renderiza resultado
```

### 3. Flujo de Upload y Auto-mejora

```
Usuario sube documento nuevo
    │
    ▼
Backend API → Valida archivo
    │
    ▼
Processor → Extrae texto + metadata
    │
    ▼
Classifier → Determina disciplina
    │
    ▼
Vectorizer → Genera embeddings
    │
    ▼
ChromaDB + PostgreSQL → Almacena
    │
    ▼
Counter check → ¿50 documentos nuevos?
    │
    ├─► NO: Continue
    │
    └─► YES: Trigger Fine-tuning
            │
            ▼
        Prepare Dataset (Alpaca format)
            │
            ▼
        Upload to Google Colab
            │
            ▼
        Execute Fine-tuning Notebook
            │
            ▼
        Download New Model (GGUF)
            │
            ▼
        Load to Ollama (hot swap)
```

## Componentes Detallados

### Frontend (Next.js 14)

**Tecnologías:**
- Next.js 14 con App Router
- React 18 + TypeScript
- TailwindCSS + shadcn/ui
- React Hook Form + Zod
- NextAuth.js v5
- Zustand (estado global)

**Estructura de rutas:**
```
/                           Landing page (público)
/login                      Autenticación
/register                   Registro
/dashboard                  Dashboard principal (protegido)
/dashboard/generate         Generación de texto
/dashboard/history          Historial generaciones
/dashboard/corpus           Gestión corpus
/dashboard/settings         Configuración usuario
/dashboard/admin/*          Panel administración (solo admin)
```

**Server Components vs Client Components:**
- Layouts, páginas estáticas → Server Components
- Formularios, interacciones → Client Components
- API calls → Server Actions + Route Handlers

### Backend API Gateway (Node.js + Express)

**Responsabilidades:**
- Autenticación y autorización (JWT)
- Validación de requests
- Rate limiting
- Proxy a AI Engine
- Gestión de archivos
- Logging y monitoring
- Gestión de usuarios

**Endpoints principales:**
```typescript
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh

POST   /api/generate
POST   /api/generate/stream
GET    /api/generate/:id

POST   /api/corpus/upload
GET    /api/corpus
GET    /api/corpus/:id
DELETE /api/corpus/:id

GET    /api/history
GET    /api/history/:id

GET    /api/admin/users
PUT    /api/admin/users/:id
GET    /api/admin/metrics
GET    /api/admin/logs
```

### AI Engine (Python FastAPI)

**Responsabilidades:**
- Comunicación con Ollama
- RAG (Retrieval Augmented Generation)
- Humanización post-procesamiento
- Cálculo de métricas
- Gestión de modelos especializados
- Active learning

**Endpoints:**
```python
POST   /generate
POST   /generate/stream
POST   /humanize
GET    /models
GET    /models/{model_name}/info
POST   /embeddings
POST   /rag/search
GET    /metrics/{generation_id}
POST   /feedback
GET    /health
```

**Modelos disponibles:**
```python
{
    "base": "humanwriter-base:8b",
    "ingenieria": "humanwriter-ing:8b",
    "ciencias_sociales": "humanwriter-sociales:8b",
    "exactas_naturales": "humanwriter-exactas:8b",
    "agrarias": "humanwriter-agrarias:8b"
}
```

### Scraper System (Node.js + Puppeteer)

**Arquitectura:**
```
Orchestrator (index.ts)
    │
    ├─► Source Config Loader
    │
    ├─► Scraper Factory
    │       │
    │       ├─► Universidad Scrapers (6 scrapers)
    │       ├─► Institución Scrapers (3 scrapers)
    │       ├─► Organismo Scrapers (6 scrapers)
    │       └─► Journal Scrapers (3 scrapers)
    │
    ├─► Rate Limiter (queue + delay)
    │
    ├─► Retry Handler (max 3 retries)
    │
    └─► Progress Tracker (checkpoints)
```

**Base Scraper Class:**
```typescript
abstract class BaseScraper {
    abstract scrape(): Promise<Document[]>;
    protected downloadPDF(url: string): Promise<Buffer>;
    protected extractMetadata(page: Page): Promise<Metadata>;
    protected validateDocument(doc: Document): boolean;
    protected handleError(error: Error): void;
}
```

### Database Schema (PostgreSQL + Prisma)

**Modelos principales:**
- `User`: Usuarios del sistema
- `Generation`: Historial de generaciones
- `Document`: Corpus académico
- `Feedback`: Feedback de usuarios
- `SystemMetric`: Métricas del sistema
- `FineTuningJob`: Jobs de fine-tuning

**Relaciones:**
```
User 1──N Generation
User 1──N Feedback
Generation 1──N Feedback
Document 1──1 Embedding (en ChromaDB)
```

### Vector Database (ChromaDB)

**Collections:**
- `corpus_full`: Todos los documentos completos
- `corpus_chunks`: Chunks de 500 palabras
- `corpus_ingenieria`: Solo ingeniería
- `corpus_sociales`: Solo ciencias sociales
- `corpus_exactas`: Solo exactas
- `corpus_agrarias`: Solo agrarias

**Metadata almacenada:**
```json
{
    "document_id": "uuid",
    "title": "string",
    "discipline": "enum",
    "year": "number",
    "institution": "string",
    "language": "string",
    "word_count": "number"
}
```

## Seguridad

### Autenticación

**JWT + Refresh Tokens:**
```
1. Usuario login → Backend valida credenciales
2. Backend genera: 
   - Access Token (7 días, almacenado en httpOnly cookie)
   - Refresh Token (30 días, almacenado en DB)
3. Frontend hace requests con Access Token
4. Al expirar Access Token → Usa Refresh Token
5. Backend valida Refresh Token → Genera nuevo Access Token
```

**NextAuth.js v5 Integration:**
```typescript
// Providers: Credentials (actual) + Google/GitHub (futuro)
// Strategy: JWT
// Session: Database-backed
// Callbacks: Custom role/permissions handling
```

### Autorización

**Role-based Access Control (RBAC):**
```typescript
enum Role {
    GUEST,   // Solo landing page
    USER,    // Generación texto (límites según plan)
    ADMIN    // Acceso completo
}

enum Permission {
    GENERATE_TEXT,
    UPLOAD_DOCUMENT,
    VIEW_HISTORY,
    MANAGE_USERS,
    MANAGE_CORPUS,
    VIEW_METRICS,
    TRIGGER_FINE_TUNING
}
```

### Validación

**Input Validation:**
- Zod schemas en frontend
- Express-validator en backend
- Pydantic models en AI Engine

**File Upload Security:**
- Validación tipo MIME
- Validación tamaño (max 50MB)
- Scan antivirus (futuro)
- Sanitización nombres archivo

## Escalabilidad

### Fase Local (Actual)

**Limitaciones:**
- CPU: Intel i7-1255U (inferencia lenta pero funcional)
- RAM: 16GB (suficiente para modelo 8B Q4)
- Ollama workers: 1 (sequential processing)
- Concurrencia: ~5-10 usuarios simultáneos

**Optimizaciones:**
- Modelo cuantizado Q4_K_M (reduce RAM usage)
- Redis caching (generaciones repetidas)
- PostgreSQL indexing (queries rápidos)
- Connection pooling (Prisma)

### Fase Producción (Futuro)

**Migración a Cloud:**

**Frontend:**
- Vercel (Next.js hosting optimizado)
- CDN global (edge functions)

**Backend:**
- Railway o Render (API Gateway)
- Auto-scaling (CPU-based)

**Database:**
- Supabase (PostgreSQL managed)
- pgvector extension habilitado
- Automated backups

**AI Engine:**
- RunPod GPU (A40/A100)
- Modelo 8B Q8 o 70B Q4
- Multiple workers (parallel processing)

**Storage:**
- AWS S3 (archivos corpus)
- CloudFront CDN (serving rápido)

**Vector DB:**
- ChromaDB hosted o Pinecone
- Replicación multi-región

## Monitoreo y Logging

### Logging Structure

**Niveles:**
- ERROR: Errores críticos que requieren atención
- WARN: Advertencias, comportamiento inesperado
- INFO: Eventos importantes (logins, generaciones)
- DEBUG: Información detallada para debugging

**Formato:**
```json
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO",
    "service": "ai-engine",
    "message": "Text generated successfully",
    "userId": "user-123",
    "generationId": "gen-456",
    "duration": 5420,
    "metadata": {
        "discipline": "ingenieria",
        "wordCount": 1500
    }
}
```

### Métricas a Monitorear

**Sistema:**
- CPU usage
- RAM usage
- Disk usage
- Network I/O

**Aplicación:**
- API response time
- Error rate
- Request rate
- Active users

**AI Engine:**
- Generation time (p50, p95, p99)
- Humanization score average
- Model loading time
- Cache hit rate

**Database:**
- Query time
- Connection pool usage
- Slow queries
- Deadlocks

## Performance Optimization

### Backend API

**Caching Strategy:**
```typescript
// Redis caching para queries frecuentes
cache.set(`corpus:stats`, data, { ttl: 3600 });
cache.set(`user:${userId}:generations`, data, { ttl: 300 });

// Cache invalidation
onNewGeneration(() => cache.del(`user:${userId}:generations`));
onCorpusUpdate(() => cache.del('corpus:stats'));
```

**Database Query Optimization:**
```sql
-- Indexes críticos
CREATE INDEX idx_documents_discipline ON documents(discipline);
CREATE INDEX idx_generations_user_created ON generations(user_id, created_at DESC);
CREATE INDEX idx_documents_year ON documents(year);

-- Partial indexes
CREATE INDEX idx_documents_validated ON documents(validated) WHERE validated = true;
```

### AI Engine

**Model Loading:**
```python
# Preload todos los modelos en memoria al startup
# Trade-off: Mayor RAM usage pero respuesta instantánea
models = {
    "base": load_model("humanwriter-base:8b"),
    "ingenieria": load_model("humanwriter-ing:8b"),
    # ...
}

# Alternativamente: Load on-demand con LRU cache
@lru_cache(maxsize=2)  # Solo 2 modelos en memoria
def get_model(name: str):
    return load_model(name)
```

**Streaming Response:**
```python
# Streaming para UX mejorada (usuario ve texto generándose)
async def generate_stream(prompt: str):
    async for chunk in ollama.generate_stream(prompt):
        yield f"data: {chunk}\n\n"
```

### Frontend

**Code Splitting:**
```typescript
// Lazy loading de páginas admin (solo admins las descargan)
const AdminPanel = dynamic(() => import('./admin/panel'), {
    loading: () => <Spinner />,
    ssr: false
});
```

**Image Optimization:**
```typescript
import Image from 'next/image';

// Next.js optimiza automáticamente
<Image src="/logo.png" width={200} height={100} alt="Logo" />
```

## Disaster Recovery

### Backup Strategy

**Database:**
- Daily automated backups (PostgreSQL dump)
- Retention: 30 días
- Restore time: ~30 minutos

**Corpus:**
- Weekly backup de /data/raw y /data/processed
- Almacenado en S3 (futuro) o disco externo (actual)
- Retention: 90 días

**Models:**
- Backup de modelos fine-tuned (.gguf files)
- Version control (guardar checkpoints)
- Almacenado en S3 + local

### Recovery Procedures

**Database corruption:**
```bash
# 1. Stop services
docker-compose down

# 2. Restore from backup
pg_restore -d humanwriter_db backup.dump

# 3. Verify integrity
psql -d humanwriter_db -c "SELECT COUNT(*) FROM documents;"

# 4. Restart services
docker-compose up -d
```

**Ollama model loss:**
```bash
# 1. Re-download base model
ollama pull llama3.1:8b

# 2. Restore fine-tuned model from backup
cp backup/humanwriter-base.gguf ~/.ollama/models/

# 3. Load model
ollama run humanwriter-base:8b
```

## Testing Strategy

### Unit Tests

**Backend API:**
```typescript
// Jest + Supertest
describe('Generation Controller', () => {
    test('should create generation', async () => {
        const res = await request(app)
            .post('/api/generate')
            .send({ prompt: 'Test', discipline: 'ingenieria' });
        expect(res.status).toBe(201);
    });
});
```

**AI Engine:**
```python
# pytest
def test_humanization_pipeline():
    text = "This is a test sentence."
    result = humanize_text(text, "ingenieria")
    assert len(result) > 0
    assert calculate_burstiness(result) > 5.0
```

### Integration Tests

**End-to-end flow:**
```typescript
// Playwright
test('complete generation flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/dashboard/generate');
    await page.fill('textarea[name="prompt"]', 'Escribe sobre ingeniería');
    await page.click('button:text("Generar")');
    
    await expect(page.locator('.generation-result')).toBeVisible();
});
```

## Anexos

### Tech Stack Versions

```json
{
    "frontend": {
        "next": "14.0.4",
        "react": "18.2.0",
        "typescript": "5.3.3",
        "tailwindcss": "3.4.0"
    },
    "backend": {
        "node": "20.10.0",
        "express": "4.18.2",
        "prisma": "5.7.1",
        "typescript": "5.3.3"
    },
    "ai-engine": {
        "python": "3.11.7",
        "fastapi": "0.108.0",
        "langchain": "0.1.0",
        "chromadb": "0.4.22"
    },
    "infrastructure": {
        "docker": "24.0.7",
        "docker-compose": "2.23.3",
        "postgresql": "15.5",
        "redis": "7.2.3"
    }
}
```

### External Services

**Google Colab Pro:**
- GPU: T4 o A100 (según disponibilidad)
- RAM: 25GB (T4) o 40GB (A100)
- Tiempo estimado fine-tuning: 2-4 horas
- Costo: $9.99/mes

**Ollama:**
- Versión: Latest
- Modelos soportados: LLaMA, Mistral, etc.
- Quantization: Q4_K_M (recomendado para CPU)

---

**Última actualización:** 2024-01-19  
**Versión:** 1.0.0
