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

// Pastel icon "bubble": colour lives in the icon, cards stay white and airy.
// Full class strings (not built dynamically) so Tailwind keeps them.
export const TONES = {
  kesar: { bubble: 'bg-kesar-100 text-kesar-600', text: 'text-kesar-700', bar: 'bg-kesar-500', soft: 'bg-kesar-50' },
  rose: { bubble: 'bg-kumkum-100 text-kumkum-600', text: 'text-kumkum-700', bar: 'bg-kumkum-500', soft: 'bg-kumkum-50' },
  sun: { bubble: 'bg-amber-100 text-amber-600', text: 'text-amber-700', bar: 'bg-amber-400', soft: 'bg-amber-50' },
  mint: { bubble: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700', bar: 'bg-emerald-500', soft: 'bg-emerald-50' },
  sky: { bubble: 'bg-sky-100 text-sky-600', text: 'text-sky-700', bar: 'bg-sky-500', soft: 'bg-sky-50' },
  lilac: { bubble: 'bg-violet-100 text-violet-600', text: 'text-violet-700', bar: 'bg-violet-500', soft: 'bg-violet-50' },
  gray: { bubble: 'bg-gray-100 text-gray-500', text: 'text-gray-600', bar: 'bg-gray-400', soft: 'bg-gray-50' },
};

export function IconBubble({ icon: Icon, tone = 'kesar', size = 'md', children }) {
  const box = size === 'lg' ? 'w-14 h-14 rounded-[1.25rem]' : size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl';
  const ico = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <span className={`clay-bubble inline-flex items-center justify-center flex-shrink-0 ${box} ${(TONES[tone] || TONES.kesar).bubble}`}>
      {Icon ? <Icon className={ico} /> : children}
    </span>
  );
}
