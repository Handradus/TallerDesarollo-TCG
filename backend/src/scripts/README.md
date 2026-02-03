# Scripts de Migración TCG

Este directorio contiene los scripts necesarios para migrar los datos de `pokemon-tcg-data-master` a tu base de datos.

## 📋 Scripts disponibles

### 1. `analizarEstructuraTCG.js`
Analiza la estructura de los datos antes de migrar.

```bash
node src/scripts/analizarEstructuraTCG.js
```

**¿Qué hace?**
- Verifica que existan los archivos de datos
- Cuenta sets y archivos de cartas
- Muestra ejemplos de la estructura de datos
- Estima el total de cartas a migrar
- Verifica correspondencias entre sets y archivos

### 2. `verificarBD.js`
Verifica el estado actual de tu base de datos.

```bash
# Verificar estado actual
node src/scripts/verificarBD.js

# ⚠️ Limpiar tabla completa (usar con cuidado)
node src/scripts/verificarBD.js clean
```

**¿Qué hace?**
- Muestra estadísticas de cartas actuales
- Analiza distribución por sets, tipos y rareza  
- Verifica integridad de datos
- Muestra ejemplos de cartas existentes
- Opción para limpiar tabla completa

### 3. `migrarDatosTCG.js`
Ejecuta la migración completa de datos.

```bash
# Migrar datos (sin limpiar tabla)
node src/scripts/migrarDatosTCG.js

# Limpiar tabla antes de migrar
node src/scripts/migrarDatosTCG.js clean
```

**¿Qué hace?**
- Carga información de sets desde `sets/en.json`
- Procesa todos los archivos de cartas
- Hace JOIN entre cartas y sets
- Evita duplicados
- Inserta cartas en la base de datos
- Muestra progreso y estadísticas

## 🚀 Proceso recomendado

### Paso 1: Análisis inicial
```bash
cd backend
node src/scripts/analizarEstructuraTCG.js
```

### Paso 2: Verificar BD actual
```bash
node src/scripts/verificarBD.js
```

### Paso 3: (Opcional) Limpiar BD
```bash
# Solo si quieres empezar desde cero
node src/scripts/verificarBD.js clean
```

### Paso 4: Migrar datos
```bash
node src/scripts/migrarDatosTCG.js
```

### Paso 5: Verificar migración
```bash
node src/scripts/verificarBD.js
```

## 📊 Datos esperados

Basado en el análisis de `pokemon-tcg-data-master`:

- **Sets**: ~200+ sets desde Base (1999) hasta Scarlet & Violet
- **Cartas**: ~30,000+ cartas totales
- **Archivos**: 168 archivos JSON de cartas
- **Cobertura**: Todos los sets oficiales de Pokémon TCG

## 🔧 Mapeo de campos

| Tu BD | JSON Data | Notas |
|-------|-----------|-------|
| `nombre` | `name` | ✅ |
| `numero` | `number` | ✅ |
| `set` | JOIN con `sets/en.json` → `name` | 🔗 |
| `setId` | Nombre del archivo JSON | 🔗 |
| `serie` | JOIN con `sets/en.json` → `series` | 🔗 |
| `printedTotal` | JOIN con `sets/en.json` → `printedTotal` | 🔗 |
| `evolucionaA` | `evolvesTo` | 📝 Mapeo corregido |
| `imagenPequena` | `images.small` | ✅ |
| `imagenGrande` | `images.large` | ✅ |
| Precios | `null` | 💰 Se mantienen vacíos |

## ⚠️ Consideraciones importantes

1. **Tiempo de ejecución**: La migración puede tomar varios minutos
2. **Memoria**: Se procesan archivos en lotes para evitar sobrecarga
3. **Duplicados**: Se evitan automáticamente basándose en `numero` + `set`
4. **Errores**: Se reportan pero no detienen el proceso
5. **Backup**: Recomendado hacer backup de BD antes de migrar

## 🐛 Solución de problemas

### Error: "Archivo no encontrado"
- Verifica que `pokemon-tcg-data-master` esté en `backend/pokemon-tcg-data-master/`
- Asegúrate de que existan las carpetas `sets/` y `cards/en/`

### Error de conexión a BD
- Verifica tu archivo `.env` con credenciales correctas
- Asegúrate de que PostgreSQL esté corriendo
- Confirma que la base de datos `tcg_pokemon` exista

### Migración lenta
- Es normal, ~30,000 cartas toman tiempo
- El script muestra progreso cada 100 cartas
- Los archivos se procesan en lotes de 10

### Memoria insuficiente
- El script está optimizado para usar poca memoria
- Si persiste, reinicia el proceso (evita duplicados automáticamente)

## 📝 Logs y debugging

Los scripts muestran información detallada:
- ✅ Operaciones exitosas
- ⚠️ Advertencias
- ❌ Errores (no fatales)
- 💥 Errores fatales
- 📊 Estadísticas y progreso

## 🎯 Resultado esperado

Después de la migración tendrás:
- Base de datos poblada con ~30,000 cartas
- Información completa de sets y series
- Imágenes vinculadas (small y large)
- Estructura lista para tu sistema de búsqueda
- Datos preparados para scraping de precios
