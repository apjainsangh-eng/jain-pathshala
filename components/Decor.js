'use client';

import React, { useId } from 'react';

// Marigold-and-mango-leaf toran, like the ones hung over temple doorways.
// Purely decorative: repeats across the full width.
export function Toran({ className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg aria-hidden="true" className={`block w-full h-5 ${className}`} preserveAspectRatio="none">
      <defs>
        <pattern id={`toran-${id}`} width="28" height="20" patternUnits="userSpaceOnUse">
          {/* string */}
          <rect x="0" y="2" width="28" height="1.5" fill="#b0820f" />
          {/* marigold */}
          <circle cx="7" cy="5" r="4" fill="#f2a30e" />
          <circle cx="7" cy="5" r="2" fill="#d9600f" />
          {/* mango leaf */}
          <path d="M21 3c4 4 4 10 0 15c-4-5-4-11 0-15z" fill="#2f7d32" />
          <path d="M21 4v13" stroke="#1f5e22" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="20" fill={`url(#toran-${id})`} />
    </svg>
  );
}

// Simple lotus emblem
export function Lotus({ className = 'w-10 h-10' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={className}>
      <path d="M32 10c6 8 7 18 0 28c-7-10-6-20 0-28z" fill="#f2760e" />
      <path d="M32 38c-4-9-12-15-22-15c2 10 10 16 22 15z" fill="#fb923c" />
      <path d="M32 38c4-9 12-15 22-15c-2 10-10 16-22 15z" fill="#fb923c" />
      <path d="M32 38c-8-4-17-3-25 3c8 4 17 3 25-3z" fill="#fdba74" />
      <path d="M32 38c8-4 17-3 25 3c-8 4-17 3-25-3z" fill="#fdba74" />
      <path d="M12 46h40" stroke="#a32640" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 51h28" stroke="#d4a017" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Temple (shikhar) arch used as the top of headers/cards
export function TempleArch({ className = '' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 40" preserveAspectRatio="none" className={`block w-full h-6 ${className}`}>
      <path
        d="M0 40 L0 30 Q40 30 60 22 Q90 10 120 20 Q150 30 170 14 Q185 2 200 0 Q215 2 230 14 Q250 30 280 20 Q310 10 340 22 Q360 30 400 30 L400 40 Z"
        fill="currentColor"
      />
    </svg>
  );
}
