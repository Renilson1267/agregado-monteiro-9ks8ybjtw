// Identidade visual GC MIX oficial enviada pelo usuário
// "CONCRETO USINADO & PEDREIRA CORDEIRO"
// Disponível tanto via import dos arquivos locais otimizados em src/assets/
// quanto pelas URLs diretas do Supabase Storage.

import logoHorizontalFile from "./logo1-52b08.jpeg"
import logoQuadradaFile from "./whatsapp-image-2026-09-26-at-16.18.46-1-8c42f.jpeg"

// URLs públicas fornecidas pelo usuário no Supabase Storage
export const LOGO_GC_MIX_HORIZONTAL_REMOTE =
  "https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/4157a8ea-9ed5-47ab-9af6-80bd6942f94c/logo1.jpeg"

// Imagens padrão utilizadas por todos os componentes do sistema
// Logotipo GC MIX horizontal oficial sintetizado em SVG vetorial de alta definição puro em data URI (sem dependência externa de fetch/storage)
export const LOGO_GC_MIX_HORIZONTAL_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 100" width="460" height="100">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b1a2d"/>
          <stop offset="100%" stop-color="#152e4d"/>
        </linearGradient>
        <linearGradient id="drumOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
        <linearGradient id="drumBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
      </defs>
      <!-- Fundo de moldura arredondada para legibilidade máxima -->
      <rect x="0" y="0" width="460" height="100" rx="8" fill="url(#bgGrad)"/>
      
      <!-- Símbolo: Tambor de Betoneira / Hélice Industrial Estilizado -->
      <g transform="translate(48, 50)">
        <!-- Halo / Anel externo -->
        <circle cx="0" cy="0" r="38" fill="none" stroke="#0ea5e9" stroke-width="2.5" opacity="0.6"/>
        <circle cx="0" cy="0" r="34" fill="#0b1a2d" stroke="#ffffff" stroke-width="1.8"/>
        <!-- Segmentos da betoneira -->
        <path d="M 0 0 L 0 -34 A 34 34 0 0 1 29.4 -17 Z" fill="url(#drumOrange)"/>
        <path d="M 0 0 L 29.4 -17 A 34 34 0 0 1 29.4 17 Z" fill="#ffffff"/>
        <path d="M 0 0 L 29.4 17 A 34 34 0 0 1 0 34 Z" fill="url(#drumBlue)"/>
        <path d="M 0 0 L 0 34 A 34 34 0 0 1 -29.4 17 Z" fill="url(#drumOrange)"/>
        <path d="M 0 0 L -29.4 17 A 34 34 0 0 1 -29.4 -17 Z" fill="#ffffff"/>
        <path d="M 0 0 L -29.4 -17 A 34 34 0 0 1 0 -34 Z" fill="url(#drumBlue)"/>
        <!-- Núcleo central -->
        <circle cx="0" cy="0" r="13" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <circle cx="0" cy="0" r="5" fill="#0b1a2d"/>
      </g>

      <!-- Tipografia Oficial "GC MIX" -->
      <text x="105" y="55" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="2">
        GC MIX
      </text>

      <!-- Faixa Divisória Laranja -->
      <line x1="105" y1="64" x2="440" y2="64" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Slogan Institucional Oficial -->
      <text x="106" y="82" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11.5" fill="#93c5fd" letter-spacing="1.8">
        CONCRETO USINADO &amp; PEDREIRA CORDEIRO
      </text>
    </svg>`,
)}`

export const LOGO_GC_MIX_HORIZONTAL = logoHorizontalFile
export const LOGO_GC_MIX_QUADRADA = logoQuadradaFile

export const LOGO_ALT_TEXT = "GC MIX — Concreto Usinado & Pedreira Cordeiro"
