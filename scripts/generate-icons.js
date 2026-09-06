import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

const svgContent = fs.readFileSync(path.join(publicDir, 'lumina.svg'), 'utf8');

// 1. Standard 192x192
const resvg192 = new Resvg(svgContent, { fitTo: { mode: 'width', value: 192 } });
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), resvg192.render().asPng());
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), resvg192.render().asPng());

// 2. Standard 512x512
const resvg512 = new Resvg(svgContent, { fitTo: { mode: 'width', value: 512 } });
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), resvg512.render().asPng());
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), resvg512.render().asPng());

// 3. Apple touch icon 180x180
const resvg180 = new Resvg(svgContent, { fitTo: { mode: 'width', value: 180 } });
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), resvg180.render().asPng());

// 4. Maskable 512x512 with safe area padding
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#34d399"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="luminaGoldMask" x1="24" y1="8" x2="24" y2="22" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fef08a"/>
      <stop offset="0.5" stop-color="#fde047"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="softGlowMask" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#bgGrad)" />
  <g transform="translate(64, 64) scale(8)">
    <path 
      d="M12 33C16 31 20 31 24 33.5C28 31 32 31 36 33V18C32 16 28 16 24 18.5C20 16 16 16 12 18V33Z" 
      fill="#ffffff" 
      fill-opacity="0.25" 
      stroke="#ffffff" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <path d="M24 18.5V33.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    <path 
      d="M24 8.5L25.8 13.2L30.5 15L25.8 16.8L24 21.5L22.2 16.8L17.5 15L22.2 13.2L24 8.5Z" 
      fill="url(#luminaGoldMask)" 
      filter="url(#softGlowMask)"
    />
  </g>
</svg>`;

const resvgMaskable = new Resvg(maskableSvg, { fitTo: { mode: 'width', value: 512 } });
fs.writeFileSync(path.join(publicDir, 'pwa-512x512-maskable.png'), resvgMaskable.render().asPng());
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512.png'), resvgMaskable.render().asPng());

console.log('Successfully generated all PWA PNG icons in public/ directory.');
