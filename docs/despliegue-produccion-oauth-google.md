# Guía de Despliegue en Producción: Docker + Google OAuth

> **Documento:** Configuración de Google OAuth para entorno de producción con Docker  
> **Proyecto:** TallerDesarrollo-TCG  
> **Fecha:** Abril 2026  
> **Estado:** Referencia para despliegue inicial

---

## Índice

1. [Contexto y Arquitectura Actual](#1-contexto-y-arquitectura-actual)
2. [Problema: Local vs Producción con OAuth](#2-problema-local-vs-producción-con-oauth)
3. [Paso 1 — Google Cloud Console](#3-paso-1--google-cloud-console)
4. [Paso 2 — Variables de Entorno (.env.docker)](#4-paso-2--variables-de-entorno-envdocker)
5. [Paso 3 — CORS en el Backend](#5-paso-3--cors-en-el-backend)
6. [Paso 4 — HTTPS Obligatorio](#6-paso-4--https-obligatorio)
7. [Paso 5 — Rebuild del Frontend](#7-paso-5--rebuild-del-frontend)
8. [Checklist Final](#8-checklist-final)
9. [Errores Comunes y Soluciones](#9-errores-comunes-y-soluciones)

---

## 1. Contexto y Arquitectura Actual

El proyecto usa **Google OAuth 2.0** con el flujo de **token de ID en el cliente** (también llamado "One Tap" o flujo implícito). El flujo completo funciona así:

```
Usuario
  │
  ▼
Frontend (React/Vite)
  │  ① El usuario hace clic en "Iniciar sesión con Google"
  │  ② Google devuelve un ID Token (JWT) al frontend
  ▼
Backend (Node.js / Express)
  │  ③ El frontend envía ese token a POST /api/auth/google
  │  ④ El backend verifica el token con la librería google-auth-library
  │  ⑤ El backend crea o busca al usuario en la DB y devuelve un JWT propio
  ▼
PostgreSQL
  │  ⑥ El usuario queda registrado con su googleId
```

### Archivos clave del sistema de autenticación

| Archivo | Rol |
|---|---|
| `frontend/src/main.jsx` | Envuelve la app en `<GoogleOAuthProvider clientId={...}>` |
| `backend/src/controllers/auth.controller.js` | Verifica el token con `OAuth2Client` de Google |
| `backend/src/routes/auth.routes.js` | Define `POST /api/auth/google` |
| `backend/src/entities/User.js` | Almacena el campo `googleId` en la base de datos |
| `.env.docker` | Variables de entorno para Docker |
| `docker-compose.yml` | Orquestra los 4 contenedores: db, backend, frontend, seed |

---

## 2. Problema: Local vs Producción con OAuth

Cuando corres la app en local (`localhost`), Google permite el login porque `localhost` es un origen especialmente tolerado durante desarrollo. En producción, esto **ya no aplica**.

Google OAuth en producción exige:

- ✅ Un **dominio real** registrado como origen autorizado en Google Cloud Console
- ✅ Conexión **HTTPS** (HTTP es rechazado automáticamente)
- ✅ Las variables de entorno del frontend deben apuntar al **dominio real**, no a `localhost`

Si no se cumplen estas condiciones, Google devuelve errores como:
- `origin_mismatch` — el origen no está autorizado
- `redirect_uri_mismatch` — la URI de redirección no coincide
- `idpiframe_initialization_failed` — falla silenciosa por HTTP

---

## 3. Paso 1 — Google Cloud Console

Este es **el cambio más crítico**. Sin él, nada de lo demás funciona.

### Dónde ir

1. Ir a [https://console.cloud.google.com](https://console.cloud.google.com)
2. Seleccionar el proyecto donde creaste las credenciales de OAuth
3. Ir a **APIs y servicios** → **Credenciales**
4. Hacer clic en el **OAuth 2.0 Client ID** que usa la app

### Qué agregar

En la sección **Orígenes de JavaScript autorizados**, agregar:

```
https://tudominio.com
```

> ⚠️ **Importante:** Si también usas `www`, agrega ambas versiones:
> ```
> https://tudominio.com
> https://www.tudominio.com
> ```

En la sección **URIs de redireccionamiento autorizados**, agregar:

```
https://tudominio.com
```

### Lo que NO cambia

- El **Client ID** (`GOOGLE_CLIENT_ID`) es el mismo para local y producción. Solo le estás diciendo a Google qué nuevos orígenes lo pueden usar.
- El **Client Secret** (si lo usas) tampoco cambia.

### Tiempo de propagación

Los cambios en Google Cloud Console pueden tardar **5 a 30 minutos** en propagarse. No te alarmes si el login falla inmediatamente después de guardar.

---

## 4. Paso 2 — Variables de Entorno (.env.docker)

### Estado actual del archivo `.env.docker`

```env
# Google Auth
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_ID=tu_google_client_id

VITE_API_BASE_URL=http://localhost/api   # ← ESTO DEBE CAMBIAR
```

### Cambios necesarios para producción

```env
# ─── BACKEND ───────────────────────────────────────────────────────────────

JWT_SECRET=un_secreto_muy_largo_y_aleatorio_minimo_64_caracteres

# Mismo Client ID de Google Cloud Console
GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxx.apps.googleusercontent.com

# Base de datos (ajustar contraseña)
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=contraseña_muy_segura_aqui
DB_NAME=tcg_pokemon


# ─── FRONTEND ──────────────────────────────────────────────────────────────

# URL pública de la API — usar HTTPS y el dominio real
VITE_API_BASE_URL=https://tudominio.com/api

# Mismo Client ID (el frontend también lo necesita para el botón de Google)
VITE_GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxx.apps.googleusercontent.com
```

### ⚠️ ADVERTENCIA CRÍTICA sobre variables VITE_*

Las variables que empiezan con `VITE_` **se embeben en el código JavaScript** del frontend **en tiempo de build** (cuando se ejecuta `npm run build` o `docker build`). Esto significa:

- Si cambias `VITE_API_BASE_URL` en el `.env.docker` **después** de haber construido la imagen de Docker del frontend, el cambio **no tiene efecto**.
- Debes reconstruir la imagen con `docker-compose build frontend` cada vez que cambies una variable `VITE_*`.

Las variables del **backend** (como `GOOGLE_CLIENT_ID` sin prefijo `VITE_`) sí se leen en tiempo de ejecución, por lo que puedes cambiarlas y solo reiniciar el contenedor.

---

## 5. Paso 3 — CORS en el Backend

### Estado actual (`backend/src/index.js`)

```js
// Línea 27
app.use(cors()); // ← Acepta peticiones de CUALQUIER origen
```

```js
// Líneas 71-74 (Socket.IO)
const io = new Server(server, {
  cors: {
    origin: "*", // ← Igual, acepta todo
    methods: ["GET", "POST"]
  }
});
```

### Por qué esto es un problema en producción

En local es conveniente, pero en producción deja la API **abierta a cualquier sitio web**. Esto permite ataques de tipo CSRF y que otras apps consuman tu API sin restricciones.

### Cambio recomendado

```js
// backend/src/index.js

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tudominio.com';

// CORS para Express
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,                          // Necesario si usas cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CORS para Socket.IO
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});
```

Y en `.env.docker` agrega:

```env
FRONTEND_URL=https://tudominio.com
```

---

## 6. Paso 4 — HTTPS Obligatorio

Google OAuth rechaza flujos de autenticación sobre HTTP desde 2021. Necesitas SSL/TLS. Hay tres opciones principales:

### Opción A — Nginx + Certbot (Recomendada para VPS propio)

Agrega dos servicios a tu `docker-compose.yml`:

```yaml
services:
  # ... tus servicios existentes ...

  nginx:
    image: nginx:alpine
    container_name: tcg_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - certbot_certs:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    depends_on:
      - frontend
      - backend

  certbot:
    image: certbot/certbot
    container_name: tcg_certbot
    volumes:
      - certbot_certs:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    # Correr manualmente para obtener el certificado inicial:
    # docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d tudominio.com
    entrypoint: /bin/sh -c "trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done"

volumes:
  postgres_data:
  uploads_data:
  certbot_certs:  # ← Nuevo
  certbot_www:    # ← Nuevo
```

Configuración de Nginx (`nginx/nginx.conf`):

```nginx
events {}

http {
    # Redirigir HTTP → HTTPS
    server {
        listen 80;
        server_name tudominio.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Servidor HTTPS principal
    server {
        listen 443 ssl;
        server_name tudominio.com;

        ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

        # Frontend
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API Backend
        location /api/ {
            proxy_pass http://backend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket (Socket.IO)
        location /socket.io/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

### Opción B — Cloudflare (Más fácil, recomendada si no tienes experiencia con SSL)

1. Registra tu dominio en Cloudflare (o transfiere el DNS ahí).
2. Activa el modo proxy (nube naranja) en el registro A que apunta a la IP de tu servidor.
3. En **SSL/TLS** → Modo: selecciona **Full** (si tu servidor tiene un certificado autofirmado) o **Flexible** (si no tiene ninguno).
4. Cloudflare gestiona el HTTPS hacia el usuario, y tu servidor puede seguir en HTTP internamente.

> ⚠️ En modo Flexible, el tráfico entre Cloudflare y tu servidor va sin cifrar. Es aceptable para empezar pero no ideal.

### Opción C — Traefik (Alternativa moderna a Nginx para Docker)

Traefik es un reverse proxy diseñado específicamente para Docker. Detecta tus contenedores automáticamente y gestiona certificados Let's Encrypt solo. Es más complejo de configurar inicialmente pero más elegante a largo plazo.

---

## 7. Paso 5 — Rebuild del Frontend

Después de cambiar las variables de entorno `VITE_*`, debes reconstruir la imagen del frontend:

```bash
# Solo reconstruir el frontend y reiniciar
docker-compose build frontend
docker-compose up -d frontend

# O reconstruir todo desde cero
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Por qué es necesario

El `Dockerfile` del frontend ejecuta `npm run build` (Vite) durante la construcción de la imagen. Vite lee las variables de entorno en ese momento y las incrusta directamente en el JavaScript compilado. El contenedor resultante es estático — no puede leer variables de entorno en tiempo de ejecución.

---

## 8. Checklist Final

Usa esta lista antes de declarar el despliegue como listo:

### Google Cloud Console
- [ ] Dominio de producción agregado en **Orígenes JS autorizados** (`https://tudominio.com`)
- [ ] Dominio de producción agregado en **URIs de redireccionamiento** (`https://tudominio.com`)
- [ ] Esperé al menos 10 minutos después de guardar los cambios

### Variables de entorno
- [ ] `VITE_API_BASE_URL` apunta a `https://tudominio.com/api` (con HTTPS)
- [ ] `GOOGLE_CLIENT_ID` y `VITE_GOOGLE_CLIENT_ID` tienen el Client ID real de GCP
- [ ] `JWT_SECRET` es una cadena larga y aleatoria (no el valor de ejemplo)
- [ ] `DB_PASSWORD` es una contraseña segura (no el valor de ejemplo)
- [ ] `.env.docker` **NO está commiteado en Git** (verificar `.gitignore`)

### Backend
- [ ] `cors()` configurado con el dominio real, no `"*"`
- [ ] Socket.IO CORS también configurado con el dominio real
- [ ] Variable `FRONTEND_URL` agregada al entorno del backend en `docker-compose.yml`

### HTTPS
- [ ] El servidor responde correctamente en `https://tudominio.com`
- [ ] La redirección HTTP → HTTPS funciona
- [ ] El certificado SSL es válido (no autofirmado en producción)

### Docker
- [ ] Imagen del frontend reconstruida después de cambiar variables `VITE_*`
- [ ] `docker-compose up -d` corre sin errores
- [ ] Los 4 contenedores (db, backend, frontend, seed) muestran estado healthy/exited correctamente

### Prueba funcional
- [ ] El botón "Iniciar sesión con Google" aparece correctamente
- [ ] El flujo de login completo funciona (clic → popup Google → redirige a la app autenticado)
- [ ] Las rutas protegidas redirigen a login si no hay sesión

---

## 9. Errores Comunes y Soluciones

### ❌ `Error 400: origin_mismatch`

**Causa:** El dominio desde donde se hace la petición de OAuth no está registrado en Google Cloud Console.

**Solución:** Ir a Google Cloud Console → Credenciales → tu Client ID → agregar `https://tudominio.com` en Orígenes JS autorizados. Esperar 10-30 minutos.

---

### ❌ `VITE_API_BASE_URL` sigue siendo `localhost` en producción

**Causa:** La imagen del frontend fue construida antes de actualizar el `.env.docker`.

**Solución:** 
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

### ❌ `CORS error` en la consola del navegador

**Causa:** El backend tiene `cors({ origin: 'https://tudominio.com' })` pero el frontend contacta al backend por una URL diferente, o viceversa.

**Solución:** Verificar que `VITE_API_BASE_URL` y la configuración de CORS en el backend usen exactamente la misma URL (mismo protocolo, mismo dominio, sin barra al final).

---

### ❌ `Mixed Content` bloqueado por el navegador

**Causa:** La app sirve HTTPS pero está intentando hacer peticiones a una URL HTTP (por ejemplo, si `VITE_API_BASE_URL` comienza con `http://`).

**Solución:** Asegurarse de que `VITE_API_BASE_URL=https://tudominio.com/api` (con `https`).

---

### ❌ Socket.IO no conecta en producción

**Causa:** Nginx no tiene configurado el proxy de WebSocket.

**Solución:** Asegurarse de que el bloque `location /socket.io/` en Nginx incluye los headers de upgrade:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

---

### ❌ El certificado SSL muestra advertencia en el navegador

**Causa:** Se está usando un certificado autofirmado o el certificado de Let's Encrypt no fue generado correctamente.

**Solución:** Ejecutar el comando de Certbot manualmente para obtener el certificado:
```bash
docker-compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d tudominio.com \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email
```

---

*Documento generado como referencia técnica. Para cambios en la arquitectura, actualizar este documento.*
