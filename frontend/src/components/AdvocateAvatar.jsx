import { useState } from 'react';
import PropTypes from 'prop-types';

// Palette of dignified legal chambers color schemes
const PALETTES = [
  { bg: 'linear-gradient(135deg, #0b2545 0%, #134074 100%)', text: '#ffffff', border: '#8da9c4' },
  { bg: 'linear-gradient(135deg, #1c2541 0%, #3a506b 100%)', text: '#ffffff', border: '#6fffe9' },
  { bg: 'linear-gradient(135deg, #2b2d42 0%, #4a4e69 100%)', text: '#ffffff', border: '#9a8c98' },
  { bg: 'linear-gradient(135deg, #14213d 0%, #000000 100%)', text: '#ffffff', border: '#fca311' },
  { bg: 'linear-gradient(135deg, #1f2421 0%, #216869 100%)', text: '#ffffff', border: '#49a078' },
  { bg: 'linear-gradient(135deg, #3d0c11 0%, #5c1d24 100%)', text: '#ffffff', border: '#d4a373' },
];

function getPalette(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PALETTES.length;
  return PALETTES[idx];
}

function getInitials(name = '') {
  const cleaned = name.replace(/^(Adv\.?|Advocate|Mr\.?|Ms\.?|Mrs\.?|Barrister)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AdvocateAvatar = ({
  name = '',
  imageUrl = null,
  size = 56,
  courtLevel = '',
  className = '',
  showBadge = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const palette = getPalette(name);
  const initials = getInitials(name);

  // Supreme Court gets gold border, High Court gets silver-blue
  const isSupreme = courtLevel?.toLowerCase().includes('supreme');
  const isHighCourt = courtLevel?.toLowerCase().includes('high court');

  const borderColor = isSupreme ? '#eab308' : isHighCourt ? '#60a5fa' : 'rgba(255, 255, 255, 0.2)';

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: palette.bg,
    color: palette.text,
    border: `2px solid ${borderColor}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    fontSize: `${Math.round(size * 0.38)}px`,
    fontWeight: '700',
    letterSpacing: '0.04em',
    userSelect: 'none',
    flexShrink: 0,
  };

  return (
    <div className={`advocate-avatar ${className}`} style={avatarStyle} title={name}>
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Subtle lawyer collar / neckband watermark */}
          <svg
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              bottom: '-8%',
              width: '85%',
              opacity: 0.18,
              fill: '#ffffff',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {/* Traditional advocate black coat and white bands */}
            <path d="M 15 100 L 35 45 L 50 65 L 65 45 L 85 100 Z" />
            <rect x="44" y="65" width="5" height="30" fill="#ffffff" />
            <rect x="51" y="65" width="5" height="30" fill="#ffffff" />
          </svg>
          <span style={{ position: 'relative', zIndex: 1 }}>{initials}</span>
        </div>
      )}

      {/* Tiny Court Level Indicator Dot */}
      {showBadge && (isSupreme || isHighCourt) && (
        <span
          title={isSupreme ? 'Advocate Supreme Court' : 'Advocate High Court'}
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: `${Math.max(10, Math.round(size * 0.22))}px`,
            height: `${Math.max(10, Math.round(size * 0.22))}px`,
            borderRadius: '50%',
            backgroundColor: isSupreme ? '#eab308' : '#2563eb',
            border: '2px solid #ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      )}
    </div>
  );
};

AdvocateAvatar.propTypes = {
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  size: PropTypes.number,
  courtLevel: PropTypes.string,
  className: PropTypes.string,
  showBadge: PropTypes.bool,
};

export default AdvocateAvatar;
