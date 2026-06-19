/**
 * PixelIcon — Wrapper para normalizar el uso de iconos pixelarticons.
 *
 * Uso:
 *   import { Home } from 'pixelarticons/react';
 *   import PixelIcon from './PixelIcon';
 *
 *   <PixelIcon icon={Home} size={18} />
 *   <PixelIcon icon={Star} size={14} color="#ffd700" />
 */
export default function PixelIcon({ icon: Icon, size = 16, color = 'currentColor', style = {}, className = '', ...props }) {
  return (
    <Icon
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        color,
        ...style,
      }}
      className={className}
      {...props}
    />
  );
}
