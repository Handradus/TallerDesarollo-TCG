-- Crear tabla para historial de cartas accedidas
CREATE TABLE IF NOT EXISTS historial_cartas (
    id SERIAL PRIMARY KEY,
    carta_id INTEGER NOT NULL,
    fecha_acceso TIMESTAMP DEFAULT NOW(),
    ip_usuario VARCHAR(45), -- Para diferenciar usuarios por IP (opcional)
    FOREIGN KEY (carta_id) REFERENCES cartas(id) ON DELETE CASCADE
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_historial_cartas_fecha ON historial_cartas(fecha_acceso DESC);
CREATE INDEX IF NOT EXISTS idx_historial_cartas_carta_id ON historial_cartas(carta_id);

-- Crear tabla para historial de tiendas visitadas
CREATE TABLE IF NOT EXISTS historial_tiendas (
    id SERIAL PRIMARY KEY,
    tienda_id INTEGER NOT NULL,
    fecha_visita TIMESTAMP DEFAULT NOW(),
    ip_usuario VARCHAR(45), -- Para diferenciar usuarios por IP (opcional)
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_historial_tiendas_fecha ON historial_tiendas(fecha_visita DESC);
CREATE INDEX IF NOT EXISTS idx_historial_tiendas_tienda_id ON historial_tiendas(tienda_id);

-- Comentarios para documentación
COMMENT ON TABLE historial_cartas IS 'Almacena el historial de cartas accedidas para mostrar en carousel';
COMMENT ON TABLE historial_tiendas IS 'Almacena el historial de tiendas visitadas para mostrar en carousel';
