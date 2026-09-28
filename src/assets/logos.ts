// Identidade visual GC MIX em SVG embutido de alta fidelidade
// Permite renderização nítida em qualquer resolução sem requisições externas ou arquivos estáticos quebrados.

const SVG_GC_MIX_QUADRADA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="gcmix_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1b2a"/>
      <stop offset="100%" stop-color="#1b2e4b"/>
    </linearGradient>
    <linearGradient id="gcmix_orange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="gcmix_cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="36" fill="url(#gcmix_bg)"/>
  <circle cx="128" cy="98" r="54" fill="none" stroke="url(#gcmix_cyan)" stroke-width="6" opacity="0.4"/>
  <!-- Balão de concreto / tambor estilizado -->
  <g transform="translate(128,98) rotate(-22)">
    <ellipse cx="0" cy="0" rx="42" ry="32" fill="url(#gcmix_orange)"/>
    <ellipse cx="0" cy="0" rx="36" ry="14" fill="#0d1b2a" opacity="0.3"/>
    <path d="M-36,0 L36,0" stroke="#ffffff" stroke-width="4" stroke-dasharray="8 6"/>
  </g>
  <!-- GC MIX Texto -->
  <text x="128" y="185" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="2">GC MIX</text>
  <text x="128" y="210" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#38bdf8" text-anchor="middle" letter-spacing="3">CONCRETO USINADO</text>
  <rect x="68" y="222" width="120" height="3" rx="1.5" fill="#f97316"/>
</svg>`

const SVG_GC_MIX_HORIZONTAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 110" width="460" height="110">
  <defs>
    <linearGradient id="gcmix_h_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1b2a"/>
      <stop offset="100%" stop-color="#1b2e4b"/>
    </linearGradient>
    <linearGradient id="gcmix_h_orange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="gcmix_h_cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="460" height="110" rx="16" fill="url(#gcmix_h_bg)"/>
  <!-- Ícone à esquerda -->
  <g transform="translate(62,55)">
    <circle cx="0" cy="0" r="38" fill="none" stroke="url(#gcmix_h_cyan)" stroke-width="4" opacity="0.35"/>
    <g transform="rotate(-20)">
      <ellipse cx="0" cy="0" rx="30" ry="22" fill="url(#gcmix_h_orange)"/>
      <ellipse cx="0" cy="0" rx="24" ry="10" fill="#0d1b2a" opacity="0.3"/>
      <path d="M-24,0 L24,0" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 4"/>
    </g>
  </g>
  <!-- Textos -->
  <text x="125" y="56" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" fill="#ffffff" letter-spacing="1.5">GC MIX</text>
  <text x="127" y="78" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" fill="#38bdf8" letter-spacing="2.5">CONCRETO USINADO &amp; PEDREIRA</text>
  <rect x="127" y="86" width="280" height="2.5" rx="1" fill="#f97316"/>
</svg>`

export const LOGO_GC_MIX_QUADRADA = `data:image/svg+xml;utf8,${encodeURIComponent(SVG_GC_MIX_QUADRADA)}`
export const LOGO_GC_MIX_HORIZONTAL = `data:image/svg+xml;utf8,${encodeURIComponent(SVG_GC_MIX_HORIZONTAL)}`
export const LOGO_ALT_TEXT = "GC MIX — Concreto Usinado & Pedreira Cordeiro"
