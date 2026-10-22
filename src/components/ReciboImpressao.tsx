import { forwardRef } from "react"
import type { OrdemServico, Empresa } from "@/types/concreteira"
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"

interface ReciboImpressaoProps {
  ordem: OrdemServico
  empresa: Empresa | null
  /**
   * Se true, exibe apenas uma via (1 folha A4).
   * Por padrão (false), exibe duas vias (Via 1 — Empresa e Via 2 — Cliente),
   * cada uma em sua própria folha A4.
   */
  viaUnica?: boolean
}

interface ViaReciboProps {
  ordem: OrdemServico
  empresa: Empresa | null
  identificacaoVia: string
  subtituloVia?: string
  isLastVia?: boolean
}

function ViaRecibo({
  ordem,
  empresa,
  identificacaoVia,
  subtituloVia,
  isLastVia = false,
}: ViaReciboProps) {
  // Dados da empresa emissora
  const nomeEmpresa =
    empresa?.razao_social ||
    (empresa?.slug === "sje"
      ? "CALDAS & AMARAL CONSTRUCOES LTDA"
      : "AGREGADO MONTEIRO CONSTRUCOES E CONCRETO LTDA")

  const enderecoEmpresa =
    empresa?.endereco ||
    (empresa?.slug === "sje"
      ? "SITIO PAPAGAIO, - SAO JOSE DO EGITO, PE"
      : "RODOVIA PB-264, KM 02 - MONTEIRO, PB")

  const telefoneEmpresa =
    empresa?.telefone ||
    (empresa?.slug === "sje" ? "0800-083-1200" : "(83) 3351-1000")

  const cnpjEmpresa =
    empresa?.cnpj ||
    (empresa?.slug === "sje" ? "33.534.028/0001-68" : "12.345.678/0001-90")

  const dataEmissaoFormatada = ordem.data_emissao
    ? ordem.data_emissao.split("-").reverse().join("/")
    : new Date().toLocaleDateString("pt-BR")

  return (
    <div
      className={`via-recibo-card bg-white text-black font-sans border-2 border-black p-3 rounded-none shadow-none flex flex-col justify-between ${
        !isLastVia ? "page-break-after-always" : ""
      }`}
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        fontSize: "8.5pt",
        lineHeight: 1.25,
        minHeight: "275mm",
        boxSizing: "border-box",
        pageBreakAfter: !isLastVia ? "always" : "auto",
        breakAfter: !isLastVia ? "page" : "auto",
      }}
    >
      <div className="space-y-2">
        {/* TARJETA SUPERIOR DE IDENTIFICAÇÃO DA VIA */}
        <div className="flex justify-between items-center bg-gray-100 border border-black px-2.5 py-1 text-[8.5pt]">
          <div className="font-extrabold tracking-wider uppercase flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-black rounded-full print:bg-black" />
            <span className="text-[9pt] font-black">{identificacaoVia}</span>
            {subtituloVia && (
              <span className="font-normal text-gray-700">
                ({subtituloVia})
              </span>
            )}
          </div>
          <div className="font-mono font-black text-[10pt]">
            OS Nº {ordem.numero_os}
          </div>
        </div>

        {/* CABEÇALHO COM LOGOMARCA / IDENTIFICAÇÃO E RECIBO Nº */}
        <div className="border border-black p-2 flex justify-between items-center gap-3">
          {/* Logo oficial da empresa GC MIX & Pedreira Cordeiro */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt={LOGO_ALT_TEXT}
              className="h-12 w-auto max-w-[190px] sm:max-w-[220px] object-contain shrink-0 rounded-[2px]"
              style={{ imageRendering: "auto" }}
            />
            <div className="leading-tight min-w-0 flex-1 pl-1">
              <h1 className="font-black text-[10pt] uppercase tracking-tight text-black truncate">
                {nomeEmpresa}
              </h1>
              <p className="text-[7.5pt] uppercase font-bold text-gray-800 leading-snug">
                {enderecoEmpresa}
              </p>
              <p className="text-[7.5pt] text-gray-800 leading-snug font-medium">
                Telefone:{" "}
                <span className="font-semibold">{telefoneEmpresa}</span> — CNPJ:{" "}
                <span className="font-mono font-semibold">{cnpjEmpresa}</span>
              </p>
            </div>
          </div>

          {/* Bloco Número do Recibo e Data */}
          <div className="text-right border-l-2 border-black pl-3 shrink-0 py-0.5">
            <div className="text-[12pt] font-black tracking-wider uppercase text-black leading-none font-mono">
              RECIBO Nº {ordem.numero_os}
            </div>
            <div className="text-[8pt] font-semibold mt-1 text-gray-800">
              Emissão: <span className="font-mono">{dataEmissaoFormatada}</span>
            </div>
          </div>
        </div>

        {/* DADOS DO DESTINATÁRIO */}
        <div className="border border-black">
          <div className="bg-gray-100 text-center font-black text-[9.5pt] uppercase py-1 border-b border-black tracking-wide">
            DADOS DO DESTINATÁRIO
          </div>
          <div className="p-2 grid grid-cols-12 gap-y-1.5 gap-x-3 text-[8.5pt] leading-normal">
            <div className="col-span-12 flex items-baseline">
              <span className="font-bold w-16 text-black shrink-0">Nome:</span>
              <span className="uppercase font-extrabold flex-1 text-black text-[9pt] truncate">
                {ordem.destinatario_nome}
              </span>
            </div>

            {(ordem.nome_obra || ordem.local_descarga) && (
              <>
                {ordem.nome_obra && (
                  <div className="col-span-6 flex items-baseline">
                    <span className="font-bold w-16 text-black shrink-0">
                      Obra:
                    </span>
                    <span className="uppercase font-semibold flex-1 text-black truncate">
                      {ordem.nome_obra}
                    </span>
                  </div>
                )}
                {ordem.local_descarga && (
                  <div className="col-span-6 flex items-baseline">
                    <span className="font-bold w-20 text-black shrink-0">
                      Descarga:
                    </span>
                    <span className="uppercase flex-1 text-black truncate">
                      {ordem.local_descarga}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="col-span-8 flex items-baseline">
              <span className="font-bold w-16 text-black shrink-0">
                Endereço:
              </span>
              <span className="uppercase flex-1 text-black truncate">
                {ordem.destinatario_endereco || "—"}
              </span>
            </div>
            <div className="col-span-4 flex items-baseline">
              <span className="font-bold w-14 text-black shrink-0">
                Bairro:
              </span>
              <span className="uppercase flex-1 text-black truncate">
                {ordem.destinatario_bairro || "—"}
              </span>
            </div>

            <div className="col-span-8 flex items-baseline">
              <span className="font-bold w-16 text-black shrink-0">
                Município:
              </span>
              <span className="uppercase flex-1 text-black truncate">
                {ordem.destinatario_cidade
                  ? `${ordem.destinatario_cidade}, ${ordem.destinatario_uf || "PB"}`
                  : "—"}
              </span>
            </div>
            <div className="col-span-4 flex items-baseline">
              <span className="font-bold w-14 text-black shrink-0">CEP:</span>
              <span className="font-mono flex-1 text-black">
                {ordem.destinatario_cep || "—"}
              </span>
            </div>

            <div className="col-span-8 flex items-baseline">
              <span className="font-bold w-16 text-black shrink-0">
                CNPJ/CPF:
              </span>
              <span className="font-mono font-semibold flex-1 text-black">
                {ordem.destinatario_cpf_cnpj || "—"}
              </span>
            </div>
            <div className="col-span-4 flex items-baseline">
              <span className="font-bold w-14 text-black shrink-0">Fone:</span>
              <span className="flex-1 text-black truncate font-mono">
                {ordem.destinatario_telefone || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* TABELA DE ITENS (Quantidade / Unidade / Discriminação) */}
        <div className="border border-black">
          <table className="w-full table-fixed text-[8.5pt] border-collapse leading-tight">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "65%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-black bg-gray-100">
                <th className="py-1 px-2 text-right border-r border-black font-extrabold text-black uppercase text-[8pt]">
                  Quantidade
                </th>
                <th className="py-1 px-2 text-center border-r border-black font-extrabold text-black uppercase text-[8pt]">
                  Unidade
                </th>
                <th className="py-1 px-2 text-left font-extrabold text-black uppercase text-[8pt]">
                  Discriminação do Produto / Traço
                </th>
              </tr>
            </thead>
            <tbody>
              {ordem.itens && ordem.itens.length > 0 ? (
                ordem.itens.map((it, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-black last:border-b-0"
                  >
                    <td className="py-1.5 px-2 text-right font-mono font-black border-r border-black text-black text-[9.5pt]">
                      {Number(it.quantidade).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-1.5 px-2 text-center uppercase font-bold border-r border-black text-black">
                      {it.unidade}
                    </td>
                    <td className="py-1.5 px-2 uppercase font-extrabold text-black truncate text-[9pt]">
                      {it.discriminacao}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="py-2 text-center italic text-gray-600"
                  >
                    Nenhum item discriminado
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* TABELA CONDICIONAL DE INSUMOS DA CARGA (quando exibir_insumos_os === true) */}
          {ordem.exibir_insumos_os &&
            ordem.insumos_detalhados &&
            ordem.insumos_detalhados.length > 0 && (
              <div className="border-t border-black bg-gray-50/70 p-1.5">
                <div className="text-[7.5pt] font-black uppercase tracking-wider text-black mb-1 px-1">
                  Composição dos Insumos da Carga:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 px-1">
                  {ordem.insumos_detalhados.map((ins, i) => (
                    <div
                      key={i}
                      className="border border-black bg-white px-1.5 py-1 text-[7.5pt] flex justify-between items-center"
                    >
                      <span className="font-bold uppercase text-gray-800 truncate mr-1.5">
                        {ins.material}:
                      </span>
                      <span className="font-mono font-black shrink-0 text-black">
                        {Number(ins.quantidade).toLocaleString("pt-BR")}{" "}
                        {ins.unidade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* BLOCO DE VERIFICAÇÃO SLUMP (CENTRAL E PEÇA CONCRETADA) */}
        <div className="border border-black">
          <div className="bg-gray-100 text-center font-black text-[9.5pt] uppercase py-1 border-b border-black tracking-wide">
            VERIFICAÇÃO DE SLUMP (CENTRAL E PEÇA CONCRETADA)
          </div>
          <table className="w-full table-fixed text-[8pt] border-collapse text-center leading-tight">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-black bg-gray-50 font-extrabold text-black">
                <th className="py-1 px-1.5 border-r border-black uppercase text-[7.5pt]">
                  SLUMP MEDIDO
                </th>
                <th className="py-1 px-1.5 border-r border-black uppercase text-[7.5pt]">
                  SLUMP SAÍDA
                </th>
                <th className="py-1 px-1.5 border-r border-black uppercase text-[7.5pt]">
                  ÁGUA ADIC. (L)
                </th>
                <th className="py-1 px-1.5 border-r border-black uppercase text-[7.5pt]">
                  MOLDAGEM
                </th>
                <th className="py-1 px-1.5 uppercase text-[7.5pt]">
                  VISTO MOTORISTA
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Linha 1: Central */}
              <tr className="border-b border-black h-7 text-black text-[8.5pt]">
                <td className="border-r border-black font-extrabold truncate px-1">
                  {ordem.slump_central_medido
                    ? `${ordem.slump_central_medido} ${
                        ordem.slump_tolerancia
                          ? `(${ordem.slump_tolerancia})`
                          : ""
                      }`
                    : ""}
                </td>
                <td className="border-r border-black font-extrabold truncate px-1">
                  {ordem.slump_central_saida || ""}
                </td>
                <td className="border-r border-black font-mono font-bold truncate px-1">
                  {ordem.agua_adic_central != null &&
                  Number(ordem.agua_adic_central) > 0
                    ? `${ordem.agua_adic_central} L`
                    : ""}
                </td>
                <td className="border-r border-black truncate px-1 font-semibold uppercase">
                  {ordem.moldagem_central || ""}
                </td>
                <td className="truncate px-1 font-semibold uppercase">
                  {ordem.visto_motorista_central || ""}
                </td>
              </tr>
              {/* Linha 2: Peça Concretada */}
              <tr className="bg-gray-50 text-[7.5pt] font-extrabold border-b border-black text-black">
                <td className="border-r border-black py-0.5 uppercase">
                  SLUMP MEDIDO
                </td>
                <td className="border-r border-black py-0.5 uppercase">
                  SLUMP SAÍDA
                </td>
                <td className="border-r border-black py-0.5 uppercase">
                  ÁGUA ADIC. (L)
                </td>
                <td className="border-r border-black py-0.5 uppercase">
                  PEÇA CONCRETADA
                </td>
                <td className="py-0.5 uppercase">VISTO MOTORISTA</td>
              </tr>
              <tr className="h-7 text-black text-[8.5pt]">
                <td className="border-r border-black font-extrabold truncate px-1">
                  {ordem.slump_peca_medido || ""}
                </td>
                <td className="border-r border-black font-extrabold truncate px-1">
                  {ordem.slump_peca_saida || ""}
                </td>
                <td className="border-r border-black font-mono font-bold truncate px-1">
                  {ordem.agua_adic_peca != null &&
                  Number(ordem.agua_adic_peca) > 0
                    ? `${ordem.agua_adic_peca} L`
                    : ""}
                </td>
                <td className="border-r border-black uppercase font-semibold truncate px-1">
                  {ordem.peca_concretada || ""}
                </td>
                <td className="truncate px-1 font-semibold uppercase">
                  {ordem.visto_motorista_peca || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DADOS DE TRANSPORTE */}
        <div className="border border-black">
          <div className="bg-gray-100 text-center font-black text-[9.5pt] uppercase py-1 border-b border-black tracking-wide">
            DADOS DE TRANSPORTE E HORÁRIOS
          </div>
          <table className="w-full table-fixed text-[8pt] border-collapse text-center leading-tight">
            <colgroup>
              <col style={{ width: "16.66%" }} />
              <col style={{ width: "33.34%" }} />
              <col style={{ width: "16.66%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11.34%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-black bg-gray-50 font-extrabold text-black">
                <th className="py-1 px-1 border-r border-black uppercase text-[7.5pt]">
                  PLACA
                </th>
                <th className="py-1 px-1 border-r border-black uppercase text-[7.5pt]">
                  MOTORISTA
                </th>
                <th className="py-1 px-1 border-r border-black uppercase text-[7.5pt]">
                  LACRE
                </th>
                <th className="py-1 px-1 border-r border-black uppercase text-[7.5pt]">
                  KM INI
                </th>
                <th className="py-1 px-1 border-r border-black uppercase text-[7.5pt]">
                  KM FIM
                </th>
                <th className="py-1 px-1 uppercase text-[7.5pt]">HORA CARGA</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black h-7 text-black text-[8.5pt]">
                <td className="border-r border-black font-mono font-black text-[9pt] truncate px-1">
                  {ordem.veiculo_placa || ""}
                </td>
                <td className="border-r border-black uppercase font-bold truncate px-1">
                  {ordem.motorista_nome || ""}
                </td>
                <td className="border-r border-black font-mono font-semibold truncate px-1">
                  {ordem.lacre || ""}
                </td>
                <td className="border-r border-black font-mono truncate px-1">
                  {ordem.km_inicial ?? ""}
                </td>
                <td className="border-r border-black font-mono truncate px-1">
                  {ordem.km_final ?? ""}
                </td>
                <td className="font-mono font-bold truncate px-1">
                  {ordem.hora_carga || ""}
                </td>
              </tr>
              {/* Horários */}
              <tr className="bg-gray-50 text-[7.5pt] font-extrabold border-b border-black text-black">
                <td className="border-r border-black py-0.5 uppercase">
                  SAÍDA CENTRAL
                </td>
                <td className="border-r border-black py-0.5 uppercase">
                  CHEGADA OBRA
                </td>
                <td className="border-r border-black py-0.5 uppercase">
                  INÍCIO DESC.
                </td>
                <td className="border-r border-black py-0.5 uppercase">
                  FIM DESC.
                </td>
                <td className="border-r border-black py-0.5 uppercase">
                  SAÍDA OBRA
                </td>
                <td className="py-0.5 uppercase">CHEGADA CENT.</td>
              </tr>
              <tr className="border-b border-black h-7 text-[8.5pt] font-mono text-black font-semibold">
                <td className="border-r border-black truncate px-1">
                  {ordem.hora_saida_central || ""}
                </td>
                <td className="border-r border-black truncate px-1">
                  {ordem.hora_chegada_obra || ""}
                </td>
                <td className="border-r border-black truncate px-1">
                  {ordem.hora_inicio_descarga || ""}
                </td>
                <td className="border-r border-black truncate px-1">
                  {ordem.hora_fim_descarga || ""}
                </td>
                <td className="border-r border-black truncate px-1">
                  {ordem.hora_saida_obra || ""}
                </td>
                <td className="truncate px-1">
                  {ordem.hora_chegada_central || ""}
                </td>
              </tr>
              {/* Visto Obra */}
              <tr className="h-6 text-left text-black">
                <td colSpan={6} className="px-2 py-1">
                  <span className="font-extrabold text-[8pt]">
                    VISTO OBRA:{" "}
                  </span>
                  <span className="uppercase text-[8pt] font-semibold">
                    {ordem.visto_obra || ""}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* OBSERVAÇÕES */}
        <div className="border border-black p-2 text-[8pt] text-black leading-snug">
          <span className="font-extrabold">Observações: </span>
          <span className="uppercase font-mono text-[7.5pt]">
            {ordem.observacoes ||
              `FOLGA DE ÁGUA: 15L/m3 VENDEDOR: ${ordem.vendedor_nome || "—"} CONTRATANTE: ${ordem.destinatario_nome} - CNPJ/CPF: ${ordem.destinatario_cpf_cnpj || "—"} - MOTORISTA: ${ordem.motorista_nome || "—"} - LACRE: ${ordem.lacre || "—"} - PLACA: ${ordem.veiculo_placa || "—"} - BOMBA: ${ordem.bomba_estacionaria || "—"}`}
          </span>
        </div>

        {/* AVISO IMPORTANTE DE CURA ÚMIDA */}
        <div className="text-[7.5pt] leading-snug text-black border border-black/40 p-1.5 bg-gray-50/50">
          <span className="font-black text-black">IMPORTANTE: </span>
          Exposto ao sol e ao vento, o concreto perde água antes de endurecer,
          ocasionando trincas. Realizar processo de cura úmida pelo menos 3
          vezes ao dia durante 7 dias consecutivos.
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {/* TERMO DE RESPONSABILIDADE */}
        <div className="border-t-2 border-black pt-2 text-[8pt] space-y-1 text-black leading-snug">
          <div className="font-black uppercase tracking-wider text-[8.5pt]">
            TERMO DE RESPONSABILIDADE (ADIÇÃO DE ÁGUA)
          </div>
          <div className="font-medium leading-snug text-[8pt]">
            DETERMINO A ADIÇÃO DE{" "}
            <span className="font-mono font-black underline px-2 text-[9pt]">
              {ordem.agua_adicional_termo != null
                ? `${ordem.agua_adicional_termo}`
                : "________"}
            </span>{" "}
            LITROS DE ÁGUA NESTA CARGA. TENHO CIÊNCIA DA ALTERAÇÃO NAS
            PROPRIEDADES DO CONCRETO.
          </div>
          <div className="flex justify-between items-end pt-3 text-[8pt]">
            <div className="font-semibold">DATA: _____/_____/________</div>
            <div className="flex-1 max-w-[340px] border-b-2 border-black text-center pb-0.5 text-[7.5pt] font-bold">
              ASSINATURA DO RESPONSÁVEL PELA OBRA
            </div>
          </div>
        </div>

        {/* CANHOTO / RECIBO DE RECEBIMENTO */}
        <div className="border-t-2 border-black pt-2 text-[8pt] space-y-1 text-black leading-snug">
          <div className="flex justify-between items-center font-bold">
            <span className="font-black text-[9pt]">
              CANHOTO — RECIBO Nº {ordem.numero_os}
            </span>
            <span className="uppercase text-[7.5pt] font-extrabold text-gray-800">
              RECEBEMOS DE {nomeEmpresa} OS ITENS DISCRIMINADOS
            </span>
          </div>
          <div className="flex justify-between items-end pt-3 text-[8pt]">
            <div className="font-semibold">DATA: _____/_____/________</div>
            <div className="flex-1 max-w-[340px] border-b-2 border-black text-center pb-0.5 text-[7.5pt] font-bold">
              ASSINATURA DO RECEBEDOR
            </div>
          </div>
        </div>

        {/* RODAPÉ INTERNO DA VIA */}
        <div className="pt-1 border-t border-gray-300 flex justify-between text-[6.5pt] text-gray-600 print:text-black">
          <span className="font-semibold">
            SISTEMA DE CONCRETO USINADO — GC MIX
          </span>
          <span className="uppercase font-bold">{identificacaoVia}</span>
          <span>{new Date().toLocaleString("pt-BR")}</span>
        </div>
      </div>
    </div>
  )
}

export const ReciboImpressao = forwardRef<HTMLDivElement, ReciboImpressaoProps>(
  ({ ordem, empresa, viaUnica = false }, ref) => {
    return (
      <div
        ref={ref}
        id="recibo-impressao-raiz"
        className="recibo-container-impressao bg-white text-black font-sans leading-tight mx-auto p-0 max-w-[210mm]"
        style={{
          color: "#000000",
          backgroundColor: "#ffffff",
          width: "100%",
          display: "block",
          visibility: "visible",
        }}
      >
        {/* VIA 1 — EMPRESA (FOLHA A4 1) */}
        <div>
          <ViaRecibo
            ordem={ordem}
            empresa={empresa}
            identificacaoVia="Via 1 — Empresa"
            subtituloVia="Arquivo da Concreteira / Controle de Carga"
            isLastVia={viaUnica}
          />
        </div>

        {/* SE FOR DUAS VIAS (PADRÃO): VIA 2 (CLIENTE) NA FOLHA A4 2 (SEM LINHA DE CORTE) */}
        {!viaUnica && (
          <div>
            <ViaRecibo
              ordem={ordem}
              empresa={empresa}
              identificacaoVia="Via 2 — Cliente"
              subtituloVia="Via do Destinatário / Cópia da Obra"
              isLastVia={true}
            />
          </div>
        )}
      </div>
    )
  },
)

ReciboImpressao.displayName = "ReciboImpressao"
