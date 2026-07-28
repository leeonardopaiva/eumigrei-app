import React from 'react';

export interface GringoouLogoProps {
  className?: string;
  /** Altura renderizada em px; a largura acompanha a proporção real do arquivo. */
  size?: number;
}

export const GringoouLogo: React.FC<GringoouLogoProps> = ({ className = '', size = 32 }) => (
  <img
    src="/assets/gringoou-logo.png"
    alt="Gringoou"
    style={{ height: size, width: 'auto' }}
    className={`inline-block select-none object-contain ${className}`}
  />
);

export default GringoouLogo;
