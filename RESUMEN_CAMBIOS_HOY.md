# Resumen de Cambios - Actualizaciones del Buscador y Seguridad PriceCharting

Este documento detalla los cambios realizados hoy en el proyecto para mejorar la seguridad de las actualizaciones de precio y perfeccionar la lógica del buscador de cartas.

## 1. Seguridad en la Actualización de Precios (PriceCharting)
**Objetivo:** Evitar abusos (como ataques DDoS) en el endpoint que fuerza la actualización de precios de PriceCharting, restringiendo su uso únicamente a los administradores.

*   **Frontend (`frontend/src/detalleCarta.jsx`):** 
    *   Se ocultó el botón de "Forzar Actualización" (🔄) y el botón de "Reintentar" a los usuarios normales. Ahora solo son visibles si `user?.role === 'admin'`.
    *   Se incluyó el envío del token de autorización (JWT) en los headers del `fetch` al servidor cuando se pide forzar la actualización de precios.
*   **Backend (`backend/src/controllers/priceChartingController.js`):** 
    *   Se añadió validación en vivo del JWT. Si un usuario envía el query param `?forzar=true`, el backend verifica el token para asegurar que pertenezca a un administrador antes de omitir la caché y realizar la petición directa a la API de PriceCharting.

## 2. Búsqueda Inteligente (Nombres + Sets con varias palabras)
**Objetivo:** Permitir que los usuarios escriban el nombre del Pokémon seguido del set (incluso si el set tiene múltiples palabras o está incompleto), sin que la base de datos se confunda.

*   **Backend (`backend/src/services/busquedaBDService.js`):**
    *   **Identificación de sets compuestos:** La función `manejarVariasPalabras` ahora verifica si el texto completo introducido contiene los nombres íntegros de algún set (ej. prioriza buscar el set "surging sparks" antes de separar el texto palabra por palabra). Antes, al separarlo, detectaba solo "surging" y dejaba "sparks" colgado junto al nombre del Pokémon.
    *   **Fallback seguro de palabras parciales:** Si no se escribe un set completo, el sistema empieza a leer la búsqueda de derecha a izquierda tratando de relacionar la última palabra con un set (p. ej., reconocer "surgin" como "surging sparks").
    *   **Protección contra sets engañosos:** Se añadió una validación para evitar que el buscador crea accidentalmente que el nombre del Pokémon es el set en búsquedas mixtas, omitiendo palabras únicas muy genéricas (como por ejemplo "Pikachu", el cual el sistema solía tomar como set debido a que existe "Detective Pikachu").

## 3. Redirección Flexible ante Cartas Promocionales o No Encontradas
**Objetivo:** Mejorar el flujo del usuario que busca cartas exclusivas o promocionales que no figuran en la base de datos.

*   **Palabras Clave (`backend/src/helpers/promoKeywords.js`):** 
    *   Se enriqueció el codex de palabras promocionales agregando términos como `hat` y `poncho`, a fin de identificar correctamente búsquedas del estilo "Pikachu hat".
*   **Mensaje Dinámico (`backend/src/services/busquedaBDService.js` y `frontend/src/detalleCarta.jsx`):** 
    *   Cuando el la base de datos no arroja resultados pero identifica alguna de estas palabras clave, la interfaz muestra de forma amistosa el aviso: *"Parece que esta carta es una promoción exclusiva o muy rara"*.
    *   La página de Carta no Encontrada ahora ofrece **dos botones de redirección** en lugar de uno, usando dinámicamente el mismo término ingresado por el usuario:
        *   📈 Buscar la carta en **PriceCharting**
        *   🌐 Buscar la carta en **Pokumon.com**
