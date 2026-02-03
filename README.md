# Taller Desarrollo TCG - Pokémon Marketplace

Plataforma de compra, venta e intercambio de cartas Pokémon, con funcionalidades de tiempo real y administración.

## 🚀 Funcionalidades Principales

### 👤 Usuarios y Perfiles
*   **Autenticación segura**: Login con Google (OAuth 2.0).
*   **Perfiles Públicos**: Visualización de reputación, redes sociales y tiendas de usuarios.
*   **Roles**: Sistema de roles (Usuario, Admin, Tienda) para acceso diferenciado.

### 🏪 Mercado y Tienda
*   **Publicación de Cartas**: Los usuarios pueden vender cartas de su colección.
*   **Filtros Avanzados**: Búsqueda por precio, set, rareza y tipo de venta (Online/Presencial).
*   **Gestión de Stock**: Control de inventario y estado de las cartas.
*   **Tiendas Físicas**: Directorio de tiendas colaboradoras con geolocalización (Región).

### 📨 Comunicación en Tiempo Real
*   **Mensajería Instantánea**: Chat entre comprador y vendedor usando WebSockets (`socket.io`).
*   **Notificaciones**: Alertas inmediatas de nuevos mensajes sin recargar la página.

### 🛡️ Seguridad y Administración
*   **Panel de Administración**: Herramientas para moderar sugerencias de tiendas y gestionar contenido.
*   **Protección de API**: Rate Limiting para evitar ataques de fuerza bruta/spam.
*   **Validación de Datos**: Backend robusto con TypeORM y PostgreSQL.

---

## 🛠️ Guía de Instalación

Sigue estos pasos para configurar el proyecto desde cero.

### 1. Requisitos Previos
*   Node.js (v18 o superior)
*   PostgreSQL (Base de datos)

### 2. Configuración del Backend
Abre una terminal en la carpeta `/backend`:

```bash
cd backend

# Instalar dependencias
npm install express cors dotenv pg typeorm reflect-metadata multer jsonwebtoken google-auth-library socket.io express-rate-limit

# Instalar dependencias de desarrollo
npm install -D nodemon
```

**Variables de Entorno (.env en /backend):**
Crea un archivo `.env` con lo siguiente:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=postgres
JWT_SECRET=tu_secreto_super_seguro
GOOGLE_CLIENT_ID=tu_google_client_id
```

### 3. Configuración del Frontend
Abre una terminal en la carpeta `/frontend`:

```bash
cd frontend

# Instalar dependencias
npm install react-router-dom axios @react-oauth/google socket.io-client
```

**Variables de Entorno (.env en /frontend):**
Crea un archivo `.env` con lo siguiente:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
```

---

## ▶️ Ejecución

Para correr el proyecto, necesitas dos terminales abiertas:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Abra su navegador en `http://localhost:5173`.
