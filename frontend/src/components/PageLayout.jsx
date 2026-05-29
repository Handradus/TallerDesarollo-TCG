import AdSenseSlot from './AdSenseSlot';
import { Link } from 'react-router-dom';
import '../css/pageLayout.css';

/**
 * PageLayout — Envuelve el contenido central con columnas laterales publicitarias
 *
 * Estructura:
 *  ┌──────────────┬────────────────────┬──────────────┐
 *  │  [Holder]    │                    │  [Holder]    │
 *  │  (banner)    │   children         │  (banner)    │
 *  │              │   (contenido)      │              │
 *  │  [AdSense]   │                    │  [AdSense]   │
 *  └──────────────┴────────────────────┴──────────────┘
 */
export default function PageLayout({ children }) {
  return (
    <div className="page-layout-wrapper">
      {/* ---- Columna izquierda ---- */}
      <aside className="page-layout-sidebar page-layout-sidebar--left" aria-label="Publicidad izquierda">
        {/* Holder grande (banner personalizable) */}
        <Link to="/contacto" className="sidebar-holder sidebar-holder--top" style={{ textDecoration: 'none' }}>
          <div className="sidebar-holder-inner">
            <span className="sidebar-holder-icon">⚡</span>
            <span className="sidebar-holder-label">Tu anuncio aquí</span>
            <span className="sidebar-holder-sub">160 × 300 px</span>
            <span className="sidebar-holder-cta">Contáctanos →</span>
          </div>
          <div className="sidebar-shimmer" />
        </Link>

        {/* Slot AdSense */}
        <AdSenseSlot
          slotId="1234567890"      // ← Reemplaza con tu Slot ID real
          format="rectangle"
          className="sidebar-adsense"
          placeholderLabel="AdSense 160×300"
          placeholderIcon="📣"
          style={{ minHeight: '280px' }}
        />
      </aside>

      {/* ---- Contenido central ---- */}
      <main className="page-layout-content">
        {children}

        {/* Footer */}
        <footer style={{ marginTop: '40px', padding: '20px 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <img 
                src="/icono_web_poke.png" 
                alt="Cartateca Icon" 
                style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
              />
              <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '1px' }}>CARTATECA</span>
            </div>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>© 2026 Todos los derechos reservados.</span>
          </div>
        </footer>
      </main>

      {/* ---- Columna derecha ---- */}
      <aside className="page-layout-sidebar page-layout-sidebar--right" aria-label="Publicidad derecha">
        {/* Holder grande */}
        <Link to="/contacto" className="sidebar-holder sidebar-holder--top" style={{ textDecoration: 'none' }}>
          <div className="sidebar-holder-inner">
            <span className="sidebar-holder-icon">🎴</span>
            <span className="sidebar-holder-label">Tu anuncio aquí</span>
            <span className="sidebar-holder-sub">160 × 300 px</span>
            <span className="sidebar-holder-cta">Contáctanos →</span>
          </div>
          <div className="sidebar-shimmer" />
        </Link>

        {/* Slot AdSense */}
        <AdSenseSlot
          slotId="0987654321"      // ← Reemplaza con tu Slot ID real
          format="rectangle"
          className="sidebar-adsense"
          placeholderLabel="AdSense 160×300"
          placeholderIcon="📣"
          style={{ minHeight: '280px' }}
        />
      </aside>
    </div>
  );
}
