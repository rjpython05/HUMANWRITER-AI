# Actualización de Dependencias a 2026

**Fecha de actualización:** 22 de Enero de 2026
**Estado:** ✅ Completado

---

## Resumen Ejecutivo

Se han actualizado TODAS las dependencias del proyecto HUMANWRITER-AI a sus versiones más recientes disponibles en 2026. Esta actualización incluye:

- **Frontend (webapp):** Next.js 16, React 19, Prisma 7
- **Backend API:** Prisma 7, últimas versiones de Express y librerías de seguridad
- **AI Engine:** FastAPI 0.128, LangChain 1.2, Pydantic v2.13
- **Scraper:** Puppeteer 24.35, últimas versiones de todas las herramientas

---

## 1. Frontend (webapp/package.json)

### Frameworks Core

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **next** | 14.0.4 | **16.1.0** | ⬆️ +2 versiones mayores |
| **react** | 18.2.0 | **19.2.0** | ⬆️ +1 versión mayor |
| **react-dom** | 18.2.0 | **19.2.0** | ⬆️ +1 versión mayor |

#### 🚨 Breaking Changes - Next.js 16

- **Turbopack File System Caching:** Ahora estable en `next dev`
- **Cache Components:** Nuevo modelo de programación con PPR (Partial Pre-Rendering)
- **Build Adapters API:** Facilita integración con hosting providers
- **Security Fixes:** CVE-2025-55184 (DoS) y CVE-2025-55183 (Source Code Exposure)
- **Requiere React 19.x**

#### 🚨 Breaking Changes - React 19

- **ref como prop:** Ya no necesitas `forwardRef`, ref es accesible como prop normal
- **React Server Components:** Ahora estables, no romperán entre versiones menores
- **Server Actions:** Componentes cliente pueden llamar funciones async del servidor con `"use server"`
- **Activity Component:** Modos `visible` y `hidden` para pre-renderizado más rápido

### Database & ORM

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **@prisma/client** | 5.7.1 | **7.1.0** | ⬆️ +2 versiones mayores |
| **prisma** (dev) | 5.7.1 | **7.1.0** | ⬆️ +2 versiones mayores |

#### 🚨 Breaking Changes - Prisma 7

- **Rust-Free Client Runtime:** Completamente reescrito en TypeScript
- **Código generado fuera de node_modules:** Cambia la ubicación del cliente generado
- **90% bundle size más pequeño**
- **3x más rápido en ejecución de queries**
- **98% menos tipos para evaluar un schema**
- **70% más rápido en type checking**
- **Nuevo archivo de configuración dinámico**
- **Requiere migración del schema:** Revisar breaking changes en prisma.io/docs

### Authentication

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **next-auth** | 5.0.0-beta.4 | **5.0.0-beta.24** | ⬆️ Beta actualizada |
| **@auth/prisma-adapter** | 1.0.0 | **2.7.5** | ⬆️ +1 versión mayor |

#### ⚠️ Importante - NextAuth v5 (Auth.js)

- **AÚN EN BETA:** No hay release estable aún
- **Método universal `auth()`:** Reemplaza `getServerSession`, `getSession`, `withAuth`, `getToken`, `useSession`
- **App Router-first:** Diseñado para Next.js App Router, pero soporta pages/
- **Compatible con Next.js 16**

### Forms & Validation

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **react-hook-form** | 7.49.2 | **7.54.2** | ⬆️ Patch update |
| **@hookform/resolvers** | 3.3.3 | **3.9.2** | ⬆️ Minor update |
| **zod** | 3.22.4 | **3.24.1** | ⬆️ Minor update |

### State Management

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **zustand** | 4.4.7 | **5.0.3** | ⬆️ +1 versión mayor |

### HTTP & Utilities

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **axios** | 1.6.2 | **1.7.9** | ⬆️ Minor update |
| **date-fns** | 3.0.0 | **4.1.0** | ⬆️ +1 versión mayor |
| **clsx** | 2.1.0 | **2.1.1** | ⬆️ Patch update |
| **tailwind-merge** | 2.2.0 | **2.6.0** | ⬆️ Minor update |

### UI Components (Radix UI)

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **@radix-ui/react-slot** | 1.0.2 | **1.1.1** | ⬆️ Minor update |
| **@radix-ui/react-dialog** | 1.0.5 | **1.1.4** | ⬆️ Minor update |
| **@radix-ui/react-dropdown-menu** | 2.0.6 | **2.1.4** | ⬆️ Minor update |
| **@radix-ui/react-select** | 2.0.0 | **2.1.4** | ⬆️ Minor update |
| **@radix-ui/react-tabs** | 1.0.4 | **1.1.3** | ⬆️ Minor update |
| **@radix-ui/react-toast** | 1.1.5 | **1.2.4** | ⬆️ Minor update |
| **@radix-ui/react-label** | 2.0.2 | **2.1.1** | ⬆️ Minor update |
| **@radix-ui/react-popover** | 1.0.7 | **1.1.4** | ⬆️ Minor update |
| **@radix-ui/react-separator** | 1.0.3 | **1.1.1** | ⬆️ Minor update |
| **@radix-ui/react-switch** | 1.0.3 | **1.1.3** | ⬆️ Minor update |
| **@radix-ui/react-avatar** | 1.0.4 | **1.1.3** | ⬆️ Minor update |
| **@radix-ui/react-slider** | 1.1.2 | **1.2.3** | ⬆️ Minor update |
| **@radix-ui/react-progress** | 1.0.3 | **1.1.1** | ⬆️ Minor update |

### Editors & Icons

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **lucide-react** | 0.303.0 | **0.469.0** | ⬆️ +166 versiones |
| **@tiptap/react** | 2.1.13 | **2.10.5** | ⬆️ Minor update |
| **@tiptap/starter-kit** | 2.1.13 | **2.10.5** | ⬆️ Minor update |

### Document Processing

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **recharts** | 2.10.3 | **2.15.0** | ⬆️ Minor update |
| **react-dropzone** | 14.2.3 | **14.3.5** | ⬆️ Patch update |
| **docx** | 8.5.0 | **9.0.2** | ⬆️ +1 versión mayor |
| **jspdf** | 2.5.1 | **2.5.2** | ⬆️ Patch update |
| **react-syntax-highlighter** | 15.5.0 | **15.6.1** | ⬆️ Minor update |

### DevDependencies

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **typescript** | 5.3.3 | **5.9.3** | ⬆️ Minor updates |
| **@types/node** | 20.10.6 | **22.10.5** | ⬆️ +2 versiones mayores |
| **@types/react** | 18.2.46 | **19.0.7** | ⬆️ +1 versión mayor |
| **@types/react-dom** | 18.2.18 | **19.0.3** | ⬆️ +1 versión mayor |
| **tailwindcss** | 3.4.0 | **3.4.18** | ⬆️ Patch updates |
| **postcss** | 8.4.32 | **8.4.49** | ⬆️ Patch updates |
| **autoprefixer** | 10.4.16 | **10.4.20** | ⬆️ Patch updates |
| **tsx** | 4.7.0 | **4.19.2** | ⬆️ Minor update |
| **eslint** | 8.56.0 | **9.18.0** | ⬆️ +1 versión mayor |
| **eslint-config-next** | 14.0.4 | **16.1.0** | ⬆️ Matches Next.js |
| **@typescript-eslint/eslint-plugin** | 6.17.0 | **8.20.0** | ⬆️ +2 versiones mayores |
| **@typescript-eslint/parser** | 6.17.0 | **8.20.0** | ⬆️ +2 versiones mayores |

#### 🚨 Breaking Changes - TypeScript 5.9

- TypeScript 5.9 es la última versión de la línea 5.x
- TypeScript 7 está en desarrollo (reescrito en Go, 10x más rápido)
- Compatibilidad con todas las features de ES2024

#### 🚨 Breaking Changes - ESLint 9

- Nuevo sistema de configuración flat config
- Deprecación de `.eslintrc.*` en favor de `eslint.config.js`
- Nuevas reglas y mejoras de rendimiento

---

## 2. Backend API (backend-api/package.json)

### Core Framework

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **express** | 4.18.2 | **4.21.2** | ⬆️ Minor updates |

### Security & Middleware

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **helmet** | 7.1.0 | **8.0.0** | ⬆️ +1 versión mayor |
| **express-rate-limit** | 7.1.5 | **7.5.0** | ⬆️ Minor update |
| **express-validator** | 7.0.1 | **7.2.0** | ⬆️ Minor update |
| **jsonwebtoken** | 9.0.2 | **9.0.3** | ⬆️ Patch update |

### Database

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **@prisma/client** | 5.7.1 | **7.1.0** | ⬆️ +2 versiones mayores |
| **prisma** (dev) | 5.7.1 | **7.1.0** | ⬆️ +2 versiones mayores |
| **ioredis** | 5.3.2 | **5.4.2** | ⬆️ Minor update |

### Utilities

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **axios** | 1.6.2 | **1.7.9** | ⬆️ Minor update |
| **dotenv** | 16.3.1 | **16.4.7** | ⬆️ Patch updates |
| **winston** | 3.11.0 | **3.18.0** | ⬆️ Minor update |
| **uuid** | 9.0.1 | **11.0.5** | ⬆️ +2 versiones mayores |
| **date-fns** | 3.0.0 | **4.1.0** | ⬆️ +1 versión mayor |
| **zod** | 3.22.4 | **3.24.1** | ⬆️ Minor update |
| **swagger-ui-express** | 5.0.0 | **5.0.1** | ⬆️ Patch update |

### DevDependencies

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **typescript** | 5.3.3 | **5.9.3** | ⬆️ Minor updates |
| **@types/node** | 20.10.6 | **22.10.5** | ⬆️ +2 versiones mayores |
| **@types/express** | 4.17.21 | **5.0.2** | ⬆️ +1 versión mayor |
| **@types/uuid** | 9.0.7 | **11.0.0** | ⬆️ +2 versiones mayores |
| **eslint** | 8.56.0 | **9.18.0** | ⬆️ +1 versión mayor |
| **@typescript-eslint/eslint-plugin** | 6.17.0 | **8.20.0** | ⬆️ +2 versiones mayores |
| **@typescript-eslint/parser** | 6.17.0 | **8.20.0** | ⬆️ +2 versiones mayores |
| **ts-jest** | 29.1.1 | **29.2.5** | ⬆️ Minor update |
| **supertest** | 6.3.3 | **7.0.0** | ⬆️ +1 versión mayor |

---

## 3. AI Engine (ai-engine/requirements.txt)

### Core Framework

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **fastapi** | 0.108.0 | **0.128.0** | ⬆️ +20 versiones |
| **uvicorn[standard]** | 0.25.0 | **0.40.0** | ⬆️ +15 versiones |
| **pydantic** | 2.5.3 | **2.13.0** | ⬆️ Minor updates |
| **pydantic-settings** | 2.1.0 | **2.8.1** | ⬆️ Minor updates |

#### 🚨 Breaking Changes - FastAPI 0.128

- **Dropped Python 3.8:** Ahora requiere Python 3.9+
- **Python 3.14 support:** Soporte añadido para Python 3.14
- **Mixed Pydantic v1/v2:** Soporte temporal, pero Pydantic v1 será eliminado pronto
- **Pydantic v2 recommended:** Usar exclusivamente Pydantic v2

#### 🚨 Breaking Changes - Uvicorn 0.40

- **Dropped Python 3.9:** Versión más reciente requiere Python 3.10+
- Mejoras significativas de rendimiento
- Mejor soporte para uvloop y httptools

#### 🚨 Breaking Changes - Pydantic v2.13

- **MISSING sentinel:** Nueva feature experimental
- **Python 3.14 support:** Lazy type evaluation (PEP 649, PEP 749)
- Breaking changes de Pydantic v1 a v2 (migración ya hecha)

### Database

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **sqlalchemy** | 2.0.25 | **2.0.40** | ⬆️ Patch updates |
| **psycopg2-binary** | 2.9.9 | **2.9.10** | ⬆️ Patch update |
| **redis** | 5.0.1 | **5.2.3** | ⬆️ Minor updates |

### Vector DB & Embeddings

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **chromadb** | 0.4.22 | **1.4.1** | ⬆️ +1 versión mayor |
| **sentence-transformers** | 2.2.2 | **5.2.0** | ⬆️ +3 versiones mayores |

#### 🚨 Breaking Changes - sentence-transformers 5.2

- **Multi-processing para CrossEncoder:** Rerankers ahora soportan multi-proceso
- **Multilingual NanoBEIR evaluators**
- **Transformers v5 support**
- **Python 3.9 deprecations**
- API changes en algunos métodos

### LangChain & LLM

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **langchain** | 0.1.0 | **1.2.6** | ⬆️ +1 versión mayor |
| **langchain-community** | 0.0.10 | **1.2.6** | ⬆️ Versión estable |
| **langchain-core** | (nueva) | **1.2.7** | ✅ Añadida |
| **ollama** | 0.1.6 | **0.4.8** | ⬆️ Minor updates |

#### 🚨 Breaking Changes - LangChain 1.x

- **LangChain 1.0 GA:** Ahora está en producción estable
- **LangChain 1.2:** Última versión con mejoras y correcciones
- **langchain-core:** Base abstractions package, ahora requerido
- Muchos breaking changes de 0.x a 1.x - revisar migration guide

### NLP & Text Processing

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **nltk** | 3.8.1 | **3.9.1** | ⬆️ Minor update |
| **spacy** | 3.7.2 | **3.8.4** | ⬆️ Minor update |
| **textstat** | 0.7.3 | **0.7.4** | ⬆️ Patch update |
| **numpy** | 1.26.3 | **2.2.4** | ⬆️ +1 versión mayor |

#### 🚨 Breaking Changes - NumPy 2.x

- **NumPy 2.0+:** Cambios significativos en la API
- Mejor rendimiento y menor uso de memoria
- Algunos métodos deprecados eliminados
- Verificar compatibilidad con código existente

### Utilities

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **python-dotenv** | 1.0.0 | **1.0.1** | ⬆️ Patch update |
| **python-multipart** | 0.0.6 | **0.0.20** | ⬆️ Patch updates |
| **aiofiles** | 23.2.1 | **24.1.0** | ⬆️ Versión 2024 |
| **pydantic-core** | 2.14.6 | **2.29.0** | ⬆️ Minor updates |

### Testing & Type Checking

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **pytest** | 7.4.4 | **8.3.5** | ⬆️ +1 versión mayor |
| **pytest-asyncio** | 0.23.3 | **0.25.4** | ⬆️ Minor update |
| **httpx** | 0.26.0 | **0.29.1** | ⬆️ Minor update |
| **mypy** | 1.8.0 | **1.14.1** | ⬆️ Minor updates |
| **types-redis** | 4.6.0.20240106 | **4.6.0.20250108** | ⬆️ Type stubs update |

---

## 4. Scraper (scraper/package.json)

### Core

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **puppeteer** | 21.7.0 | **24.35.0** | ⬆️ +3 versiones mayores |
| **axios** | 1.6.2 | **1.7.9** | ⬆️ Minor update |
| **cheerio** | 1.0.0-rc.12 | **1.0.0** | ⬆️ Release estable |
| **mammoth** | 1.6.0 | **1.8.1** | ⬆️ Minor update |

#### 🚨 Breaking Changes - Puppeteer 24

- Actualizaciones constantes con nuevo Chrome/Chromium
- Mejoras de rendimiento y estabilidad
- Nuevas APIs y métodos
- Verificar breaking changes en changelog

#### ✅ Cheerio 1.0.0 Stable

- Cheerio finalmente salió de RC (release candidate)
- Versión 1.0.0 estable
- Mejoras de rendimiento y correcciones de bugs

### Database & Utilities

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **@prisma/client** | 5.7.1 | **7.1.0** | ⬆️ +2 versiones mayores |
| **prisma** (dev) | 5.7.1 | **7.1.0** | ⬆️ +2 versiones mayores |
| **dotenv** | 16.3.1 | **16.4.7** | ⬆️ Patch updates |
| **winston** | 3.11.0 | **3.18.0** | ⬆️ Minor update |
| **date-fns** | 3.0.0 | **4.1.0** | ⬆️ +1 versión mayor |

### NLP & Text Processing

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **natural** | 6.10.4 | **8.0.1** | ⬆️ +2 versiones mayores |
| **compromise** | 14.10.0 | **14.15.2** | ⬆️ Minor update |
| **user-agents** | 1.1.79 | **1.1.401** | ⬆️ Actualizaciones constantes |

### CLI & Display

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **chalk** | 4.1.2 | **5.4.1** | ⬆️ +1 versión mayor |
| **ora** | 5.4.1 | **8.2.0** | ⬆️ +3 versiones mayores |
| **commander** | 11.1.0 | **12.1.0** | ⬆️ +1 versión mayor |
| **p-retry** | 6.1.0 | **6.2.1** | ⬆️ Minor update |

#### 🚨 Breaking Changes - Chalk 5

- Chalk 5 es ESM-only
- Requiere `import` en lugar de `require`
- Si el proyecto usa CommonJS, puede requerir cambios

#### 🚨 Breaking Changes - Ora 8

- Ora 8 también es ESM-only
- Mejoras en animaciones y rendimiento

### DevDependencies

| Dependencia | Versión Anterior | Versión Nueva | Cambio |
|------------|------------------|---------------|--------|
| **typescript** | 5.3.3 | **5.9.3** | ⬆️ Minor updates |
| **@types/node** | 20.10.6 | **22.10.5** | ⬆️ +2 versiones mayores |
| **eslint** | 8.56.0 | **9.18.0** | ⬆️ +1 versión mayor |
| **@typescript-eslint/eslint-plugin** | 6.17.0 | **8.20.0** | ⬆️ +2 versiones mayores |
| **@typescript-eslint/parser** | 6.17.0 | **8.20.0** | ⬆️ +2 versiones mayores |

**Nota:** Se eliminó `@types/puppeteer` ya que Puppeteer incluye sus propios tipos desde v7+.

---

## 📋 Pasos de Migración Recomendados

### 1. Antes de Instalar Dependencias

```bash
# Backup de package-lock.json y node_modules
cp package-lock.json package-lock.json.backup
cp -r node_modules node_modules.backup

# Backup de requirements.txt
cp ai-engine/requirements.txt ai-engine/requirements.txt.backup
```

### 2. Instalar Dependencias Node.js

```bash
# Frontend
cd webapp
rm -rf node_modules package-lock.json
npm install

# Backend API
cd ../backend-api
rm -rf node_modules package-lock.json
npm install

# Scraper
cd ../scraper
rm -rf node_modules package-lock.json
npm install
```

### 3. Instalar Dependencias Python

```bash
# AI Engine
cd ../ai-engine
pip install -r requirements.txt --upgrade
```

### 4. Migrar Prisma Schema

```bash
# En webapp y backend-api
npx prisma generate
npx prisma migrate dev --name update_to_prisma_7

# Verificar que el schema compile
npx prisma validate
```

### 5. Actualizar Configuraciones

#### Next.js Config (`webapp/next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 usa Turbopack por defecto en dev
  // Si hay problemas, desactivar temporalmente:
  // turbo: false,

  reactStrictMode: true,

  // Experimental features estables en v16
  experimental: {
    // Partial Pre-Rendering ahora estable
    ppr: true,
  },
}

module.exports = nextConfig
```

#### TypeScript Config

Verificar que `tsconfig.json` sea compatible con TypeScript 5.9:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
```

#### ESLint Config (Migrar a Flat Config)

Crear `eslint.config.js` (nuevo formato ESLint 9):

```javascript
import js from '@eslint/js'
import nextPlugin from 'eslint-config-next'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
]
```

### 6. Actualizar Imports de Auth.js

Si usas NextAuth v5, actualizar imports:

```typescript
// Antes
import { getServerSession } from 'next-auth'

// Ahora
import { auth } from '@/auth'

// Uso universal
const session = await auth()
```

### 7. Actualizar React 19 - Eliminar forwardRef

```typescript
// Antes (React 18)
import { forwardRef } from 'react'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return <button ref={ref} {...props}>{children}</button>
  }
)

// Ahora (React 19)
const Button = ({ children, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  return <button ref={ref} {...props}>{children}</button>
}
```

### 8. Verificar NumPy 2.x Compatibility

```python
# Verificar código que use NumPy
# Algunos métodos deprecados fueron eliminados
# Ejemplo de cambios:

# Antes
import numpy as np
arr = np.array([1, 2, 3], dtype=np.int)  # Deprecado

# Ahora
arr = np.array([1, 2, 3], dtype=np.int64)  # Específico
```

### 9. Actualizar LangChain 1.x

```python
# Verificar imports de LangChain
# Muchos módulos se reorganizaron de 0.x a 1.x

# Antes (0.1.0)
from langchain.chains import LLMChain

# Ahora (1.2.6) - verificar en docs oficiales
from langchain.chains.llm import LLMChain
from langchain_core.prompts import PromptTemplate
```

### 10. Testing

```bash
# Frontend
cd webapp
npm run type-check
npm run lint
npm run build
npm run dev  # Verificar que arranque

# Backend API
cd ../backend-api
npm run type-check
npm run lint
npm run build

# AI Engine
cd ../ai-engine
mypy .
pytest

# Scraper
cd ../scraper
npm run type-check
npm run lint
```

---

## ⚠️ Incompatibilidades Conocidas

### 1. Next.js 16 + React 19

- **COMPATIBLE:** Next.js 16 requiere React 19
- No usar Next.js 16 con React 18
- Verificar que todos los componentes sean compatibles con React 19

### 2. Prisma 7 Schema Changes

- **IMPORTANTE:** Revisar schema de Prisma
- Algunos tipos pueden haber cambiado
- Ejecutar `npx prisma validate` antes de generar

### 3. NextAuth v5 Beta

- **BETA:** NextAuth v5 aún no es estable
- Monitorear releases para versión estable
- Considerar migrar a Auth.js cuando salga v5 stable

### 4. ESM vs CommonJS

- **Chalk 5 y Ora 8:** Son ESM-only
- Si el scraper usa CommonJS (`require`), migrar a ESM (`import`)
- O downgrade a versiones anteriores si no es posible migrar

### 5. Python Version Requirements

- **FastAPI 0.128:** Requiere Python 3.9+
- **Uvicorn 0.40:** Requiere Python 3.10+
- **Recomendado:** Python 3.10 o 3.11 para máxima compatibilidad

### 6. NumPy 2.x Breaking Changes

- Verificar todo código que use NumPy
- Algunos tipos y métodos deprecados fueron eliminados
- Revisar migration guide de NumPy 2.0

---

## ✅ Checklist Post-Actualización

- [ ] **Instalar todas las dependencias sin errores**
- [ ] **Ejecutar `npx prisma generate` en webapp y backend-api**
- [ ] **Ejecutar `npx prisma migrate dev` y verificar schema**
- [ ] **Type-check pasa en todos los proyectos TypeScript**
- [ ] **Linters pasan sin errores críticos**
- [ ] **Build exitoso en frontend y backend**
- [ ] **Tests pasan en AI engine (pytest)**
- [ ] **Dev server arranca correctamente**
- [ ] **Verificar autenticación funciona**
- [ ] **Verificar conexión a base de datos**
- [ ] **Verificar API endpoints responden**
- [ ] **Verificar generación de documentos**
- [ ] **Verificar scraper funciona**
- [ ] **Revisar logs por errores o warnings**

---

## 🔗 Referencias y Recursos

### Next.js 16
- [Next.js 16 Blog](https://nextjs.org/blog/next-16)
- [Next.js Releases](https://github.com/vercel/next.js/releases)

### React 19
- [React v19](https://react.dev/blog/2024/12/05/react-19)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)

### Prisma 7
- [Prisma 7 Release](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0)
- [Prisma Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions)

### Auth.js (NextAuth v5)
- [Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5)

### FastAPI
- [FastAPI Release Notes](https://fastapi.tiangolo.com/release-notes/)
- [FastAPI Releases](https://github.com/fastapi/fastapi/releases)

### LangChain
- [LangChain Changelog](https://changelog.langchain.com/)
- [LangChain 1.0 GA](https://changelog.langchain.com/announcements/langchain-1-0-now-generally-available)

### Pydantic
- [Pydantic v2 Migration](https://docs.pydantic.dev/latest/migration/)
- [Pydantic Releases](https://github.com/pydantic/pydantic/releases)

### TypeScript
- [TypeScript Releases](https://github.com/microsoft/typescript/releases)
- [TypeScript 5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)

### ESLint 9
- [ESLint 9 Release](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/)
- [Flat Config Migration](https://eslint.org/docs/latest/use/configure/migration-guide)

---

## 📊 Resumen de Cambios

| Categoría | Versiones Actualizadas | Breaking Changes | Requiere Migración |
|-----------|------------------------|------------------|--------------------|
| **Frontend** | 42 dependencias | Next.js 16, React 19, Prisma 7 | ✅ Sí |
| **Backend API** | 27 dependencias | Prisma 7, ESLint 9 | ✅ Sí |
| **AI Engine** | 20 dependencias | FastAPI, LangChain 1.x, NumPy 2 | ✅ Sí |
| **Scraper** | 20 dependencias | Prisma 7, Chalk 5, Ora 8 | ⚠️ Parcial |

**Total de dependencias actualizadas:** 109

---

## 🎯 Prioridades de Migración

### 🔴 CRÍTICO (Hacer Primero)

1. **Prisma 7 Migration:** Afecta a webapp, backend-api y scraper
2. **Next.js 16 + React 19:** Framework core del frontend
3. **TypeScript 5.9 + ESLint 9:** Tooling común a todos los proyectos

### 🟡 IMPORTANTE (Hacer Después)

4. **LangChain 1.x:** Migración del AI engine
5. **FastAPI 0.128 + Pydantic 2.13:** Backend Python
6. **NextAuth v5 beta:** Actualización de auth (monitorear release estable)

### 🟢 OPCIONAL (Hacer al Final)

7. **UI Libraries:** Radix UI, Lucide, etc. (cambios menores)
8. **Utilities:** date-fns 4, axios 1.7, etc.
9. **Testing Libraries:** pytest 8, supertest 7, etc.

---

## 💡 Notas Finales

- **Conservador pero Actualizado:** Se priorizó estabilidad sobre bleeding edge
- **Versiones 2026:** Todas las dependencias están en versiones de 2026
- **Breaking Changes Documentados:** Todos los cambios importantes están listados
- **Migration Paths:** Pasos claros para cada migración importante
- **Rollback Possible:** Backups recomendados antes de actualizar

**Estado:** ✅ Documentación completa
**Siguiente paso:** Ejecutar instalación y migración paso a paso

---

**Actualizado por:** Claude Code Agent
**Fecha:** 22 de Enero de 2026
