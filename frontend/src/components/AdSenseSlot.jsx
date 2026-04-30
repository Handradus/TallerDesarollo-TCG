import { useEffect, useRef } from 'react';

/**
 * AdSenseSlot — Componente para integrar Google AdSense
 *
 * CÓMO CONFIGURAR ADSENSE:
 * 1. Registra tu sitio en https://adsense.google.com
 * 2. Espera la aprobación de Google
 * 3. Obtén tu Publisher ID (ca-pub-XXXXXXXXXX)
 * 4. En index.html agrega:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>
 * 5. Cambia ADSENSE_CLIENT y ADSENSE_SLOT_ID por los valores reales de tu cuenta
 * 6. Cambia ADSENSE_ENABLED a true
 */

// ====================================================
// CONFIGURACIÓN — Edita estos valores cuando tengas cuenta
// ====================================================
const ADSENSE_ENABLED = false;               // Cambiar a true cuando tengas aprobación
const ADSENSE_CLIENT  = 'ca-pub-XXXXXXXXXX'; // Tu Publisher ID de Google AdSense
// Los slot IDs son únicos por bloque de anuncio — los obtienes en el panel de AdSense
// ====================================================

export default function AdSenseSlot({
  slotId,          // ID del slot de AdSense (lo obtienes en el panel)
  format = 'auto', // 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  style = {},
  className = '',
  placeholderLabel = 'Google AdSense',
  placeholderIcon  = '📣',
}) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Solo ejecutar si AdSense está habilitado y el componente está montado
    if (!ADSENSE_ENABLED || pushed.current) return;
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch (e) {
      console.warn('[AdSense] Error al cargar el slot:', e);
    }
  }, []);

  // ---- Modo placeholder (antes de tener aprobación AdSense) ----
  if (!ADSENSE_ENABLED) {
    return (
      <div
        className={`adsense-placeholder ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: style.minHeight || '120px',
          background: 'linear-gradient(135deg, rgba(30,30,50,0.85), rgba(20,20,40,0.95))',
          border: '1.5px dashed rgba(255,255,255,0.15)',
          borderRadius: '10px',
          gap: '6px',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        {/* Patrón decorativo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }} />
        {/* Badge Google */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.05em',
          fontWeight: 600,
        }}>
          Google AdSense
        </div>
        <span style={{ fontSize: '1.5rem', zIndex: 1 }}>{placeholderIcon}</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', zIndex: 1, textAlign: 'center' }}>
          {placeholderLabel}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', zIndex: 1, textAlign: 'center', maxWidth: '90%' }}>
          Slot en espera de aprobación
        </span>
      </div>
    );
  }

  // ---- Modo real AdSense ----
  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', width: '100%', ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
