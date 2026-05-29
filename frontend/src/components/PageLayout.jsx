import React, { useState } from 'react';
import AdSenseSlot from './AdSenseSlot';
import { Link } from 'react-router-dom';
import { EULA_CLAUSES } from '../utils/eula';
import '../css/pageLayout.css';

/**
 * PageLayout — Envuelve el contenido central con columnas laterales publicitarias y Footer global premium
 */
export default function PageLayout({ children }) {
  const [showEula, setShowEula] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

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
      <main className="page-layout-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '85vh' }}>
        <div style={{ flexGrow: 1 }}>
          {children}
        </div>

        {/* Global Premium Footer */}
        <footer className="global-footer" style={{
          marginTop: '50px',
          padding: '25px 20px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          textAlign: 'center',
          color: 'rgba(248, 250, 252, 0.95)'
        }}>
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowAbout(true)} 
              className="footer-action-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                textDecoration: 'underline',
                transition: 'opacity 0.2s'
              }}
            >
              ℹ️ Sobre Nosotros
            </button>
            <button 
              onClick={() => setShowEula(true)} 
              className="footer-action-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                textDecoration: 'underline',
                transition: 'opacity 0.2s'
              }}
            >
              ⚖️ Términos y Condiciones
            </button>
            <a 
              href="mailto:softguaren@gmail.com" 
              className="footer-action-btn"
              style={{
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                textDecoration: 'underline',
                transition: 'opacity 0.2s'
              }}
            >
              ✉️ Correo de Soporte
            </a>
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

      {/* Modal EULA (Consulta) */}
      {showEula && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setShowEula(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '650px',
              width: '92%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '25px',
              borderRadius: '16px',
            }}
          >
            <button className="modal-close" onClick={() => setShowEula(false)}>&times;</button>
            <h2 style={{
              marginTop: 0,
              marginBottom: '15px',
              color: '#1a202c',
              fontSize: '1.4rem',
              borderBottom: '2px solid #edf2f7',
              paddingBottom: '10px'
            }}>
              ⚖️ Términos y Condiciones de Uso
            </h2>
            
            <div
              style={{
                flexGrow: 1,
                overflowY: 'auto',
                paddingRight: '10px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '15px',
                background: '#f8fafc',
                textAlign: 'left',
                fontSize: '0.9rem',
                color: '#4a5568',
                lineHeight: '1.6'
              }}
            >
              {EULA_CLAUSES.map((clause) => (
                <div key={clause.id} style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1rem', color: '#2d3748', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    {clause.title}
                  </h3>
                  {clause.paragraphs.map((p, idx) => (
                    <p key={idx} style={{ margin: '0 0 8px 0', textIndent: p.startsWith('*') ? '15px' : '0' }}>
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px', borderTop: '1px solid #edf2f7', paddingTop: '15px' }}>
              <button 
                className="btn-primary" 
                onClick={() => setShowEula(false)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sobre Nosotros */}
      {showAbout && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setShowAbout(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '92%',
              padding: '25px',
              borderRadius: '16px',
            }}
          >
            <button className="modal-close" onClick={() => setShowAbout(false)}>&times;</button>
            <h2 style={{
              marginTop: 0,
              marginBottom: '15px',
              color: '#1a202c',
              fontSize: '1.4rem',
              borderBottom: '2px solid #edf2f7',
              paddingBottom: '10px'
            }}>
              ℹ️ Sobre Cartateca
            </h2>

            <div style={{ textAlign: 'left', color: '#4a5568', lineHeight: '1.6', fontSize: '0.95rem' }}>
              <p>
                <strong>Cartateca</strong> es una plataforma diseñada para coleccionistas e intermediarios del juego de cartas Pokémon TCG.
              </p>
              <p>
                Nuestra misión es proveer una interfaz limpia, veloz y altamente premium que facilite a la comunidad la búsqueda de cartas, la gestión de colecciones personales, la consulta de precios del mercado y el intercambio seguro de cartas.
              </p>
              <p style={{ margin: '15px 0', padding: '10px', background: '#f7fafc', borderRadius: '8px', borderLeft: '4px solid #764ba2' }}>
                📧 <strong>Contacto Legal y Soporte:</strong> <a href="mailto:softguaren@gmail.com" style={{ color: '#764ba2', fontWeight: 'bold' }}>softguaren@gmail.com</a>
              </p>
              <p style={{ fontSize: '0.85rem', color: '#718096', margin: '20px 0 0 0' }}>
                Cartateca ™ 2026. Todos los derechos reservados. Desarrollado con pasión por y para la comunidad.
              </p>
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px', borderTop: '1px solid #edf2f7', paddingTop: '15px' }}>
              <button 
                className="btn-primary" 
                onClick={() => setShowAbout(false)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
