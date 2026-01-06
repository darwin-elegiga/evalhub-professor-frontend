# Docker y CI/CD - EvalHub Professor Frontend

Documentación detallada del sistema de contenedores y despliegue continuo.

---

## Tabla de Contenidos

1. [Dockerfile](#1-dockerfile)
2. [Docker Compose](#2-docker-compose)
3. [GitHub Actions CI/CD](#3-github-actions-cicd)
4. [Archivos Auxiliares](#4-archivos-auxiliares)
5. [Comandos Útiles](#5-comandos-útiles)
6. [Configuración en GitHub](#6-configuración-en-github)

---

## 1. Dockerfile

El Dockerfile usa **multi-stage build** para crear una imagen optimizada.

### Estructura del Archivo

```dockerfile
# ============================================
# Stage 1: Dependencies (deps)
# ============================================
FROM node:20-alpine AS deps
```

### Stage 1: Dependencies (`deps`)

```dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
```

| Línea | Qué hace |
|-------|----------|
| `FROM node:20-alpine AS deps` | Usa imagen base Node.js 20 en Alpine Linux (~50MB vs ~300MB de Debian). `AS deps` le da nombre a este stage. |
| `RUN apk add --no-cache libc6-compat` | Instala librería de compatibilidad necesaria para algunos paquetes npm en Alpine. |
| `WORKDIR /app` | Establece `/app` como directorio de trabajo. Todos los comandos siguientes se ejecutan aquí. |
| `COPY package.json pnpm-lock.yaml* ./` | Copia solo archivos de dependencias. El `*` hace opcional el lockfile. |
| `RUN corepack enable pnpm && pnpm install --frozen-lockfile` | Habilita pnpm e instala dependencias exactas del lockfile. |

**¿Por qué un stage separado para dependencias?**
- Docker cachea cada layer
- Si el código cambia pero `package.json` no, Docker reutiliza las dependencias cacheadas
- Esto acelera builds subsecuentes de ~5 minutos a ~30 segundos

---

### Stage 2: Builder (`builder`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN corepack enable pnpm && pnpm run build
```

| Línea | Qué hace |
|-------|----------|
| `FROM node:20-alpine AS builder` | Nueva imagen limpia para el build. |
| `COPY --from=deps /app/node_modules ./node_modules` | Copia `node_modules` del stage anterior. Evita reinstalar. |
| `COPY . .` | Copia todo el código fuente. |
| `ENV NEXT_TELEMETRY_DISABLED=1` | Desactiva telemetría de Next.js (privacidad). |
| `ENV NODE_ENV=production` | Indica que es build de producción (optimizaciones). |
| `RUN corepack enable pnpm && pnpm run build` | Ejecuta `next build`, genera carpeta `.next/`. |

**¿Qué genera el build?**
```
.next/
├── standalone/      # Servidor Node.js independiente (~15MB)
│   ├── server.js    # Punto de entrada
│   └── node_modules # Solo dependencias de producción
├── static/          # Assets estáticos (JS, CSS, imágenes)
└── ...
```

---

### Stage 3: Runner (`runner`)

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Permisos
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

| Línea | Qué hace |
|-------|----------|
| `FROM node:20-alpine AS runner` | Imagen final limpia, sin herramientas de build. |
| `RUN addgroup... && adduser...` | Crea usuario `nextjs` sin privilegios root (seguridad). |
| `COPY --from=builder /app/public ./public` | Copia archivos públicos (favicon, imágenes). |
| `COPY --from=builder /app/.next/standalone ./` | Copia servidor standalone de Next.js. |
| `COPY --from=builder /app/.next/static ./.next/static` | Copia assets estáticos compilados. |
| `RUN chown -R nextjs:nodejs /app` | Da propiedad de archivos al usuario `nextjs`. |
| `USER nextjs` | Cambia al usuario no-root. El contenedor NO corre como root. |
| `EXPOSE 3000` | Documenta que el contenedor usa puerto 3000 (no abre el puerto). |
| `ENV HOSTNAME="0.0.0.0"` | Escucha en todas las interfaces (necesario en Docker). |
| `CMD ["node", "server.js"]` | Comando que se ejecuta al iniciar el contenedor. |

### Comparación de Tamaños

| Stage | Contenido | Tamaño Aproximado |
|-------|-----------|-------------------|
| deps | node_modules completo | ~800MB |
| builder | código + node_modules + .next | ~1.2GB |
| **runner** | **solo lo necesario** | **~150MB** |

---

## 2. Docker Compose

Este repositorio solo contiene el **frontend**. El backend NestJS se despliega por separado.

### docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}
        - NEXT_PUBLIC_USE_MOCK=${NEXT_PUBLIC_USE_MOCK:-false}
    container_name: evalhub-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}
      - NEXT_PUBLIC_USE_MOCK=${NEXT_PUBLIC_USE_MOCK:-false}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Explicación por Sección

#### `build:`
```yaml
build:
  context: .              # Directorio desde donde se construye (raíz del proyecto)
  dockerfile: Dockerfile  # Archivo Dockerfile a usar
  args:                   # Variables de build (se inyectan durante next build)
    - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}
```
- `args` pasa variables al Dockerfile durante el build
- Las variables `NEXT_PUBLIC_*` se "hornean" en el bundle de Next.js

#### `container_name:`
```yaml
container_name: evalhub-frontend  # Nombre fijo del contenedor
```
- Sin esto, Docker genera nombres aleatorios como `evalhub-professor-frontend-frontend-1`

#### `restart:`
```yaml
restart: unless-stopped
```
| Valor | Comportamiento |
|-------|----------------|
| `no` | Nunca reinicia |
| `always` | Siempre reinicia (incluso si se detiene manualmente) |
| `on-failure` | Solo si el proceso falla (exit code ≠ 0) |
| `unless-stopped` | Reinicia excepto si se detuvo manualmente |

#### `ports:`
```yaml
ports:
  - "3000:3000"  # HOST:CONTENEDOR
```
- `3000:3000` = Puerto 3000 del host mapeado al 3000 del contenedor
- `8080:3000` = Acceder desde host:8080, internamente usa 3000

#### `environment:`
```yaml
environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}
```
- `${VAR:-default}` = Usa variable de entorno, o el default si no existe
- La URL apunta a tu backend NestJS externo

#### `healthcheck:`
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s      # Cada 30 segundos
  timeout: 10s       # Máximo 10s para responder
  retries: 3         # 3 intentos fallidos = unhealthy
  start_period: 40s  # Espera 40s antes de empezar a verificar
```

### Diagrama de Arquitectura

```
┌────────────────────────────────────────────────────────────────────────┐
│                           DOCKER HOST                                   │
│                                                                        │
│  ┌─────────────────────┐                                               │
│  │  evalhub-frontend   │                                               │
│  │      :3000          │                                               │
│  └──────────┬──────────┘                                               │
│             │                                                          │
└─────────────│──────────────────────────────────────────────────────────┘
              │
              │ HTTP requests to NEXT_PUBLIC_API_URL
              ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND EXTERNO (NestJS)                        │
│                    :3001/api                                 │
└─────────────────────────────────────────────────────────────┘
```

**Nota:** El backend y la base de datos se gestionan en un repositorio separado.

---

## 3. GitHub Actions CI/CD

### Archivo: `.github/workflows/ci-cd.yml`

### Triggers (Cuándo se ejecuta)

```yaml
on:
  push:
    branches:
      - main      # Push directo a main
      - develop   # Push directo a develop
  pull_request:
    branches:
      - main      # PR hacia main
      - develop   # PR hacia develop
```

### Variables de Entorno Globales

```yaml
env:
  REGISTRY: ghcr.io                    # GitHub Container Registry
  IMAGE_NAME: ${{ github.repository }} # usuario/repo
```

---

### Job 1: Lint & Type Check

```yaml
lint:
  name: Lint & Type Check
  runs-on: ubuntu-latest
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "pnpm"

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run linter
      run: pnpm lint

    - name: Type check
      run: pnpm exec tsc --noEmit
```

| Step | Qué hace |
|------|----------|
| `checkout@v4` | Clona el repositorio en el runner |
| `pnpm/action-setup@v2` | Instala pnpm versión 9 |
| `setup-node@v4` | Instala Node.js 20 y configura caché de pnpm |
| `pnpm install` | Instala dependencias |
| `pnpm lint` | Ejecuta ESLint |
| `tsc --noEmit` | Verifica tipos sin generar archivos |

---

### Job 2: Build

```yaml
build:
  name: Build
  runs-on: ubuntu-latest
  needs: lint              # Espera a que lint termine exitosamente
  steps:
    # ... setup igual que lint ...

    - name: Build application
      run: pnpm build
      env:
        NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }}

    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: nextjs-build
        path: .next/
        retention-days: 1
```

| Step | Qué hace |
|------|----------|
| `needs: lint` | Solo ejecuta si `lint` pasó |
| `pnpm build` | Ejecuta `next build` |
| `upload-artifact` | Guarda `.next/` para jobs posteriores (opcional) |

---

### Job 3: Docker Build & Push

```yaml
docker:
  name: Build & Push Docker Image
  runs-on: ubuntu-latest
  needs: build
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  permissions:
    contents: read
    packages: write
```

| Configuración | Significado |
|---------------|-------------|
| `needs: build` | Espera a que build termine |
| `if: ... 'push' && ... 'main'` | Solo ejecuta en push a main (no en PRs) |
| `permissions: packages: write` | Permite subir imágenes a GHCR |

#### Steps del Job Docker

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```
- Configura BuildKit para builds optimizados y multi-plataforma

```yaml
- name: Log in to Container Registry
  uses: docker/login-action@v3
  with:
    registry: ${{ env.REGISTRY }}
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```
- `GITHUB_TOKEN` se genera automáticamente, no necesitas configurarlo

```yaml
- name: Extract metadata for Docker
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
    tags: |
      type=ref,event=branch
      type=sha,prefix=
      type=raw,value=latest,enable={{is_default_branch}}
```

Genera tags automáticamente:
| Tag | Ejemplo | Cuándo |
|-----|---------|--------|
| `type=ref,event=branch` | `main`, `develop` | Nombre de la rama |
| `type=sha` | `a1b2c3d` | SHA corto del commit |
| `type=raw,value=latest` | `latest` | Solo en rama default (main) |

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

| Parámetro | Función |
|-----------|---------|
| `push: true` | Sube la imagen al registry |
| `cache-from/to: type=gha` | Usa caché de GitHub Actions (builds más rápidos) |

---

### Job 4: Deploy

```yaml
deploy:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: docker
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  environment:
    name: production
    url: ${{ vars.PRODUCTION_URL }}
```

- `environment: production` = Protección adicional (puede requerir aprobación manual)

```yaml
- name: Deploy to server via SSH
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || 22 }}
    script: |
      cd ${{ vars.DEPLOY_PATH || '/opt/evalhub' }}
      docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
      docker compose pull frontend
      docker compose up -d frontend
      docker image prune -f
```

| Comando | Qué hace |
|---------|----------|
| `docker pull ...` | Descarga la nueva imagen |
| `docker compose pull frontend` | Actualiza referencia en compose |
| `docker compose up -d frontend` | Reinicia solo el frontend |
| `docker image prune -f` | Elimina imágenes antiguas |

---

### Job 5: Notify on Failure

```yaml
notify-failure:
  needs: [lint, build, docker, deploy]
  if: failure()
```
- `if: failure()` = Solo ejecuta si algún job anterior falló

---

## 4. Archivos Auxiliares

### .dockerignore

```
node_modules          # Se reinstalan en el contenedor
.next                 # Se regenera durante build
.git                  # No necesario en producción
*.md                  # Documentación
Dockerfile*           # Evita recursión
docker-compose*.yml   # No necesario dentro del contenedor
```

**Beneficios:**
- Reduce tamaño del contexto de build (más rápido)
- Evita copiar archivos innecesarios
- Mejora seguridad (no incluir secrets)

### .env.example

```bash
# API Configuration
# URL del backend NestJS (externo a este contenedor)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Usar datos mock (true para desarrollo sin backend)
NEXT_PUBLIC_USE_MOCK=false
```

---

## 5. Comandos Útiles

### Desarrollo Local

```bash
# Sin Docker (recomendado para desarrollo)
pnpm dev

# Con Docker
docker compose up --build

# Ver logs
docker compose logs -f
```

### Producción

```bash
# Crear archivo de configuración
cp .env.example .env
nano .env  # Configurar NEXT_PUBLIC_API_URL con la URL de tu backend

# Construir y levantar
docker compose up -d --build

# Ver estado
docker compose ps

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Actualizar (rebuild) y reiniciar
docker compose up -d --build

# Parar
docker compose down
```

### Debugging

```bash
# Entrar al contenedor
docker exec -it evalhub-frontend sh

# Ver uso de recursos
docker stats

# Inspeccionar contenedor
docker inspect evalhub-frontend

# Ver logs en tiempo real
docker logs -f evalhub-frontend
```

---

## 6. Configuración en GitHub

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `SSH_HOST` | IP o dominio del servidor | `192.168.1.100` o `server.example.com` |
| `SSH_USERNAME` | Usuario SSH | `deploy` |
| `SSH_PRIVATE_KEY` | Llave privada SSH completa | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` | Puerto SSH (opcional) | `22` |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL de la API en producción | `https://api.example.com` |
| `PRODUCTION_URL` | URL pública del frontend | `https://evalhub.example.com` |
| `DEPLOY_PATH` | Ruta en el servidor | `/opt/evalhub` |

### Generar Llave SSH

```bash
# En tu máquina local
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Copiar llave pública al servidor
ssh-copy-id -i ~/.ssh/github_deploy.pub usuario@servidor

# El contenido de ~/.ssh/github_deploy (privada) va en SSH_PRIVATE_KEY
cat ~/.ssh/github_deploy
```

---

## Diagrama del Flujo CI/CD Completo

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           GITHUB REPOSITORY                               │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Push to main
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         GITHUB ACTIONS RUNNER                             │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐ │
│  │    LINT     │───▶│    BUILD    │───▶│   DOCKER    │───▶│  DEPLOY   │ │
│  │  - ESLint   │    │ - next build│    │ - Build img │    │ - SSH     │ │
│  │  - TypeCheck│    │ - Artifacts │    │ - Push GHCR │    │ - Pull    │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    │ - Restart │ │
│                                              │            └───────────┘ │
└──────────────────────────────────────────────│──────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    GITHUB CONTAINER REGISTRY (ghcr.io)                    │
│                                                                          │
│                    ghcr.io/usuario/evalhub-professor-frontend            │
│                    Tags: latest, main, a1b2c3d                           │
└──────────────────────────────────────────────────────────────────────────┘
                                               │
                                               │ docker pull
                                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION SERVER                                 │
│                                                                          │
│  ┌───────────────────────────────────┐                                   │
│  │         evalhub-frontend          │                                   │
│  │             :3000                 │                                   │
│  └───────────────┬───────────────────┘                                   │
│                  │                                                        │
└──────────────────│───────────────────────────────────────────────────────┘
                   │
                   │ HTTP (NEXT_PUBLIC_API_URL)
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    BACKEND EXTERNO (NestJS)                               │
│                         :3001/api                                         │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
                            ┌──────────────┐
                            │   USUARIOS   │
                            │  (Navegador) │
                            └──────────────┘
```
