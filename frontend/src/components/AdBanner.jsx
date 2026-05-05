import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdSenseSlot from './AdSenseSlot';
import '../css/adBanner.css';

/**
 * AdBanner — Fila inferior de publicidad
 *
 * Layout "bottom":  [Banner 1] [AdSense] [Banner 2] [AdSense]
 * Layout "horizontal": 4 banners personalizados en fila
 * Layout "grid":    2×2 banners personalizados
 *
 * Props:
 *  - layout: 'bottom' | 'horizontal' | 'grid'
 *  - adsenseSlots: array de 2 slot IDs de AdSense (solo aplica para layout='bottom')
 */

const DEFAULT_BANNERS = [
  {
    id: 'banner-1',
    imageUrl: null,
    linkUrl: '/contacto',
    altText: 'Publicidad 1',
    label: 'Tu anuncio aquí',
    sublabel: 'Banner 300 × 100 px',
    accentColor: '#667eea',
    icon: '⚡',
  },
  {
    id: 'banner-2',
    imageUrl: null,
    linkUrl: '/contacto',
    altText: 'Publicidad 2',
    label: 'Tu anuncio aquí',
    sublabel: 'Banner 300 × 100 px',
    accentColor: '#43e97b',
    icon: '🌟',
  },
];

// Slot IDs de AdSense para la barra inferior — reemplaza con los reales
const BOTTOM_ADSENSE_SLOTS = [
  { id: 'bottom-adsense-1', slotId: '1111111111', icon: '📣', label: 'AdSense 300×100' },
  { id: 'bottom-adsense-2', slotId: '2222222222', icon: '📣', label: 'AdSense 300×100' },
];

export default function AdBanner({
  layout = 'bottom',
  banners = DEFAULT_BANNERS,
  adsenseSlots = BOTTOM_ADSENSE_SLOTS,
  className = '',
}) {
  const [hovered, setHovered] = useState(null);

  /* ---- Layout inferior: 2 banners + 2 AdSense ---- */
  if (layout === 'bottom') {
    return (
      <section className={`ad-banner-section ad-banner-bottom ${className}`} aria-label="Publicidad inferior">
        <div className="ad-banner-label">
          <span className="ad-label-text">Publicidad</span>
        </div>
        <div className="ad-bottom-grid">
          {/* Banner 1 */}
          {banners[0]?.linkUrl?.startsWith('/') ? (
            <Link
              to={banners[0]?.linkUrl}
              className={`ad-slot ad-bottom-slot ${hovered === 'b0' ? 'ad-slot--hovered' : ''}`}
              style={{ '--ad-accent': banners[0]?.accentColor || '#667eea' }}
              aria-label={banners[0]?.altText}
              onMouseEnter={() => setHovered('b0')}
              onMouseLeave={() => setHovered(null)}
            >
              <BannerPlaceholder ad={banners[0]} />
            </Link>
          ) : (
            <a
              href={banners[0]?.linkUrl || '#'}
              className={`ad-slot ad-bottom-slot ${hovered === 'b0' ? 'ad-slot--hovered' : ''}`}
              style={{ '--ad-accent': banners[0]?.accentColor || '#667eea' }}
              target={banners[0]?.linkUrl?.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              aria-label={banners[0]?.altText}
              onMouseEnter={() => setHovered('b0')}
              onMouseLeave={() => setHovered(null)}
            >
              <BannerPlaceholder ad={banners[0]} />
            </a>
          )}

          {/* AdSense 1 */}
          <div className="ad-bottom-slot ad-bottom-adsense">
            <AdSenseSlot
              slotId={adsenseSlots[0]?.slotId}
              format="horizontal"
              placeholderIcon={adsenseSlots[0]?.icon}
              placeholderLabel={adsenseSlots[0]?.label}
              style={{ minHeight: '110px', height: '100%' }}
            />
          </div>

          {/* Banner 2 */}
          {banners[1]?.linkUrl?.startsWith('/') ? (
            <Link
              to={banners[1]?.linkUrl}
              className={`ad-slot ad-bottom-slot ${hovered === 'b1' ? 'ad-slot--hovered' : ''}`}
              style={{ '--ad-accent': banners[1]?.accentColor || '#43e97b' }}
              aria-label={banners[1]?.altText}
              onMouseEnter={() => setHovered('b1')}
              onMouseLeave={() => setHovered(null)}
            >
              <BannerPlaceholder ad={banners[1]} />
            </Link>
          ) : (
            <a
              href={banners[1]?.linkUrl || '#'}
              className={`ad-slot ad-bottom-slot ${hovered === 'b1' ? 'ad-slot--hovered' : ''}`}
              style={{ '--ad-accent': banners[1]?.accentColor || '#43e97b' }}
              target={banners[1]?.linkUrl?.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              aria-label={banners[1]?.altText}
              onMouseEnter={() => setHovered('b1')}
              onMouseLeave={() => setHovered(null)}
            >
              <BannerPlaceholder ad={banners[1]} />
            </a>
          )}

          {/* AdSense 2 */}
          <div className="ad-bottom-slot ad-bottom-adsense">
            <AdSenseSlot
              slotId={adsenseSlots[1]?.slotId}
              format="horizontal"
              placeholderIcon={adsenseSlots[1]?.icon}
              placeholderLabel={adsenseSlots[1]?.label}
              style={{ minHeight: '110px', height: '100%' }}
            />
          </div>
        </div>
      </section>
    );
  }

  /* ---- Layout horizontal / grid: 4 banners personalizados ---- */
  const all4Banners = [...DEFAULT_BANNERS, ...DEFAULT_BANNERS].slice(0, 4);
  return (
    <section
      className={`ad-banner-section ad-layout-${layout} ${className}`}
      aria-label="Espacios publicitarios"
    >
      <div className="ad-banner-label">
        <span className="ad-label-text">Publicidad</span>
      </div>
      <div className={`ad-slots ad-slots-${layout}`}>
        {all4Banners.map((ad, i) => 
          ad.linkUrl?.startsWith('/') ? (
            <Link
              key={`${ad.id}-${i}`}
              to={ad.linkUrl}
              className={`ad-slot ad-slot-${i + 1} ${hovered === i ? 'ad-slot--hovered' : ''}`}
              style={{ '--ad-accent': ad.accentColor || '#667eea' }}
              aria-label={ad.altText}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <BannerPlaceholder ad={ad} />
            </Link>
          ) : (
            <a
              key={`${ad.id}-${i}`}
              href={ad.linkUrl || '#'}
              className={`ad-slot ad-slot-${i + 1} ${hovered === i ? 'ad-slot--hovered' : ''}`}
              style={{ '--ad-accent': ad.accentColor || '#667eea' }}
              target={ad.linkUrl?.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              aria-label={ad.altText}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <BannerPlaceholder ad={ad} />
            </a>
          )
        )}
      </div>
    </section>
  );
}

/* Subcomponente reutilizable para el placeholder de cada banner */
function BannerPlaceholder({ ad }) {
  if (ad?.imageUrl) {
    return (
      <div className="ad-image-wrapper">
        <img src={ad.imageUrl} alt={ad.altText} className="ad-image" />
        <div className="ad-overlay"><span className="ad-cta">Ver más →</span></div>
      </div>
    );
  }
  return (
    <div className="ad-placeholder">
      <div className="ad-placeholder-bg" />
      <div className="ad-placeholder-content">
        <span className="ad-placeholder-icon">{ad?.icon}</span>
        <span className="ad-placeholder-label">{ad?.label}</span>
        <span className="ad-placeholder-sub">{ad?.sublabel}</span>
        <span className="ad-placeholder-cta">Contáctanos →</span>
      </div>
      <div className="ad-shimmer" />
    </div>
  );
}
