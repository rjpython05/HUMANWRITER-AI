# 🎓 HUMANWRITER AI

**Sistema avanzado de generación de texto académico indetectable por detectores de IA**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-20.x-brightgreen.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)

## 📋 Descripción

HUMANWRITER AI es una aplicación web completa que genera texto académico 100% indetectable por detectores de IA mediante:

- ✅ Corpus de 1,000+ documentos académicos dominicanos (1990-2021)
- ✅ Fine-tuning de LLaMA 3.1 8B con contenido académico real
- ✅ Sistema avanzado de humanización post-procesamiento
- ✅ 4 modelos especializados por disciplina académica
- ✅ Auto-perfeccionamiento continuo con nuevo contenido
- ✅ Interfaz web profesional lista para monetización

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- Next.js 14 (App Router) + React 18 + TypeScript
- TailwindCSS + shadcn/ui components
- NextAuth.js v5 para autenticación

**Backend:**
- Node.js + Express (API Gateway)
- Python FastAPI (AI Engine)
- PostgreSQL 15 + pgvector
- ChromaDB (Vector Database)
- Redis (Cache/Queue)

**IA/ML:**
- Ollama (Runtime local)
- LLaMA 3.1 8B Q4_K_M
- Unsloth + LoRA (Fine-tuning)
- sentence-transformers (Embeddings)
- LangChain + ChromaDB (RAG)

**Infraestructura:**
- Docker + Docker Compose
- Nginx (Reverse Proxy)

## 🚀 Quick Start

### Prerrequisitos

- Node.js 20.x o superior
- Python 3.11 o superior
- Docker y Docker Compose
- 16GB RAM mínimo
- 50GB espacio en disco

### Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/yourusername/humanwriter-ai.git
cd humanwriter-ai

# 2. Ejecutar setup automático
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Iniciar servicios con Docker
docker-compose up -d

# 5. Ejecutar migraciones de base de datos
cd webapp && npx prisma migrate dev && cd ..

# 6. Iniciar aplicación en desarrollo
./scripts/start-dev.sh
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- AI Engine: http://localhost:8001
- ChromaDB: http://localhost:8000

### Instalación Manual

Ver [SETUP.md](./SETUP.md) para instrucciones detalladas paso a paso.

## 📚 Documentación

- **[SETUP.md](./docs/SETUP_GUIDE.md)** - Guía de instalación detallada
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura del sistema
- **[SCRAPER_GUIDE.md](./docs/SCRAPER_GUIDE.md)** - Guía del sistema de scraping
- **[FINE_TUNING_GUIDE.md](./docs/FINE_TUNING_GUIDE.md)** - Guía de fine-tuning
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - Documentación de la API
- **[USER_MANUAL.md](./docs/USER_MANUAL.md)** - Manual de usuario

## 🎯 Características Principales

### Core Features

- **Generación desde prompt libre**: Escribe un prompt y genera texto académico
- **Generación desde documento base**: Upload DOCX/PDF con instrucciones de modificación
- **Upload de documentos**: Amplía el corpus automáticamente
- **Dashboard con métricas**: Burstiness, score humanización, palabras IA detectadas
- **Historial completo**: Búsqueda y filtros de todas las generaciones
- **Comparación lado a lado**: Original vs humanizado
- **Exportación múltiple**: DOCX, PDF, TXT, MD
- **Editor WYSIWYG**: Post-edición manual integrada
- **Sistema de "voces"**: 4 modelos especializados por disciplina
- **API REST completa**: Documentada con OpenAPI/Swagger

### Admin Features

- Panel de administración de usuarios
- Dashboard de métricas del sistema
- Gestión del corpus académico
- Logs de generaciones y errores
- Sistema de roles y permisos

### Auto-perfeccionamiento

- Fine-tuning automático cada 50 documentos nuevos
- Active learning: detección de gaps en conocimiento
- Sistema de feedback de usuarios
- Re-entrenamiento incremental sin pérdida

## 📂 Estructura del Proyecto

```
humanwriter-ai/
├── scraper/              # Sistema de scraping (Node.js + Puppeteer)
├── ai-engine/            # Motor IA (Python FastAPI + Ollama)
├── webapp/               # Frontend (Next.js 14 + React)
├── backend-api/          # API Gateway (Node.js + Express)
├── database/             # Schemas y migraciones SQL
├── scripts/              # Scripts de utilidad
├── docs/                 # Documentación detallada
└── docker-compose.yml    # Orquestación de servicios
```

## 🔧 Comandos Principales

```bash
# Desarrollo
npm run dev              # Iniciar todos los servicios en dev mode
npm run scrape           # Ejecutar scraping de documentos
npm run fine-tune        # Preparar datos para fine-tuning

# Docker
docker-compose up -d     # Iniciar servicios
docker-compose down      # Detener servicios
docker-compose logs -f   # Ver logs en tiempo real

# Base de datos
cd webapp && npx prisma studio    # Abrir Prisma Studio
cd webapp && npx prisma migrate   # Ejecutar migraciones

# Testing
npm test                 # Ejecutar tests
npm run test:e2e         # Tests end-to-end
```

## 📊 Corpus Académico

### Target
- **1,000+ documentos** académicos dominicanos
- **Período**: 1990-2021 (pre-ChatGPT)
- **Idiomas**: Español (primario) + Inglés (autores latinos)

### Distribución
- 30% Ingeniería (Industrial, Sistemas)
- 30% Ciencias Sociales (Economía, Sociología, Derecho)
- 20% Ciencias Exactas/Naturales (Matemáticas, Física, Química)
- 20% Ciencias Agrarias (Agronomía, Recursos Naturales)

### Fuentes
- Universidades TOP RD (UASD, PUCMM, INTEC, UNPHU, UAPA, UNIBE)
- Instituciones gubernamentales (BCRD, ONE, Ministerios)
- Organismos internacionales (CEPAL, BID, Banco Mundial, FMI, FAO)
- Journals académicos (Latindex, SciELO, Redalyc)

## 🤖 Sistema de Humanización

### Pipeline de Post-procesamiento

1. **Ajuste de Burstiness**: Variar longitud de oraciones (target σ > 8.0)
2. **Coloquialismos dominicanos**: Inyección natural (5% frecuencia)
3. **Pensamiento visible**: Marcadores de reflexión (3% frecuencia)
4. **Aproximadores**: Reemplazo de números exactos (8% frecuencia)
5. **Admisiones de incertidumbre**: Expresiones humanas (4% frecuencia)
6. **Imperfecciones controladas**: Repeticiones naturales (5% frecuencia)

### Palabras Prohibidas

El sistema evita automáticamente palabras típicas de IA:
- delve, crucial, vital, robust, comprehensive
- cutting-edge, groundbreaking, state-of-the-art
- landscape, tapestry, realm, leverage, unlock

## 📈 Métricas de Validación

- **Burstiness Score**: Desviación estándar longitud oraciones (>8.0 óptimo)
- **Humanization Score**: 0-100 basado en múltiples factores
- **AI Words Count**: Detección de palabras típicas de IA
- **Colloquialisms Count**: Frecuencia de expresiones naturales
- **Sentence Variation**: Rango de longitudes (cortas <10, largas >30)

## 🔐 Autenticación y Roles

### Roles Disponibles
- **Guest**: Solo visualización landing page
- **User**: Generación de texto (límite según plan)
- **Admin**: Acceso completo panel administración

### Planes (Preparado para Monetización)
- **Free**: 100 generaciones/mes
- **Pro**: Ilimitado + modelos especializados
- **Enterprise**: API access + soporte dedicado

## 🚀 Roadmap

### v1.0 (Actual)
- [x] Sistema de generación básico
- [x] Corpus de 1,000+ documentos
- [x] 4 modelos especializados
- [x] Dashboard y admin panel
- [x] Sistema de humanización

### v1.1 (Próximo)
- [ ] OAuth providers (Google, GitHub)
- [ ] Sistema de pagos con Stripe
- [ ] API pública con rate limiting
- [ ] Exportación avanzada (LaTeX)
- [ ] Detección plagio integrada

### v2.0 (Futuro)
- [ ] Migración a cloud (Vercel + Supabase + RunPod)
- [ ] Modelos más grandes (70B+)
- [ ] Soporte para más idiomas
- [ ] Colaboración en tiempo real
- [ ] Plugin para Microsoft Word

## 🤝 Contribuir

Este es un proyecto privado. Para reportar bugs o sugerir features, contacta al equipo de desarrollo.

## 📄 Licencia

MIT License - Ver [LICENSE](./LICENSE) para más detalles.

## 🛠️ Soporte Técnico

### Hardware Recomendado
- **CPU**: Intel i7 o superior (mínimo 8 cores)
- **RAM**: 16GB mínimo, 32GB recomendado
- **GPU**: No requerida para inferencia (Ollama optimizado CPU)
- **Storage**: 50GB SSD mínimo

### Solución de Problemas Comunes

**Ollama no inicia:**
```bash
# Verificar instalación
ollama --version

# Reiniciar servicio
sudo systemctl restart ollama

# Ver logs
journalctl -u ollama -f
```

**Error de memoria:**
```bash
# Limitar workers de Ollama
export OLLAMA_NUM_PARALLEL=1
```

**PostgreSQL connection error:**
```bash
# Verificar servicio
docker-compose ps postgres

# Reiniciar
docker-compose restart postgres
```

Ver [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) para más información.

## 📞 Contacto

- **Website**: https://humanwriter.ai
- **Email**: support@humanwriter.ai
- **GitHub**: https://github.com/yourusername/humanwriter-ai

---

**Desarrollado con ❤️ para la comunidad académica dominicana**

© 2024 HumanWriter AI. Todos los derechos reservados.