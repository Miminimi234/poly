'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';

interface AsciiLogoProps {
  className?: string;
  maxScale?: number;
  minScale?: number;
  baseWidth?: number;
  asciiArt?: string;
  fontSize?: number;
  mobileFontSize?: number;
}

const DEFAULT_ART = `██████╗  ██████╗ ██╗  ██╗   ██╗██╗  ██╗ ██████╗ ██████╗
██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝██║  ██║██╔═████╗╚════██╗
██████╔╝██║   ██║██║   ╚████╔╝ ███████║██║██╔██║ █████╔╝
██╔═══╝ ██║   ██║██║    ╚██╔╝  ╚════██║████╔╝██║██╔═══╝ 
██║     ╚██████╔╝███████╗██║        ██║╚██████╔╝███████╗
╚═╝      ╚═════╝ ╚══════╝╚═╝        ╚═╝ ╚═════╝ ╚══════╝`;

export function AsciiLogo({
  className = '',
  maxScale = 1,
  minScale = 0.4,
  baseWidth = 480,
  asciiArt = DEFAULT_ART,
  fontSize = 14,
  mobileFontSize = 10,
}: AsciiLogoProps) {
  const [scale, setScale] = useState(1);

  const art = useMemo(() => asciiArt.trim(), [asciiArt]);

  const customStyle = {
    '--ascii-font-size': `${fontSize}px`,
    '--ascii-font-size-mobile': `${mobileFontSize}px`,
  } as CSSProperties;

  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(window.innerWidth, window.innerHeight * 1.2);
      const ratio = width / baseWidth;
      const clamped = Math.min(maxScale, Math.max(minScale, ratio));
      setScale(clamped);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [baseWidth, maxScale, minScale]);

  return (
    <div
      className={`ascii-logo-wrapper ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      aria-hidden="true"
    >
      <pre className="ascii-logo" style={customStyle}>{art}</pre>
    </div>
  );
}
