import React from 'react';

const ChromeDefs: React.FC<{id: string}> = ({ id }) => (
    <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgb(220, 220, 255)', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: 'rgb(180, 180, 190)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgb(240, 240, 255)', stopOpacity: 1 }} />
        </linearGradient>
    </defs>
);

export const ChromeStar: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ChromeDefs id="star"/>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" fill={`url(#grad-star)`}/>
    </svg>
);

export const ChromeHeart: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ChromeDefs id="heart"/>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={`url(#grad-heart)`}/>
    </svg>
);

export const ChromeButterfly: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ChromeDefs id="butterfly"/>
        <g transform="scale(1.2) translate(-2, 2)" fill={`url(#grad-butterfly)`}>
          <path d="M14 11c0-2.21-1.79-4-4-4s-4 1.79-4 4v1h8v-1z"/>
          <path d="M14 12H6c-1.1 0-2 .9-2 2v2h12v-2c0-1.1-.9-2-2-2z"/>
          <path d="M17.99 4.01c-1.79-.58-3.48-.05-4.24.71-.2.2-.2.51 0 .71.76.76 2.45 1.29 4.24.71.3-.1.51-.38.51-.71 0-.2-.08-.39-.21-.51z"/>
          <path d="M4.22 4.22c-1.79.58-3.48.05-4.24-.71C-.2 3.33-.2 3.02 0 2.82c.76-.76 2.45-1.29 4.24-.71.3.1.51.38.51.71 0 .2-.08-.39-.21-.51z"/>
        </g>
    </svg>
);


export const DiscoBall: React.FC<{className?: string}> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="grad-disco" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0e0ff" />
        <stop offset="100%" stopColor="#b0b0cc" />
      </linearGradient>
      <pattern id="disco-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
        <rect width="10" height="10" fill="url(#grad-disco)" />
        <path d="M 0 0 L 10 0 M 0 2 L 10 2 M 0 4 L 10 4 M 0 6 L 10 6 M 0 8 L 10 8" stroke="#ffffff44" strokeWidth="0.5" />
        <path d="M 0 0 L 0 10 M 2 0 L 2 10 M 4 0 L 4 10 M 6 0 L 6 10 M 8 0 L 8 10" stroke="#ffffff44" strokeWidth="0.5" />
      </pattern>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#disco-pattern)" stroke="white" strokeWidth="1" />
  </svg>
);