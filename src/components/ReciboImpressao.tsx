import { forwardRef } from 'react'
import type { OrdemServico, Empresa } from '@/types/concreteira'
import { Scissors } from 'lucide-react'
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from '@/assets/logos'

interface ReciboImpressaoProps {
  ordem: OrdemServico
  empresa: Empresa | null
  /**
   * Se true, exibe apenas uma via. Por padrão (false), exibe as duas vias
   * (Via 1 — Empresa e Via 2 — Cliente) com linha de corte tracejada.
   */
  viaUnica?: boolean
}

interface ViaReciboProps {
  ordem: OrdemServico
  empresa: Empresa | null
  identificacaoVia: string
  subtituloVia?: string
}

function ViaRecibo({
  ordem,
  empresa,
  identificacaoVia,
  subtituloVia,
}: ViaReciboProps) {
  // Dados da empresa emissora
  const nomeEmpresa =
    empresa?.razao_social ||
    (empresa?.slug === 'sje'
      ? 'CALDAS & AMARAL CONSTRUCOES LTDA'
      : 'AGREGADO MONTEIRO CONSTRUCOES E CONCRETO LTDA')

  const enderecoEmpresa =
    empresa?.endereco ||
    (empresa?.slug === 'sje'
      ? 'SITIO PAPAGAIO, - SAO JOSE DO EGITO, PE'
      : 'RODOVIA PB-264, KM 02 - MONTEIRO, PB')

  const telefoneEmpresa =
    empresa?.telefone ||
    (empresa?.slug === 'sje' ? '0800-083-1200' : '(83) 3351-1000')

  const cnpjEmpresa =
    empresa?.cnpj ||
    (empresa?.slug === 'sje' ? '33.534.028/0001-68' : '12.345.678/0001-90')

  const dataEmissaoFormatada = ordem.data_emissao
    ? ordem.data_emissao.split('-').reverse().join('/')
    : new Date().toLocaleDateString('pt-BR')

  return (
    <div
      className="via-recibo-card bg-white text-black font-sans leading-tight border border-black p-2 rounded-none text-[7.5pt] shadow-none"
      style={{ backgroundColor: '#ffffff', color: '#000000' }}
    >
      {/* TARJETA SUPERIOR DE IDENTIFICAÇÃO DA VIA */}
      <div className="flex justify-between items-center bg-gray-100 border border-black px-2 py-0.5 mb-1 text-[7pt]">
        <div className="font-extrabold tracking-wider uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-black rounded-full print:bg-black" />
          <span>{identificacaoVia}</span>
          {subtituloVia && (
            <span className="font-normal text-gray-700">({subtituloVia})</span>
          )}
        </div>
        <div className="font-mono font-bold text-[7.5pt]">
          OS Nº {ordem.numero_os}
        </div>
      </div>

      {/* CABEÇALHO COM LOGOMARCA / IDENTIFICAÇÃO E RECIBO Nº */}
      <div className="border border-black p-1 mb-1 flex justify-between items-center gap-2">
        {/* Logo oficial da empresa GC MIX & Pedreira Cordeiro */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={LOGO_GC_MIX_HORIZONTAL}
            alt={LOGO_ALT_TEXT}
            className="h-10 w-auto max-w-[150px] sm:max-w-[180px] object-contain shrink-0 rounded-[3px] border border-black/10"
            style={{ imageRendering: 'auto' }}
          />
          <div className="leading-tight min-w-0 flex-1">
            <h1 className="font-extrabold text-[8.5pt] uppercase tracking-tight text-black truncate">
              {nomeEmpresa}
            </h1>
            <p className="text-[6.5pt] uppercase font-semibold text-gray-800 leading-tight">
              {enderecoEmpresa}
            </p>
            <p className="text-[6.5pt] text-gray-800 leading-tight">
              Telefone: {telefoneEmpresa} — CNPJ: {cnpjEmpresa}
            </p>
          </div>
        </div>

        {/* Bloco Número do Recibo e Data */}
        <div className="text-right border-l border-black pl-2.5 shrink-0">
          <div className="text-xs font-black tracking-wider uppercase text-black leading-none">
            RECIBO Nº {ordem.numero_os}
          </div>
          <div className="text-[7pt] font-medium mt-0.5 text-gray-800">
            Emissão: {dataEmissaoFormatada}
          </div>
        </div>
      </div>

      {/* DADOS DO DESTINATÁRIO */}
      <div className="border border-black mb-1.5">
        <div className="bg-gray-100 text-center font-bold text-[7.5pt] uppercase py-0.5 border-b border-black">
          DADOS DO DESTINATÁRIO
        </div>
        <div className="p-1.5 grid grid-cols-12 gap-y-0.5 gap-x-2 text-[7.5pt]">
          <div className="col-span-12 flex">
            <span className="font-bold w-16 text-black">Nome:</span>
            <span className="uppercase font-semibold flex-1 text-black">
              {ordem.destinatario_nome}
            </span>
          </div>

          {(ordem.nome_obra || ordem.local_descarga) && (
            <>
              {ordem.nome_obra && (
                <div className="col-span-6 flex">
                  <span className="font-bold w-16 text-black">Obra:</span>
                  <span className="uppercase font-semibold flex-1 text-black">
                    {ordem.nome_obra}
                  </span>
                </div>
              )}
              {ordem.local_descarga && (
                <div className="col-span-6 flex">
                  <span className="font-bold w-24 text-black">
                    Local Descarga:
                  </span>
                  <span className="uppercase flex-1 text-black">
                    {ordem.local_descarga}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="col-span-8 flex">
            <span className="font-bold w-16 text-black">Endereço:</span>
            <span className="uppercase flex-1 text-black">
              {ordem.destinatario_endereco || '—'}
            </span>
          </div>
          <div className="col-span-4 flex">
            <span className="font-bold w-14 text-black">Bairro:</span>
            <span className="uppercase flex-1 text-black">
              {ordem.destinatario_bairro || '—'}
            </span>
          </div>

          <div className="col-span-8 flex">
            <span className="font-bold w-16 text-black">Município:</span>
            <span className="uppercase flex-1 text-black">
              {ordem.destinatario_cidade
                ? `${ordem.destinatario_cidade}, ${ordem.destinatario_uf || 'PB'}`
                : '—'}
            </span>
          </div>
          <div className="col-span-4 flex">
            <span className="font-bold w-14 text-black">CEP:</span>
            <span className="font-mono flex-1 text-black">
              {ordem.destinatario_cep || '—'}
            </span>
          </div>

          <div className="col-span-8 flex">
            <span className="font-bold w-16 text-black">CNPJ/CPF:</span>
            <span className="font-mono flex-1 text-black">
              {ordem.destinatario_cpf_cnpj || '—'}
            </span>
          </div>
          <div className="col-span-4 flex">
            <span className="font-bold w-14 text-black">Telefone:</span>
            <span className="flex-1 text-black">
              {ordem.destinatario_telefone || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* TABELA DE ITENS (Quantidade / Unidade / Discriminação) */}
      <div className="border border-black mb-1.5">
        <table className="w-full text-[7.5pt] border-collapse">
          <thead>
            <tr className="border-b border-black bg-gray-50">
              <th className="py-0.5 px-2 text-right border-r border-black w-24 font-bold text-black">
                Quantidade
              </th>
              <th className="py-0.5 px-2 text-center border-r border-black w-20 font-bold text-black">
                Unidade
              </th>
              <th className="py-0.5 px-2 text-left font-bold text-black">
                Discriminação
              </th>
            </tr>
          </thead>
          <tbody>
            {ordem.itens && ordem.itens.length > 0 ? (
              ordem.itens.map((it, idx) => (
                <tr key={idx} className="border-b border-black last:border-b-0">
                  <td className="py-1 px-2 text-right font-mono font-bold border-r border-black text-black">
                    {Number(it.quantidade).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-1 px-2 text-center uppercase border-r border-black text-black">
                    {it.unidade}
                  </td>
                  <td className="py-1 px-2 uppercase font-semibold text-black">
                    {it.discriminacao}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="py-1.5 text-center italic text-gray-600"
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
            <div className="border-t border-black bg-gray-50/60 p-1">
              <div className="text-[6.5pt] font-bold uppercase tracking-wider text-gray-800 mb-0.5 px-1">
                Composição dos Insumos da Carga:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 px-1">
                {ordem.insumos_detalhados.map((ins, i) => (
                  <div
                    key={i}
                    className="border border-black/40 bg-white px-1.5 py-0.5 text-[6.5pt] flex justify-between items-center"
                  >
                    <span className="font-semibold uppercase text-gray-800 truncate mr-1">
                      {ins.material}:
                    </span>
                    <span className="font-mono font-bold shrink-0 text-black">
                      {Number(ins.quantidade).toLocaleString('pt-BR')}{' '}
                      {ins.unidade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* BLOCO DE VERIFICAÇÃO SLUMP (CENTRAL E PEÇA CONCRETADA) */}
      <div className="border border-black mb-1.5">
        <div className="bg-gray-100 text-center font-bold text-[7.5pt] uppercase py-0.5 border-b border-black">
          VERIFICAÇÃO SLUMP - CENTRAL
        </div>
        <table className="w-full text-[7pt] border-collapse text-center">
          <thead>
            <tr className="border-b border-black bg-gray-50 font-bold text-black">
              <th className="py-0.5 px-1 border-r border-black w-1/5">
                SLUMP MEDIDO
              </th>
              <th className="py-0.5 px-1 border-r border-black w-1/5">
                SLUMP SAÍDA
              </th>
              <th className="py-0.5 px-1 border-r border-black w-1/5">
                ÁGUA ADIC. (L)
              </th>
              <th className="py-0.5 px-1 border-r border-black w-1/5">
                MOLDAGEM
              </th>
              <th className="py-0.5 px-1 w-1/5">VISTO MOTORISTA</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha 1: Central */}
            <tr className="border-b border-black h-5 text-black">
              <td className="border-r border-black font-semibold">
                {ordem.slump_central_medido
                  ? `${ordem.slump_central_medido} ${ordem.slump_tolerancia ? `(${ordem.slump_tolerancia})` : ''}`
                  : ''}
              </td>
              <td className="border-r border-black font-semibold">
                {ordem.slump_central_saida || ''}
              </td>
              <td className="border-r border-black font-mono">
                {ordem.agua_adic_central != null && ordem.agua_adic_central > 0
                  ? `${ordem.agua_adic_central} L`
                  : ''}
              </td>
              <td className="border-r border-black">
                {ordem.moldagem_central || ''}
              </td>
              <td>{ordem.visto_motorista_central || ''}</td>
            </tr>
            {/* Linha 2: Peça Concretada */}
            <tr className="bg-gray-50 text-[6.5pt] font-bold border-b border-black text-black">
              <td className="border-r border-black py-0.5">SLUMP MEDIDO</td>
              <td className="border-r border-black py-0.5">SLUMP SAÍDA</td>
              <td className="border-r border-black py-0.5">ÁGUA ADIC. (L)</td>
              <td className="border-r border-black py-0.5">PEÇA CONCRETADA</td>
              <td className="py-0.5">VISTO MOTORISTA</td>
            </tr>
            <tr className="h-5 text-black">
              <td className="border-r border-black font-semibold">
                {ordem.slump_peca_medido || ''}
              </td>
              <td className="border-r border-black font-semibold">
                {ordem.slump_peca_saida || ''}
              </td>
              <td className="border-r border-black font-mono">
                {ordem.agua_adic_peca != null && ordem.agua_adic_peca > 0
                  ? `${ordem.agua_adic_peca} L`
                  : ''}
              </td>
              <td className="border-r border-black uppercase">
                {ordem.peca_concretada || ''}
              </td>
              <td>{ordem.visto_motorista_peca || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* DADOS DE TRANSPORTE */}
      <div className="border border-black mb-1.5">
        <div className="bg-gray-100 text-center font-bold text-[7.5pt] uppercase py-0.5 border-b border-black">
          DADOS DE TRANSPORTE
        </div>
        <table className="w-full text-[7pt] border-collapse text-center">
          <thead>
            <tr className="border-b border-black bg-gray-50 font-bold text-black">
              <th className="py-0.5 px-1 border-r border-black w-1/6">PLACA</th>
              <th className="py-0.5 px-1 border-r border-black w-2/6">
                MOTORISTA
              </th>
              <th className="py-0.5 px-1 border-r border-black w-1/6">LACRE</th>
              <th className="py-0.5 px-1 border-r border-black w-1/12">
                KM INI
              </th>
              <th className="py-0.5 px-1 border-r border-black w-1/12">
                KM FIM
              </th>
              <th className="py-0.5 px-1 w-1/6">HORA CARGA</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black h-5 text-black">
              <td className="border-r border-black font-mono font-bold text-[7.5pt]">
                {ordem.veiculo_placa || ''}
              </td>
              <td className="border-r border-black uppercase font-semibold">
                {ordem.motorista_nome || ''}
              </td>
              <td className="border-r border-black font-mono">
                {ordem.lacre || ''}
              </td>
              <td className="border-r border-black font-mono">
                {ordem.km_inicial ?? ''}
              </td>
              <td className="border-r border-black font-mono">
                {ordem.km_final ?? ''}
              </td>
              <td className="font-mono">{ordem.hora_carga || ''}</td>
            </tr>
            {/* Horários */}
            <tr className="bg-gray-50 text-[6.5pt] font-bold border-b border-black text-black">
              <td className="border-r border-black py-0.5">SAÍDA CENTRAL</td>
              <td className="border-r border-black py-0.5">CHEGADA OBRA</td>
              <td className="border-r border-black py-0.5">INÍCIO DESC.</td>
              <td className="border-r border-black py-0.5">FIM DESC.</td>
              <td className="border-r border-black py-0.5">SAÍDA OBRA</td>
              <td className="py-0.5">CHEGADA CENT.</td>
            </tr>
            <tr className="border-b border-black h-5 text-[7pt] font-mono text-black">
              <td className="border-r border-black">
                {ordem.hora_saida_central || ''}
              </td>
              <td className="border-r border-black">
                {ordem.hora_chegada_obra || ''}
              </td>
              <td className="border-r border-black">
                {ordem.hora_inicio_descarga || ''}
              </td>
              <td className="border-r border-black">
                {ordem.hora_fim_descarga || ''}
              </td>
              <td className="border-r border-black">
                {ordem.hora_saida_obra || ''}
              </td>
              <td>{ordem.hora_chegada_central || ''}</td>
            </tr>
            {/* Visto Obra */}
            <tr className="h-4 text-left text-black">
              <td colSpan={6} className="px-1.5 py-0.5">
                <span className="font-bold text-[7pt]">VISTO OBRA: </span>
                <span className="uppercase text-[7pt]">
                  {ordem.visto_obra || ''}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="border border-black p-1 mb-1 text-[7pt] text-black">
        <span className="font-bold">Observações: </span>
        <span className="uppercase font-mono text-[6.5pt]">
          {ordem.observacoes ||
            `FOLGA DE ÁGUA: 15L/m3 VENDEDOR: ${ordem.vendedor_nome || '—'} CONTRATANTE: ${ordem.destinatario_nome} - CNPJ/CPF: ${ordem.destinatario_cpf_cnpj || '—'} - MOTORISTA: ${ordem.motorista_nome || '—'} - LACRE: ${ordem.lacre || '—'} - PLACA: ${ordem.veiculo_placa || '—'} - BOMBA: ${ordem.bomba_estacionaria || '—'}`}
        </span>
      </div>

      {/* AVISO IMPORTANTE DE CURA ÚMIDA */}
      <div className="text-[6.5pt] mb-1 leading-tight text-black">
        <span className="font-bold">IMPORTANTE: </span>
        Exposto ao sol e ao vento, o concreto perde água antes de endurecer,
        ocasionando trincas. Realizar processo de cura úmida pelo menos 3 vezes
        ao dia durante 7 dias consecutivos.
      </div>

      {/* TERMO DE RESPONSABILIDADE */}
      <div className="border-t border-black pt-1 mb-1.5 text-[6.5pt] space-y-0.5 text-black">
        <div className="font-bold uppercase tracking-wider">
          TERMO DE RESPONSABILIDADE (ADIÇÃO DE ÁGUA)
        </div>
        <div className="font-medium leading-tight">
          DETERMINO A ADIÇÃO DE{' '}
          <span className="font-mono font-bold underline px-1.5">
            {ordem.agua_adicional_termo != null
              ? `${ordem.agua_adicional_termo}`
              : '________'}
          </span>{' '}
          LITROS DE ÁGUA NESTA CARGA. TENHO CIÊNCIA DA ALTERAÇÃO NAS
          PROPRIEDADES DO CONCRETO.
        </div>
        <div className="flex justify-between items-end pt-1.5 text-[7pt]">
          <div>DATA: _____/_____/________</div>
          <div className="flex-1 max-w-[340px] border-b border-black text-center pb-0.5 text-[6.5pt]">
            ASSINATURA DO RESPONSÁVEL PELA OBRA
          </div>
        </div>
      </div>

      {/* CANHOTO / RECIBO DE RECEBIMENTO */}
      <div className="border-t-2 border-black pt-1 text-[7pt] space-y-0.5 text-black">
        <div className="flex justify-between items-center font-bold">
          <span className="font-black text-[7.5pt]">
            CANHOTO — RECIBO Nº {ordem.numero_os}
          </span>
          <span className="uppercase text-[6.5pt]">
            RECEBEMOS DE {nomeEmpresa} OS ITENS DISCRIMINADOS
          </span>
        </div>
        <div className="flex justify-between items-end pt-1.5 text-[7pt]">
          <div>DATA: _____/_____/________</div>
          <div className="flex-1 max-w-[340px] border-b border-black text-center pb-0.5 text-[6.5pt]">
            ASSINATURA DO RECEBEDOR
          </div>
        </div>
      </div>
    </div>
  )
}

export const ReciboImpressao = forwardRef<HTMLDivElement, ReciboImpressaoProps>(
  ({ ordem, empresa, viaUnica = false }, ref) => {
    const agoraDataHora = new Date().toLocaleString('pt-BR')

    return (
      <div
        ref={ref}
        id="recibo-impressao-raiz"
        className="recibo-container-impressao bg-white text-black font-sans leading-tight mx-auto p-0 max-w-[210mm]"
        style={{
          color: '#000000',
          backgroundColor: '#ffffff',
          width: '100%',
          display: 'block',
          visibility: 'visible',
        }}
      >
        {/* VIA 1 — EMPRESA */}
        <div className="page-break-inside-avoid">
          <ViaRecibo
            ordem={ordem}
            empresa={empresa}
            identificacaoVia="Via 1 — Empresa"
            subtituloVia="Arquivo da Concreteira / Controle de Carga"
          />
        </div>

        {/* SE FOR DUAS VIAS (PADRÃO): LINHA DE CORTE + VIA 2 (CLIENTE) */}
        {!viaUnica && (
          <>
            {/* LINHA DE CORTE TRACEJADA COM ÍCONE DE TESOURA */}
            <div className="my-1.5 py-0.5 flex items-center gap-2 select-none text-gray-500">
              <div className="flex-1 border-t border-dashed border-gray-400" />
              <div className="flex items-center gap-1 text-[6.5pt] font-semibold uppercase tracking-wider text-gray-600 bg-white px-2">
                <Scissors className="w-3 h-3 text-gray-600" />
                <span>Linha de Corte — Destaque aqui</span>
              </div>
              <div className="flex-1 border-t border-dashed border-gray-400" />
            </div>

            {/* VIA 2 — CLIENTE */}
            <div className="page-break-inside-avoid">
              <ViaRecibo
                ordem={ordem}
                empresa={empresa}
                identificacaoVia="Via 2 — Cliente"
                subtituloVia="Via do Destinatário / Cópia da Obra"
              />
            </div>
          </>
        )}

        {/* RODAPÉ DO DOCUMENTO IMPRESSO */}
        <div className="mt-1 pt-0.5 border-t border-gray-300 flex justify-between text-[6pt] text-gray-500 print:text-black">
          <span>SISTEMA DE CONCRETO USINADO — GC MIX</span>
          <span>
            {viaUnica
              ? 'Recibo de Concreto (Via Única)'
              : 'Ordem de Serviço em 2 Vias (Empresa e Cliente)'}
          </span>
          <span>Impresso em {agoraDataHora}</span>
        </div>
      </div>
    )
  },
)

ReciboImpressao.displayName = 'ReciboImpressao'
