import { Link } from 'react-router-dom';

function Logo({ variant = 'full', height, to = '/home', style, className }) {
  const sources = {
    full: '/assets/logo-full.png',
    dark: '/assets/logo-dark-bg.jpg',
    light: '/assets/logo-full.png', // Uses transparent PNG for clean white inversion without white box
    monochrome: '/assets/logo-monochrome.png',
  };

  const logoHeight = height ? (typeof height === 'number' ? `${height}px` : height) : 'var(--logo-height)';
  const isLightVariant = variant === 'light' || variant === 'white';

  const img = (
    <img
      src={sources[variant] || sources.full}
      alt="LegalHub"
      style={{
        height: logoHeight,
        objectFit: 'contain',
        filter: isLightVariant ? 'brightness(0) invert(1)' : 'none',
        display: 'block',
        ...style,
      }}
      className={className}
    />
  );

  if (to) {
    return (
      <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
        {img}
      </Link>
    );
  }

  return img;
}

export default Logo;
