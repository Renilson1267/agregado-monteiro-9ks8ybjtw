import { formatarMoeda, TotaisUnidadeCalculados } from "./folha-helpers"

export interface ImprimirTabelaProps {
  titulo: string
  subtitulo?: string
  empresaNome: string
  competencia: string
  colunas: string[]
  linhas: (string | number)[][]
  totais?: (string | number)[]
  linhaInformativa?: string
  /** Bloco de assinaturas no rodapé do A4 (Elaborado por / Conferido por / Aprovação) */
  mostrarAssinaturas?: boolean
  /** Campo de assinatura DO VENDEDOR(a) — usado no A4 de VENDAS (recibo de comissão) */
  assinaturaVendedor?: boolean
}

const HTML_BLOCO_ASSINATURAS = `
      <div style="margin-top: 40px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; gap: 40px; padding: 0 20px;">
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #111; padding-top: 3px; font-size: 9px; font-weight: 600; color: #111;">
              ____ / ____<br>
              <span style="font-weight: 400;">Elaborado por</span>
            </div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #111; padding-top: 3px; font-size: 9px; font-weight: 600; color: #111;">
              ____ / ____<br>
              <span style="font-weight: 400;">Conferido por</span>
            </div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #111; padding-top: 3px; font-size: 9px; font-weight: 600; color: #111;">
              ____ / ____<br>
              <span style="font-weight: 400;">Aprovação</span>
            </div>
          </div>
        </div>
      </div>
`

export function imprimirRelatorioA4({
  titulo,
  subtitulo,
  empresaNome,
  competencia,
  colunas,
  linhas,
  totais,
  linhaInformativa,
  mostrarAssinaturas = false,
  assinaturaVendedor = false,
}: ImprimirTabelaProps) {
  const janela = window.open("", "_blank")
  if (!janela) return

  const dataHoraEmissao = new Date().toLocaleString("pt-BR")

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>${titulo} - ${competencia}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 10px;
          color: #111;
          margin: 0;
          padding: 10px;
          background: #fff;
        }
        .header {
          border-bottom: 2px solid #222;
          padding-bottom: 8px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header h1 {
          font-size: 16px;
          margin: 0 0 4px 0;
          font-weight: 800;
          color: #0f172a;
        }
        .header .meta {
          font-size: 9px;
          color: #64748b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 4px 6px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
        }
        td.num, th.num {
          text-align: right;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        tr.total-row {
          background-color: #e2e8f0;
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          font-size: 8px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>GC MIX CONCRETO — ${titulo}</h1>
          <div class="meta">
            <strong>Unidade:</strong> ${empresaNome} | 
            <strong>Competência:</strong> ${competencia} ${
              subtitulo ? `| ${subtitulo}` : ""
            }
          </div>
        </div>
        <div class="meta" style="text-align: right;">
          Emitido em: ${dataHoraEmissao}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${colunas.map((col, i) => `<th class="${i > 1 ? "num" : ""}">${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${linhas
            .map(
              (linha) => `
            <tr>
              ${linha
                .map(
                  (cel, i) => `<td class="${i > 1 ? "num" : ""}">${cel}</td>`,
                )
                .join("")}
            </tr>
          `,
            )
            .join("")}
          ${
            totais
              ? `
            <tr class="total-row">
              ${totais
                .map(
                  (cel, i) => `<td class="${i > 1 ? "num" : ""}">${cel}</td>`,
                )
                .join("")}
            </tr>
          `
              : ""
          }
          ${
            linhaInformativa
              ? `
            <tr class="info-row" style="background-color: #f8fafc; font-size: 8.5px; color: #1e293b;">
              <td colspan="${colunas.length}" style="text-align: right; font-weight: 600; padding: 4px 8px; border: 1px solid #cbd5e1; font-style: italic;">
                ${linhaInformativa}
              </td>
            </tr>
          `
              : ""
          }
        </tbody>
      </table>
      ${
        linhaInformativa
          ? `
        <div style="margin-top: -6px; margin-bottom: 8px; font-size: 9px; font-weight: 600; color: #334155; text-align: right;">
          ${linhaInformativa}
        </div>
      `
          : ""
      }

      ${
        assinaturaVendedor
          ? `
      <div style="margin-top: 28px; page-break-inside: avoid;">
        <div style="padding: 0 20px;">
          <div style="max-width: 320px; border-top: 1px solid #111; padding-top: 3px; font-size: 9px; font-weight: 600; color: #111;">
            <span style="font-weight: 400;">Assinatura do vendedor(a)</span>
          </div>
        </div>
      </div>
      `
          : ""
      }

      ${mostrarAssinaturas ? HTML_BLOCO_ASSINATURAS : ""}

      <div class="footer">
        GC MIX Concreto Usinado — Sistema de Gestão Operacional e Folha de Pagamento
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `

  janela.document.write(html)
  janela.document.close()
}

export function imprimirSomaDuasFolhasA4({
  competencia,
  empresaAtivaNome,
  totaisMonteiro,
  totaisSje,
  totaisConsolidado,
}: {
  competencia: string
  empresaAtivaNome: string
  totaisMonteiro: TotaisUnidadeCalculados
  totaisSje: TotaisUnidadeCalculados
  totaisConsolidado: TotaisUnidadeCalculados
}) {
  const janela = window.open("", "_blank")
  if (!janela) return

  const dataHoraEmissao = new Date().toLocaleString("pt-BR")

  const linhas = [
    {
      item: "Quinzena (Adiantamento Salarial)",
      m: formatarMoeda(totaisMonteiro.totalQuinzena),
      s: formatarMoeda(totaisSje.totalQuinzena),
      c: formatarMoeda(totaisConsolidado.totalQuinzena),
    },
    {
      item: "Mensal Líquido (Puro sem produção)",
      m: formatarMoeda(totaisMonteiro.totalMensalPuro),
      s: formatarMoeda(totaisSje.totalMensalPuro),
      c: formatarMoeda(totaisConsolidado.totalMensalPuro),
    },
    {
      item: "Produção a Pagar (Obras, Limpeza, etc.)",
      m: formatarMoeda(totaisMonteiro.totalProducaoAPagar),
      s: formatarMoeda(totaisSje.totalProducaoAPagar),
      c: formatarMoeda(totaisConsolidado.totalProducaoAPagar),
    },
    {
      item: "Férias (Linha própria desvinculada)",
      m: formatarMoeda(totaisMonteiro.totalFerias),
      s: formatarMoeda(totaisSje.totalFerias),
      c: formatarMoeda(totaisConsolidado.totalFerias),
    },
    {
      item: "13º Salário (Exercício proporcional)",
      m: formatarMoeda(totaisMonteiro.totalDecimo),
      s: formatarMoeda(totaisSje.totalDecimo),
      c: formatarMoeda(totaisConsolidado.totalDecimo),
    },
    {
      item: "Comissões de Vendas",
      m: formatarMoeda(totaisMonteiro.totalComissaoVendas),
      s: formatarMoeda(totaisSje.totalComissaoVendas),
      c: formatarMoeda(totaisConsolidado.totalComissaoVendas),
    },
    {
      item: "Ajuda de Custo Vendedores",
      m: formatarMoeda(totaisMonteiro.totalAjudaCustoVendas),
      s: formatarMoeda(totaisSje.totalAjudaCustoVendas),
      c: formatarMoeda(totaisConsolidado.totalAjudaCustoVendas),
    },
    {
      item: "Terceiros (Informativo / Folha à parte)",
      m: formatarMoeda(totaisMonteiro.totalTerceiros),
      s: formatarMoeda(totaisSje.totalTerceiros),
      c: formatarMoeda(totaisConsolidado.totalTerceiros),
    },
  ]

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>SOMA DAS DUAS FOLHAS - ${competencia}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 11px;
          color: #1e293b;
          margin: 0;
          padding: 20px;
          background: #fff;
        }
        .header {
          border-bottom: 2px solid #0284c7;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          font-size: 18px;
          margin: 0 0 4px 0;
          font-weight: 800;
          color: #0f172a;
        }
        .meta {
          font-size: 10px;
          color: #64748b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 10px;
        }
        td.num, th.num {
          text-align: right;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .total-unidade-row {
          background-color: #e2e8f0;
          font-weight: bold;
          font-size: 11px;
        }
        .total-geral-row {
          background-color: #0284c7;
          color: #fff;
          font-weight: 800;
          font-size: 13px;
        }
        .total-geral-row td {
          border-color: #0284c7;
        }
        .footer {
          margin-top: 30px;
          font-size: 9px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>GC MIX — SOMA DAS DUAS FOLHAS</h1>
          <div class="meta">
            <strong>Competência:</strong> ${competencia} | 
            <strong>Referência:</strong> ${empresaAtivaNome}
          </div>
        </div>
        <div class="meta" style="text-align: right;">
          Emitido em: ${dataHoraEmissao}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Discriminado</th>
            <th class="num">MONTEIRO</th>
            <th class="num">SJE</th>
            <th class="num">CONSOLIDADO</th>
          </tr>
        </thead>
        <tbody>
          ${linhas
            .map(
              (l) => `
            <tr>
              <td>${l.item}</td>
              <td class="num">${l.m}</td>
              <td class="num">${l.s}</td>
              <td class="num" style="font-weight: 600;">${l.c}</td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-unidade-row">
            <td>TOTAL DA UNIDADE (SEM TERCEIROS)</td>
            <td class="num">${formatarMoeda(totaisMonteiro.totalUnidadeGeral)}</td>
            <td class="num">${formatarMoeda(totaisSje.totalUnidadeGeral)}</td>
            <td class="num">${formatarMoeda(totaisConsolidado.totalUnidadeGeral)}</td>
          </tr>
          <tr class="total-geral-row">
            <td>TOTAL GERAL GC MIX</td>
            <td class="num">${formatarMoeda(totaisMonteiro.totalUnidadeGeral)}</td>
            <td class="num">${formatarMoeda(totaisSje.totalUnidadeGeral)}</td>
            <td class="num">${formatarMoeda(totaisConsolidado.totalUnidadeGeral)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        Relatório Gerencial Oficial de Consolidação da Folha de Pagamento — GC MIX Concreto Usinado
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `

  janela.document.write(html)
  janela.document.close()
}
