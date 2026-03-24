# Pokémon TCG Marketplace & Collection Manager - Project Context

Este documento sirve como referencia rápida de la arquitectura, stack tecnológico y características principales del proyecto para facilitar el contexto en futuras sesiones de desarrollo.

## 🛠️ Stack Tecnológico
**Frontend:**
- React (creado con Vite).
- React Router DOM para navegación.
- Axel/Axios para consumo de APIs.
- CSS puro para el estilado.

**Backend:**
- Node.js con Express.
- TypeORM como ORM relacional.
- JWT y Google OAuth para la autenticación de usuarios.
- Socket.io (configurado en el servidor).

## 🗄️ Entidades Principales (Base de Datos)
1. **User (`User.js`)**: Maneja los usuarios autenticados por Google. El correo `softguaren@gmail.com` tiene asignado el rol de `admin` por defecto.
2. **Carta (`Carta.js`)**: Almacena de información técnica básica de las cartas de Pokémon (Set, Rareza, HP, Tipos, Ataques, etc.).
3. **MarketItem (`MarketItem.js`)**: Publicaciones de los usuarios en el **Mercado**. Relaciona a un `User` (vendedor) con una `Carta`, y añade un precio, descripción e imagen real subida por el usuario.
4. **UserCollection / CustomCollection**: Sistema de recolección de cartas. Los usuarios pueden crear carpetas (`CustomCollection`) y añadir copias de cartas (`UserCollection`) especificando características únicas como `condition` (NM, HP), `language` y `foilType` de la carta física.
5. **Report (`Report.js`)**: Permite a la comunidad reportar de publicaciones engañosas o falsas en el Mercado.
6. **Tiendas**: Registro de tiendas externas, integradas al detalle de cada carta.

## 🌟 Funcionalidades Clave
- **Mercado (Compra y Venta)**: Los usuarios pueden publicar las cartas físicas que poseen y visualizar publicaciones de terceros para negociaciones/compra. Las publicaciones pueden ser reportadas y moderadas por un Admin.
- **Gestión de Colecciones (Binders)**: Los usuarios organizan sus cartas en colecciones Generales o carpetas Personalizadas ("Binders"), indicando métricas precisas del estado físico, el idioma del print y el acabado holográfico de cada unidad.
- **Rastreo de Precios Reales**: El sistema consulta y guarda referencias de precio usando los repositorios de **TCGPlayer** y **PriceCharting** para estimar el valor total o unitario de elementos de la colección y mercado.
- **Panel de Administrador (`AdminReportes`, `AdminModeracion`)**: Dashboard protegido que permite a los admins resolver conflictos (como revisar banderas rojas y borrar publicaciones) y gestionar adiciones al sistema.

## 📁 Estructura del Proyecto
- `/backend/src/entities/`: Definiciones de tablas (TypeORM).
- `/backend/src/controllers/`: Lógica de negocios e interacción con la BD.
- `/backend/src/routes/`: Declaración de endpoints del API REST.
- `/frontend/src/`: Componentes modulares de React `.jsx` y hojas de estilo `.css`. Destacan `Mercado.jsx`, `Coleccion.jsx`, y `detalleCarta.jsx`.

> **Nota para el Agente**: Cuando seas agregado a una nueva conversación en el futuro, puedes acceder permanentemente a este archivo en la raíz del proyecto para leer de qué trata todo antes de requerir mayor contexto por parte del usuario.
