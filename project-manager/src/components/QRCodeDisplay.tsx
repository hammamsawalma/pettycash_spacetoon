'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
  logo?: boolean;
}

export function QRCodeDisplay({ url, size = 120, className = '', logo = true }: QRCodeDisplayProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      <QRCodeSVG
        value={url}
        size={size}
        level="H" // High error correction to accommodate logo
        includeMargin={false}
        imageSettings={logo ? {
          src: '/spacetoon-logo.png', // Or the actual logo path in public folder
          x: undefined,
          y: undefined,
          height: size * 0.25,
          width: size * 0.25,
          excavate: true,
        } : undefined}
      />
    </div>
  );
}
