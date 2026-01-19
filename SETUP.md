# 🚀 HUMANWRITER AI - Guía de Instalación Completa

Esta guía te llevará paso a paso para configurar todo el entorno de desarrollo de HumanWriter AI.

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Instalación Rápida](#instalación-rápida)
3. [Instalación Manual Detallada](#instalación-manual-detallada)
4. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
5. [Verificación de la Instalación](#verificación-de-la-instalación)
6. [Solución de Problemas](#solución-de-problemas)

## Prerrequisitos

### Software Requerido

- **Node.js**: v20.x o superior
- **Python**: v3.11 o superior
- **Docker**: v24.x o superior
- **Docker Compose**: v2.x o superior
- **Git**: v2.x o superior

### Hardware Mínimo

- **CPU**: Intel i7 o AMD Ryzen 7 (8+ cores recomendado)
- **RAM**: 16GB mínimo (32GB recomendado)
- **Almacenamiento**: 50GB libres SSD
- **Internet**: Conexión estable para descargas

### Verificar Instalaciones

```bash
# Node.js
node --version  # Debe mostrar v20.x.x o superior

# Python
python3 --version  # Debe mostrar 3.11.x o superior

# Docker
docker --version  # Debe mostrar 24.x.x o superior
docker-compose --version  # Debe mostrar 2.x.x o superior

# Git
git --version  # Debe mostrar 2.x.x o superior
```

Si alguno falta, instálalo antes de continuar.

## Instalación Rápida

Para una instalación automatizada completa:

```bash
# 1. Clonar el repositorio
git clone https://github.com/yourusername/humanwriter-ai.git
cd humanwriter-ai

# 2. Dar permisos de ejecución a scripts
chmod +x scripts/*.sh

# 3. Ejecutar setup automático
./scripts/setup.sh

# 4. Copiar variables de entorno
cp .env.example .env

# 5. Editar .env con tus valores (importante!)
nano .env  # o usa tu editor preferido

# 6. Iniciar servicios con Docker
docker-compose up -d

# 7. Esperar a que servicios estén listos (~2 minutos)
docker-compose logs -f

# 8. Ejecutar migraciones de base de datos
cd webapp
npx prisma generate
npx prisma migrate dev
cd ..

# 9. Iniciar aplicación en modo desarrollo
./scripts/start-dev.sh
```

🎉 ¡Listo! La aplicación debería estar corriendo en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001  
- AI Engine: http://localhost:8001
- ChromaDB: http://localhost:8000

## Instalación Manual Detallada

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/yourusername/humanwriter-ai.git
cd humanwriter-ai
```

### Paso 2: Instalar Ollama

Ollama es esencial para ejecutar los modelos LLM localmente.

#### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### macOS

```bash
brew install ollama
```

#### Windows

Descarga el instalador desde: https://ollama.com/download

#### Verificar Instalación

```bash
ollama --version
```

#### Iniciar Ollama Service

```bash
# Linux (systemd)
sudo systemctl start ollama
sudo systemctl enable ollama

# macOS
ollama serve &

# Windows
# Ollama se ejecuta automáticamente como servicio
```

### Paso 3: Descargar Modelo Base LLaMA

```bash
# Descargar LLaMA 3.1 8B (cuantizado Q4)
# Este proceso puede tardar 10-30 minutos dependiendo de tu conexión
ollama pull llama3.1:8b

# Verificar que el modelo se descargó correctamente
ollama list
```

Deberías ver algo como:
```
NAME            SIZE    MODIFIED
llama3.1:8b     4.7GB   2 minutes ago
```

### Paso 4: Configurar PostgreSQL con Docker

```bash
# Iniciar solo PostgreSQL primero
docker-compose up -d postgres

# Esperar 10 segundos para que PostgreSQL inicie
sleep 10

# Verificar que está corriendo
docker-compose ps postgres
```

Deberías ver:
```
NAME                STATUS              PORTS
postgres            Up About a minute   0.0.0.0:5432->5432/tcp
```

### Paso 5: Configurar Base de Datos con Prisma

```bash
cd webapp

# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones (crea tablas)
npx prisma migrate dev --name init

# Opcional: Abrir Prisma Studio para ver la base de datos
npx prisma studio
# Se abre en http://localhost:5555

cd ..
```

### Paso 6: Instalar Dependencias de Scraper

```bash
cd scraper
npm install
cd ..
```

### Paso 7: Instalar Dependencias de Backend API

```bash
cd backend-api
npm install
cd ..
```

### Paso 8: Configurar AI Engine (Python)

```bash
cd ai-engine

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
# Linux/macOS:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Desactivar entorno virtual (por ahora)
deactivate

cd ..
```

### Paso 9: Iniciar ChromaDB

```bash
docker-compose up -d chromadb

# Verificar
docker-compose ps chromadb
```

### Paso 10: Iniciar Redis

```bash
docker-compose up -d redis

# Verificar
docker-compose ps redis
```

### Paso 11: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env  # o tu editor preferido
```

**Variables críticas a configurar:**

```env
# Generar secret para NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Generar secret para JWT
JWT_SECRET=$(openssl rand -base64 32)

# Verificar que las URLs sean correctas
DATABASE_URL="postgresql://humanwriter:dev_password@localhost:5432/humanwriter_db"
NEXTAUTH_URL="http://localhost:3000"
API_URL="http://localhost:3001"
```

### Paso 12: Poblar Base de Datos (Seed)

```bash
cd webapp
npx prisma db seed
cd ..
```

Esto crea:
- Usuario admin por defecto (admin@humanwriter.ai / admin123)
- Algunas generaciones de ejemplo
- Métricas del sistema

### Paso 13: Iniciar Todos los Servicios

#### Opción A: Usar Docker Compose (Recomendado para producción)

```bash
docker-compose up -d

# Ver logs
docker-compose logs -f
```

#### Opción B: Modo Desarrollo (Mejor para desarrollo)

```bash
# Iniciar solo servicios de infraestructura con Docker
docker-compose up -d postgres redis chromadb

# Terminal 1: Backend API
cd backend-api
npm run dev

# Terminal 2: AI Engine
cd ai-engine
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate  # Windows
python src/main.py

# Terminal 3: Frontend
cd webapp
npm run dev

# Terminal 4: Scraper (opcional, solo cuando necesites scrapear)
cd scraper
npm run start
```

### Paso 14: Verificar que Todo Funciona

Abre tu navegador y visita:

1. **Frontend**: http://localhost:3000
   - Deberías ver la landing page

2. **Backend API Health Check**: http://localhost:3001/health
   - Deberías ver: `{"status":"ok"}`

3. **AI Engine Health Check**: http://localhost:8001/health
   - Deberías ver: `{"status":"healthy"}`

4. **ChromaDB**: http://localhost:8000/api/v1/heartbeat
   - Deberías ver: `{"nanosecond heartbeat": ...}`

## Configuración de Variables de Entorno

### Variables Esenciales

```env
# DATABASE (PostgreSQL)
DATABASE_URL="postgresql://humanwriter:dev_password@localhost:5432/humanwriter_db"
POSTGRES_USER="humanwriter"
POSTGRES_PASSWORD="dev_password"  # ¡CAMBIAR EN PRODUCCIÓN!
POSTGRES_DB="humanwriter_db"

# REDIS
REDIS_URL="redis://localhost:6379"

# CHROMADB
CHROMADB_HOST="localhost"
CHROMADB_PORT="8000"

# OLLAMA
OLLAMA_HOST="http://localhost:11434"
OLLAMA_NUM_PARALLEL="1"  # ¡IMPORTANTE para CPU limitado!
MODEL_NAME="llama3.1:8b"

# NEXTAUTH.JS
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""  # Generar con: openssl rand -base64 32

# API URLS
API_URL="http://localhost:3001"
AI_ENGINE_URL="http://localhost:8001"

# JWT
JWT_SECRET=""  # Generar con: openssl rand -base64 32
JWT_EXPIRES_IN="7d"

# APPLICATION
NODE_ENV="development"
APP_NAME="HumanWriter AI"
```

### Variables Opcionales (Futuro)

```env
# OAuth (cuando implementes login social)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Payments (cuando implementes monetización)
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""

# Cloud Storage (cuando migres a producción)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
S3_BUCKET="humanwriter-storage"
```

## Verificación de la Instalación

### Test Completo del Sistema

```bash
# 1. Verificar servicios Docker
docker-compose ps

# Todos deberían estar "Up"
# postgres    Up
# redis       Up  
# chromadb    Up

# 2. Test conexión a base de datos
cd webapp
npx prisma studio
# Debería abrir http://localhost:5555

# 3. Test API Backend
curl http://localhost:3001/health
# Respuesta: {"status":"ok"}

# 4. Test AI Engine
curl http://localhost:8001/health
# Respuesta: {"status":"healthy"}

# 5. Test Ollama
ollama list
# Debería mostrar llama3.1:8b

# 6. Test generación simple
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Escribe un párrafo sobre ingeniería","discipline":"ingenieria"}'

# Debería devolver texto generado
```

### Crear Usuario de Prueba

```bash
# Opción 1: Desde la interfaz web
# - Ir a http://localhost:3000/register
# - Llenar formulario
# - Iniciar sesión

# Opción 2: Desde Prisma Studio
# - Abrir http://localhost:5555
# - Ir a tabla "User"
# - Click "Add record"
# - Llenar datos (password debe estar hasheado con bcrypt)
```

### Primera Generación de Texto

1. Ir a http://localhost:3000/login
2. Iniciar sesión con usuario de prueba
3. Ir a http://localhost:3000/dashboard/generate
4. Escribir un prompt: "Escribe sobre la importancia de la ingeniería en la República Dominicana"
5. Seleccionar disciplina: "Ingeniería"
6. Click "Generar"
7. Esperar ~30-60 segundos (primera generación es más lenta)
8. Deberías ver el texto generado con métricas

## Solución de Problemas

### Problema: Ollama no responde

**Síntomas:**
- Error: "Connection refused to localhost:11434"
- AI Engine no puede generar texto

**Soluciones:**

```bash
# 1. Verificar que Ollama está corriendo
ps aux | grep ollama

# 2. Si no está corriendo, iniciarlo
# Linux:
sudo systemctl start ollama
# macOS:
ollama serve &

# 3. Verificar que el modelo está descargado
ollama list

# 4. Si no está, descargarlo
ollama pull llama3.1:8b

# 5. Test manual
ollama run llama3.1:8b "Hola"
```

### Problema: Error de memoria / OOM (Out of Memory)

**Síntomas:**
- Sistema se congela
- Error: "Killed" al ejecutar Ollama
- RAM al 100%

**Soluciones:**

```bash
# 1. Limitar workers de Ollama
export OLLAMA_NUM_PARALLEL=1

# 2. Usar modelo más pequeño o cuantizado
ollama pull llama3.1:8b-q4_K_M  # Más comprimido

# 3. Aumentar swap (Linux)
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 4. Cerrar aplicaciones innecesarias
# Ollama necesita ~6-8GB RAM para LLaMA 8B
```

### Problema: PostgreSQL no inicia

**Síntomas:**
- Error: "Connection refused to localhost:5432"
- Prisma no puede conectar

**Soluciones:**

```bash
# 1. Verificar que el contenedor está corriendo
docker-compose ps postgres

# 2. Ver logs del contenedor
docker-compose logs postgres

# 3. Si hay error de permisos
sudo chown -R $USER:$USER ./database

# 4. Reiniciar contenedor
docker-compose restart postgres

# 5. Si persiste, recrear
docker-compose down postgres
docker-compose up -d postgres

# 6. Verificar puerto no esté ocupado
sudo lsof -i :5432
# Si hay otro proceso, detenerlo o cambiar puerto
```

### Problema: Next.js no compila

**Síntomas:**
- Error en `npm run dev`
- Errores de TypeScript

**Soluciones:**

```bash
cd webapp

# 1. Limpiar cache
rm -rf .next node_modules

# 2. Reinstalar dependencias
npm install

# 3. Regenerar Prisma client
npx prisma generate

# 4. Verificar versión Node.js
node --version  # Debe ser v20.x+

# 5. Si persiste, instalar dependencias exactas
rm package-lock.json
npm install
```

### Problema: Scraper no descarga documentos

**Síntomas:**
- Error 403 Forbidden
- Error 429 Too Many Requests
- Timeouts

**Soluciones:**

```bash
cd scraper

# 1. Reducir concurrencia
# Editar config: MAX_CONCURRENT_SCRAPERS=2

# 2. Aumentar rate limit
# Editar config: RATE_LIMIT_MS=5000  # 5 segundos

# 3. Usar proxy (si es necesario)
# Agregar configuración de proxy en scrapers

# 4. Verificar conectividad
curl -I https://repositoriovip.uasd.edu.do

# 5. Ver logs detallados
npm run start -- --verbose
```

### Problema: ChromaDB no guarda embeddings

**Síntomas:**
- Error al crear collection
- RAG no funciona

**Soluciones:**

```bash
# 1. Verificar que ChromaDB está corriendo
docker-compose ps chromadb

# 2. Ver logs
docker-compose logs chromadb

# 3. Reiniciar
docker-compose restart chromadb

# 4. Si persiste, limpiar datos
docker-compose down chromadb
rm -rf chroma_data/
docker-compose up -d chromadb

# 5. Recrear collections
cd ai-engine
python src/vectorization/chromadb_client.py --recreate
```

### Problema: Fine-tuning falla en Colab

**Síntomas:**
- Error de memoria en Colab
- Kernel muere

**Soluciones:**

1. **Usar GPU más potente:**
   - Runtime → Change runtime type → GPU → A100

2. **Reducir batch size:**
   ```python
   # En notebook
   batch_size = 2  # En vez de 4
   gradient_accumulation_steps = 8
   ```

3. **Usar cuantización más agresiva:**
   ```python
   load_in_4bit = True
   bnb_4bit_compute_dtype = "float16"
   ```

4. **Reducir max sequence length:**
   ```python
   max_seq_length = 1024  # En vez de 2048
   ```

## Comandos Útiles

### Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f [servicio]

# Reiniciar servicio específico
docker-compose restart [servicio]

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra datos)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Ver uso de recursos
docker stats
```

### Base de Datos

```bash
# Abrir Prisma Studio
cd webapp && npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name [nombre_migracion]

# Resetear base de datos (¡CUIDADO!)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status

# Generar cliente Prisma después de cambios
npx prisma generate
```

### Ollama

```bash
# Listar modelos instalados
ollama list

# Ver info de un modelo
ollama show llama3.1:8b

# Eliminar modelo
ollama rm llama3.1:8b

# Test interactivo
ollama run llama3.1:8b

# Ver logs
journalctl -u ollama -f  # Linux
```

### Desarrollo

```bash
# Iniciar todo en modo desarrollo
./scripts/start-dev.sh

# Ejecutar scraping
./scripts/scrape.sh

# Preparar datos para fine-tuning
./scripts/prepare-finetune.sh

# Ver logs de todos los servicios
pm2 logs  # Si usas PM2

# Ejecutar tests
npm test
```

## Próximos Pasos

Una vez que tengas todo instalado y funcionando:

1. **Ejecutar el scraper** para recopilar corpus:
   ```bash
   cd scraper
   npm run start
   ```
   Ver [SCRAPER_GUIDE.md](./docs/SCRAPER_GUIDE.md) para más detalles.

2. **Generar tu primera texto académico**:
   - Ir a http://localhost:3000/dashboard/generate
   - Experimentar con diferentes prompts y disciplinas

3. **Explorar el Admin Panel**:
   - Ir a http://localhost:3000/dashboard/admin
   - Ver métricas del sistema
   - Gestionar corpus

4. **Preparar fine-tuning** una vez tengas suficiente corpus:
   ```bash
   ./scripts/prepare-finetune.sh
   ```
   Ver [FINE_TUNING_GUIDE.md](./docs/FINE_TUNING_GUIDE.md) para la guía completa.

## Recursos Adicionales

- [Documentación de Ollama](https://ollama.com/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [LangChain Docs](https://python.langchain.com/)

## Obtener Ayuda

Si encuentras problemas no cubiertos aquí:

1. Revisa los logs: `docker-compose logs -f`
2. Busca en GitHub Issues (futuro)
3. Contacta soporte: support@humanwriter.ai

---

**¡Feliz desarrollo!** 🚀
