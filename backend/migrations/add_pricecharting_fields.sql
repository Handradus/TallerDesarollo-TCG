-- Agregar campos para precios de PriceCharting
ALTER TABLE cartas 
ADD COLUMN IF NOT EXISTS precioPriceCharting DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS precioGradedPriceCharting DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fechaActualizacionPrecios TIMESTAMP;

-- Crear índice para mejorar performance de consultas por fecha
CREATE INDEX IF NOT EXISTS idx_cartas_fecha_actualizacion ON cartas(fechaActualizacionPrecios);
