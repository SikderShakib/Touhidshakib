'use strict';

/**
 * Generates the demo cover artwork used by the seeded products.
 * Run: node scripts/make-covers.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'assets', 'covers');
fs.mkdirSync(OUT, { recursive: true });

const covers = [
  {
    file: 'bionest.svg',
    label: 'PRODUCT',
    title: 'BioNest',
    sub: 'HSC Biology Question Bank',
    from: '#0b3b34',
    to: '#0f172a',
    accent: '#34d399',
    accent2: '#a7f3d0',
    motif: 'leaf'
  },
  {
    file: 'rankradar.svg',
    label: 'SOFTWARE',
    title: 'RankRadar',
    sub: 'SEO Audit Toolkit',
    from: '#1b1a4d',
    to: '#0b0d16',
    accent: '#22d3ee',
    accent2: '#818cf8',
    motif: 'radar'
  },
  {
    file: 'course.svg',
    label: 'COURSE',
    title: 'Admission War Room',
    sub: '8-week biology crash course',
    from: '#33165c',
    to: '#0b0d16',
    accent: '#f472b6',
    accent2: '#c4b5fd',
    motif: 'play'
  },
  {
    file: 'studypulse.svg',
    label: 'APK',
    title: 'StudyPulse',
    sub: 'Offline notes reader',
    from: '#0b2c4a',
    to: '#0b0d16',
    accent: '#60a5fa',
    accent2: '#67e8f9',
    motif: 'pulse'
  },
  {
    file: 'somadhan.svg',
    label: 'PRODUCT',
    title: 'Somadhan',
    sub: 'Worksheet generator',
    from: '#3a2506',
    to: '#0b0d16',
    accent: '#fbbf24',
    accent2: '#fde68a',
    motif: 'grid'
  },
  {
    file: 'opskit.svg',
    label: 'SOFTWARE',
    title: 'Community Ops Kit',
    sub: 'Templates & automations',
    from: '#101c46',
    to: '#0b0d16',
    accent: '#38bdf8',
    accent2: '#a5b4fc',
    motif: 'nodes'
  }
];

function motifSVG(kind, a, b) {
  switch (kind) {
    case 'leaf':
      return `
        <g opacity="0.55" stroke="${a}" fill="none" stroke-width="2">
          ${[0, 1, 2, 3, 4, 5]
            .map(
              (i) =>
                `<ellipse cx="${760 + i * 26}" cy="${430 - i * 20}" rx="${210 - i * 18}" ry="${120 - i * 10}" transform="rotate(-24 ${760 + i * 26} ${430 - i * 20})" />`
            )
            .join('')}
          <path d="M520 620 C 700 520, 830 420, 1010 250" stroke="${b}" stroke-width="2.5" stroke-dasharray="4 10" />
        </g>`;
    case 'radar':
      return `
        <g transform="translate(870 330)" opacity="0.75">
          ${[70, 130, 190, 250, 310]
            .map((r) => `<circle r="${r}" fill="none" stroke="${a}" stroke-opacity="0.5" stroke-width="1.6" />`)
            .join('')}
          <circle r="46" fill="${a}" fill-opacity="0.15" stroke="${a}" stroke-width="2" />
          <path d="M0 0 L300 -110 A320 320 0 0 1 300 110 Z" fill="url(#sweep)" />
          <path d="M0 0 L300 -110" stroke="${b}" stroke-width="2.5" />
          ${[
            [180, -80],
            [96, 120],
            [-110, -150],
            [230, 60]
          ]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${b}" />`)
            .join('')}
        </g>`;
    case 'play':
      return `
        <g opacity="0.9">
          <circle cx="880" cy="330" r="196" fill="none" stroke="${a}" stroke-opacity="0.35" stroke-width="2" />
          <circle cx="880" cy="330" r="150" fill="${a}" fill-opacity="0.12" stroke="${a}" stroke-opacity="0.6" stroke-width="2" />
          <path d="M836 250 L 970 330 L 836 410 Z" fill="${b}" fill-opacity="0.9" />
          ${[0, 1, 2, 3]
            .map(
              (i) =>
                `<rect x="${640 - i * 26}" y="${610 + i * 22}" width="${420 - i * 40}" height="6" rx="3" fill="${a}" opacity="${0.55 - i * 0.11}" />`
            )
            .join('')}
        </g>`;
    case 'pulse':
      return `
        <g opacity="0.8">
          <path d="M560 400 H700 L740 300 L800 520 L856 360 L900 400 H1080"
                fill="none" stroke="${a}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M560 470 H1080" stroke="${b}" stroke-opacity="0.22" stroke-width="1.5" stroke-dasharray="3 9" />
          <circle cx="1080" cy="400" r="9" fill="${b}" />
          <rect x="760" y="180" width="230" height="360" rx="34" fill="none" stroke="${a}" stroke-opacity="0.35" stroke-width="2" />
          <rect x="792" y="216" width="166" height="240" rx="16" fill="${a}" fill-opacity="0.08" />
        </g>`;
    case 'grid':
      return `
        <g opacity="0.7">
          ${Array.from({ length: 5 })
            .map((_, r) =>
              Array.from({ length: 5 })
                .map((_, c) => {
                  const on = (r + c) % 3 === 0;
                  return `<rect x="${660 + c * 84}" y="${140 + r * 84}" width="58" height="58" rx="12" fill="${on ? a : 'none'}" fill-opacity="${on ? 0.55 : 0}" stroke="${a}" stroke-opacity="0.4" stroke-width="1.4" />`;
                })
                .join('')
            )
            .join('')}
          <path d="M680 300 l34 34 l64 -78" fill="none" stroke="${b}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
        </g>`;
    default:
      return `
        <g opacity="0.8" stroke="${a}" fill="none" stroke-width="1.8">
          ${[
            [700, 250],
            [900, 180],
            [1050, 330],
            [840, 400],
            [980, 520],
            [740, 540]
          ]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="${a}" fill-opacity="0.2" />`)
            .join('')}
          <path d="M700 250 L900 180 L1050 330 L980 520 L840 400 L740 540 Z" stroke-opacity="0.45" />
          <path d="M700 250 L840 400 M900 180 L840 400 M1050 330 L840 400 M980 520 L840 400" stroke-opacity="0.3" />
          <circle cx="840" cy="400" r="34" fill="${b}" fill-opacity="0.22" stroke="${b}" />
        </g>`;
  }
}

covers.forEach((c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800" role="img" aria-label="${c.title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.from}" />
      <stop offset="0.62" stop-color="${c.to}" />
      <stop offset="1" stop-color="#06070d" />
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.36" r="0.62">
      <stop offset="0" stop-color="${c.accent}" stop-opacity="0.45" />
      <stop offset="1" stop-color="${c.accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c.accent}" stop-opacity="0.35" />
      <stop offset="1" stop-color="${c.accent}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" />
      <stop offset="1" stop-color="${c.accent2}" />
    </linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="${c.accent}" fill-opacity="0.28" />
    </pattern>
  </defs>

  <rect width="1200" height="800" fill="url(#bg)" />
  <rect width="1200" height="800" fill="url(#dots)" />
  <rect width="1200" height="800" fill="url(#glow)" />
  ${motifSVG(c.motif, c.accent, c.accent2)}

  <g transform="translate(72 96)">
    <rect x="0" y="0" width="${c.label.length * 16 + 44}" height="40" rx="20" fill="${c.accent}" fill-opacity="0.16" stroke="${c.accent}" stroke-opacity="0.5" />
    <text x="${c.label.length * 8 + 22}" y="26" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif"
          font-size="16" font-weight="700" letter-spacing="4" fill="${c.accent2}">${c.label}</text>
  </g>

  <text x="72" y="600" font-family="'Segoe UI', Arial, sans-serif" font-size="74" font-weight="800"
        letter-spacing="-2.5" fill="url(#title)">${c.title}</text>
  <text x="74" y="654" font-family="'Segoe UI', Arial, sans-serif" font-size="27" font-weight="400"
        letter-spacing="0.4" fill="#c7cee0" fill-opacity="0.82">${c.sub}</text>

  <g transform="translate(72 716)" opacity="0.75">
    <rect width="54" height="3" rx="1.5" fill="${c.accent}" />
    <text x="72" y="8" font-family="'Segoe UI', Arial, sans-serif" font-size="17" font-weight="600"
          letter-spacing="3.6" fill="#e6ebf7" fill-opacity="0.75">TOUHID SHAKIB</text>
  </g>
</svg>
`;
  fs.writeFileSync(path.join(OUT, c.file), svg);
  console.log('wrote', c.file);
});
