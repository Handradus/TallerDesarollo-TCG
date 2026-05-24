import React, { useState } from 'react';
import './css/admin-precios.css';

export default function AdminPrecios() {
  const [cartaId, setCartaId] = useState('2051');
  const [resultado, setResultado] = useState('');
  const [tipoResultado, setTipoResultado] = useState('');
  const [cargando, setCargando] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const API_BASE = `${apiUrl}/api`;

  const mostrarResultado = (contenido, tipo = 'success') => {
    setResultado(contenido);
    setTipoResultado(tipo);
  };

  const mostrarCargando = (mensaje) => {
    setCargando(true);
    mostrarResultado(mensaje, 'loading');
  };

  const obtenerNormal = async () => {
    if (!cartaId) {
      mostrarResultado('Por favor ingresa un ID de carta', 'error');
      return;
    }

    mostrarCargando('🔍 Obteniendo precios normales (puede usar cache)...');

    try {
      console.log(`Intentando conectar a: ${API_BASE}/cartas/${cartaId}/tiendas`);
      const response = await fetch(`${API_BASE}/cartas/${cartaId}/tiendas`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data);

      mostrarResultado(
        `✅ PRECIOS NORMALES OBTENIDOS:\n\n${JSON.stringify(data, null, 2)}`,
        'success'
      );
    } catch (error) {
      console.error('Error completo:', error);
      mostrarResultado(`❌ Error: ${error.message}`, 'error');
    } finally {
      setCargando(false);
    }
  };

  const forzarActualizacion = async () => {
    if (!cartaId) {
      mostrarResultado('Por favor ingresa un ID de carta', 'error');
      return;
    }

    mostrarCargando('🔥 FORZANDO actualización completa... Esto puede tomar varios minutos...');

    try {
      console.log(`Intentando conectar a: ${API_BASE}/admin/carta/${cartaId}/forzar-precios`);
      const response = await fetch(`${API_BASE}/admin/carta/${cartaId}/forzar-precios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Admin Response status:', response.status);
      console.log('Admin Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Admin Data received:', data);

      mostrarResultado(
        `🔥 ACTUALIZACIÓN FORZADA COMPLETADA!\n\n` +
        `📊 Total tiendas: ${data.totalTiendas}\n` +
        `🔗 Links encontrados: ${data.linksEncontrados}\n` +
        `⏰ Timestamp: ${data.timestamp}\n\n` +
        `📋 Detalles:\n${JSON.stringify(data, null, 2)}`,
        'success'
      );
    } catch (error) {
      console.error('Error completo admin:', error);
      mostrarResultado(`❌ Error: ${error.message}`, 'error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="admin-precios-container">
      <div className="admin-header">
        <h1>🛠️ Admin - Gestión de Precios de Cartas</h1>
        <p>Herramienta para forzar actualización de precios sin cache</p>
      </div>

      <div className="admin-content">
        <div className="form-group">
          <label htmlFor="cartaId">ID de la Carta:</label>
          <input
            type="number"
            id="cartaId"
            value={cartaId}
            onChange={(e) => setCartaId(e.target.value)}
            placeholder="Ej: 2051"
            disabled={cargando}
          />
        </div>

        <div className="btn-group">
          <button
            className="btn-normal"
            onClick={obtenerNormal}
            disabled={cargando}
          >
            📊 Obtener Precios Normal (con cache)
          </button>
          <button
            className="btn-admin"
            onClick={forzarActualizacion}
            disabled={cargando}
          >
            {cargando ? '⏳ Procesando...' : '🔥 FORZAR Actualización Completa (admin)'}
          </button>
        </div>

        {resultado && (
          <div className={`resultado ${tipoResultado}`}>
            <pre>{resultado}</pre>
          </div>
        )}

        <div className="info-panel">
          <h3>📋 Información</h3>
          <div className="info-item">
            <strong>� URL Base:</strong> {API_BASE}
          </div>
          <div className="info-item">
            <strong>🟢 Endpoint Normal:</strong> GET {API_BASE}/cartas/{cartaId}/tiendas
          </div>
          <div className="info-item">
            <strong>🔥 Endpoint Admin:</strong> POST {API_BASE}/admin/carta/{cartaId}/forzar-precios
          </div>
          <div className="info-item">
            <strong>�🟢 Obtener Normal:</strong> Usa el cache de 24 horas. Si los datos son recientes, los mostrará sin hacer scraping.
          </div>
          <div className="info-item">
            <strong>🔥 Forzar Actualización:</strong> Ignora completamente el cache y hace scraping en todas las 21 tiendas activas. Proceso más lento pero garantiza datos frescos.
          </div>
          <div className="info-item">
            <strong>⏱️ Tiempo estimado:</strong> La actualización forzada puede tomar de 30 segundos a 2 minutos dependiendo de la respuesta de las tiendas.
          </div>
        </div>
      </div>
    </div>
  );
}
