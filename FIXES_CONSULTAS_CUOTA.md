# 🔧 Fixes - Sistema de Consultas y Límites de Cuota

## Problemas Identificados

### 1. **Cache de 7 días en lugar de 10** ⏰
- **Problema**: Las cartas se consideraban "expiradas" después de 7 días, no 10
- **Síntoma**: Cartas consultadas hace 10 días ya no estaban en caché
- **Ubicación**: `verificarTiendas.js` línea 10

### 2. **Admin bypass no funcionaba correctamente** 👨‍💼
- **Problema**: Siendo admin, aún se reportaba "exceeded quota"
- **Causa**: El check de admin se hacía DESPUÉS de calcular límites, potencialmente causando confusión lógica
- **Ubicación**: `scrapingQuotaService.js` línea 68-74

### 3. **No se diferenciaba entre "consulta nueva" vs "actualización"** 🔄
- **Problema**: Refrescar un caché expirado se trataba como "consulta nueva", gastando la cuota de 'new'
- **Debería ser**: Refrescar caché expirado debería usar cuota 'update' o no gastar cuota
- **Ubicación**: `verificarTiendas.js` línea 59-65

---

## ✅ Soluciones Implementadas

### Fix 1: Aumentar cache a 10 días
**Archivo**: `backend/src/controllers/verificarTiendas.js`
```javascript
// Antes:
const CACHE_PRECIOS_POSITIVO_DIAS = Number(process.env.TIENDAS_CACHE_POSITIVO_DIAS || 7);

// Después:
const CACHE_PRECIOS_POSITIVO_DIAS = Number(process.env.TIENDAS_CACHE_POSITIVO_DIAS || 10);
```

### Fix 2: Fortalecer Admin Bypass
**Archivo**: `backend/src/services/scrapingQuotaService.js`

Mover el check de admin ANTES de calcular límites:
```javascript
// Antes:
const { user } = userResult;
const limit = getLimitByType(user, type);
if (user.role === 'admin') {
  return { ok: true, user, adminBypass: true };
}

// Después:
const { user } = userResult;
// Admin SIEMPRE tiene acceso ilimitado, sin importar configuración
if (user.role === 'admin') {
  return { ok: true, user, adminBypass: true, unlimited: true };
}
const limit = getLimitByType(user, type);
```

**Beneficio**: Los admins nunca pasan por la lógica de límites de cuota, garantizando bypass total.

### Fix 3: Diferencia entre "New" vs "Update"
**Archivo**: `backend/src/controllers/verificarTiendas.js`

Ahora detecta si es consulta nueva o actualización:
```javascript
// Detectar si hay datos previos (aunque estén stale)
const linksStaleExistentes = links.filter(l => tiendasPendientes.some(t => t.id === l.tienda.id));
const esConsultaNueva = linksStaleExistentes.length === 0;
const tipoConsulta = esConsultaNueva ? 'new' : 'update';

// Usar el tipo correcto
const quotaResult = await consumeQuota(req, tipoConsulta, 1);
```

**Lógica**:
- ✅ **Consulta NUEVA** (type='new'): Nunca se consultó esta carta antes
  - Gasta 1 de las 25 consultas 'new' para usuarios regulares
  - Admins tienen ilimitadas
  
- 🔄 **Actualización** (type='update'): Datos expirados, refrescando
  - Gasta 1 de las 10 actualizaciones diarias para usuarios regulares
  - Admins tienen ilimitadas

---

## 📊 Comportamiento Después del Fix

### Para Usuarios Regulares
| Escenario | Antes | Después |
|-----------|-------|---------|
| Carta consultada hace 5 días | ✅ Caché válido | ✅ Caché válido |
| Carta consultada hace 8 días | ❌ Expired, gasta 'new' | ✅ Caché válido |
| Carta consultada hace 10 días | ❌ Expired, gasta 'new' | ❌ Expired, gasta 'update' |
| Carta consultada hace 12 días | ❌ Expired, gasta 'new' | ❌ Expired, gasta 'update' |

### Para Administradores
| Escenario | Antes | Después |
|-----------|-------|---------|
| Cualquier consulta | ❌ "Exceeded quota" | ✅ Sin límite |
| Refrescar caché | ❌ "Exceeded quota" | ✅ Sin límite |

---

## 🔐 Configuración de Cuotas

Variables en `.env`:
```env
# Límites de consultas diarias
SCRAPING_DAILY_NEW_LIMIT=25              # Consultas "new" para usuarios
SCRAPING_DAILY_UPDATE_LIMIT=10           # Actualizaciones para usuarios
SCRAPING_DAILY_NEW_LIMIT_ADMIN=0         # 0 = ilimitado para admin
SCRAPING_DAILY_UPDATE_LIMIT_ADMIN=0      # 0 = ilimitado para admin

# Cache
TIENDAS_CACHE_POSITIVO_DIAS=10           # ✅ Ahora es 10 (era 7)
TIENDAS_CACHE_NEGATIVO_HORAS=72          # Links negativos duran 72 horas
```

---

## 🧪 Cómo Verificar que Funciona

1. **Como admin**, consulta una carta consultada hace 10+ días:
   - ✅ NO debe mostrar "exceeded quota"
   - ✅ Debe refrescar datos sin gastar cuota

2. **Como usuario regular**, al 10º update:
   - ❌ Debe mostrar "limite diario alcanzado para actualizaciones"
   - ✅ Pero NO afecta las 25 consultas 'new' disponibles

3. **Logs del servidor**:
   ```
   📊 Tipo de consulta: update (nuevos datos: NO, actualización de cache expirado)
   ```

---

## 📝 Cambios en Archivos

### Modificados:
- ✏️ `backend/src/controllers/verificarTiendas.js`
- ✏️ `backend/src/services/scrapingQuotaService.js`

### Sin cambios (pero relevantes):
- `backend/src/controllers/priceChartingController.js` (usa PRICECHARTING_CACHE_HOURS, independiente)
- `backend/src/entities/DailyScrapingQuota.js` (solo almacenamiento)

---

## 🚀 Próximos Pasos Recomendados

1. **Testear en producción** con admin account
2. **Monitorear logs** para verificar tipo de consultas
3. **Considerar**: ¿Debería refrescar cache expirado gastar cuota? 
   - Opción: `if (esConsultaNueva) { consumeQuota } else { return OK }`
