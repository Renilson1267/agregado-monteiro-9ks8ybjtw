import { forwardRef } from 'react'
import type { OrdemServico, Empresa } from '@/types/concreteira'

interface ReciboImpressaoProps {
  ordem: OrdemServico
  empresa: Empresa | null
}

export const ReciboImpressao = forwardRef<HTMLDivElement, ReciboImpressaoProps>(
  ({ ordem, empresa }, ref) => {
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

    // Data de emissão formatada
    const dataEmissaoFormatada = ordem.data_emissao
      ? ordem.data_emissao.split('-').reverse().join('/')
      : new Date().toLocaleDateString('pt-BR')

    const agoraDataHora = new Date().toLocaleString('pt-BR')

    return (
      <div
        ref={ref}
        className="recibo-a4-document bg-white text-black font-sans leading-tight p-4 max-w-[210mm] mx-auto text-[10pt]"
        style={{ color: '#000', backgroundColor: '#fff' }}
      >
        {/* CABEÇALHO COM LOGOMARCA / IDENTIFICAÇÃO E RECIBO Nº */}
        <div className="border border-black p-2 mb-2 flex justify-between items-center">
          {/* Logo / Nome Fantasia da concreteira */}
          <div className="flex items-center gap-3">
            <div className="border-2 border-black px-2 py-1 font-black text-xl tracking-tighter flex flex-col items-center leading-none">
              <span className="text-xl">GC MIX</span>
              <span className="text-[7pt] tracking-widest uppercase font-bold">
                CONCRETO USINADO
              </span>
            </div>
            <div>
              <h1 className="font-extrabold text-base uppercase tracking-tight">
                {nomeEmpresa}
              </h1>
              <p className="text-[8.5pt] uppercase font-semibold">
                {enderecoEmpresa}
              </p>
              <p className="text-[8.5pt]">
                Telefone: {telefoneEmpresa} - CNPJ: {cnpjEmpresa}
              </p>
            </div>
          </div>

          {/* Bloco Número do Recibo e Data */}
          <div className="text-right border-l border-black pl-4">
            <div className="text-lg font-black tracking-wider uppercase">
              RECIBO Nº {ordem.numero_os}
            </div>
            <div className="text-[9pt] font-medium mt-1">
              Data de emissão: {dataEmissaoFormatada}
            </div>
          </div>
        </div>

        {/* DADOS DO DESTINATÁRIO */}
        <div className="border border-black mb-2">
          <div className="bg-gray-100 text-center font-bold text-[9pt] uppercase py-0.5 border-b border-black">
            DADOS DO DESTINATÁRIO
          </div>
          <div className="p-2 grid grid-cols-12 gap-y-1 gap-x-2 text-[9pt]">
            <div className="col-span-12 flex">
              <span className="font-bold w-20">Nome:</span>
              <span className="uppercase font-semibold flex-1">
                {ordem.destinatario_nome}
              </span>
            </div>

            <div className="col-span-8 flex">
              <span className="font-bold w-20">Endereço:</span>
              <span className="uppercase flex-1">
                {ordem.destinatario_endereco || '—'}
              </span>
            </div>
            <div className="col-span-4 flex">
              <span className="font-bold w-16">Bairro:</span>
              <span className="uppercase flex-1">
                {ordem.destinatario_bairro || '—'}
              </span>
            </div>

            <div className="col-span-8 flex">
              <span className="font-bold w-20">Município:</span>
              <span className="uppercase flex-1">
                {ordem.destinatario_cidade
                  ? `${ordem.destinatario_cidade}, ${ordem.destinatario_uf || 'PB'}`
                  : '—'}
              </span>
            </div>
            <div className="col-span-4 flex">
              <span className="font-bold w-16">CEP:</span>
              <span className="font-mono flex-1">
                {ordem.destinatario_cep || '—'}
              </span>
            </div>

            <div className="col-span-8 flex">
              <span className="font-bold w-20">CNPJ/CPF:</span>
              <span className="font-mono flex-1">
                {ordem.destinatario_cpf_cnpj || '—'}
              </span>
            </div>
            <div className="col-span-4 flex">
              <span className="font-bold w-16">Telefone:</span>
              <span className="flex-1">
                {ordem.destinatario_telefone || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* TABELA DE ITENS (Quantidade / Unidade / Discriminação) */}
        <div className="border border-black mb-2">
          <table className="w-full text-[9pt] border-collapse">
            <thead>
              <tr className="border-b border-black bg-gray-50">
                <th className="py-1 px-3 text-right border-r border-black w-24 font-bold">
                  Quantidade
                </th>
                <th className="py-1 px-3 text-center border-r border-black w-20 font-bold">
                  Unidade
                </th>
                <th className="py-1 px-3 text-left font-bold">Discriminação</th>
              </tr>
            </thead>
            <tbody>
              {ordem.itens && ordem.itens.length > 0 ? (
                ordem.itens.map((it, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-black last:border-b-0"
                  >
                    <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-black">
                      {Number(it.quantidade).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-1.5 px-3 text-center uppercase border-r border-black">
                      {it.unidade}
                    </td>
                    <td className="py-1.5 px-3 uppercase font-semibold">
                      {it.discriminacao}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="py-3 text-center italic text-gray-500"
                  >
                    Nenhum item discriminado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BLOCO DE VERIFICAÇÃO SLUMP (CENTRAL E PEÇA CONCRETADA) */}
        <div className="border border-black mb-2">
          <div className="bg-gray-100 text-center font-bold text-[8.5pt] uppercase py-0.5 border-b border-black">
            VERIFICAÇÃO SLUMP - CENTRAL
          </div>
          <table className="w-full text-[8pt] border-collapse text-center">
            <thead>
              <tr className="border-b border-black bg-gray-50">
                <th className="py-1 px-1 border-r border-black w-1/5 font-bold">
                  SLUMP MEDIDO
                </th>
                <th className="py-1 px-1 border-r border-black w-1/5 font-bold">
                  SLUMP SAÍDA
                </th>
                <th className="py-1 px-1 border-r border-black w-1/5 font-bold">
                  ÁGUA ADIC. (LITROS)
                </th>
                <th className="py-1 px-1 border-r border-black w-1/5 font-bold">
                  MOLDAGEM
                </th>
                <th className="py-1 px-1 w-1/5 font-bold">VISTO MOTORISTA</th>
              </tr>
            </thead>
            <tbody>
              {/* Linha 1: Central */}
              <tr className="border-b border-black h-7">
                <td className="border-r border-black font-semibold">
                  {ordem.slump_central_medido || '—'}
                </td>
                <td className="border-r border-black font-semibold">
                  {ordem.slump_central_saida || '—'}
                </td>
                <td className="border-r border-black font-mono">
                  {ordem.agua_adic_central != null
                    ? `${ordem.agua_adic_central} L`
                    : '0 L'}
                </td>
                <td className="border-r border-black">
                  {ordem.moldagem_central || '—'}
                </td>
                <td>{ordem.visto_motorista_central || '—'}</td>
              </tr>
              {/* Linha 2: Peça Concretada */}
              <tr className="bg-gray-50 text-[7.5pt] font-bold border-b border-black">
                <td className="border-r border-black py-0.5">SLUMP MEDIDO</td>
                <td className="border-r border-black py-0.5">SLUMP SAÍDA</td>
                <td className="border-r border-black py-0.5">
                  ÁGUA ADIC. (LITROS)
                </td>
                <td className="border-r border-black py-0.5">
                  PEÇA CONCRETADA
                </td>
                <td className="py-0.5">VISTO MOTORISTA</td>
              </tr>
              <tr className="h-7">
                <td className="border-r border-black font-semibold">
                  {ordem.slump_peca_medido || '—'}
                </td>
                <td className="border-r border-black font-semibold">
                  {ordem.slump_peca_saida || '—'}
                </td>
                <td className="border-r border-black font-mono">
                  {ordem.agua_adic_peca != null
                    ? `${ordem.agua_adic_peca} L`
                    : '0 L'}
                </td>
                <td className="border-r border-black uppercase">
                  {ordem.peca_concretada || '—'}
                </td>
                <td>{ordem.visto_motorista_peca || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DADOS DE TRANSPORTE */}
        <div className="border border-black mb-2">
          <div className="bg-gray-100 text-center font-bold text-[8.5pt] uppercase py-0.5 border-b border-black">
            DADOS DE TRANSPORTE
          </div>
          <table className="w-full text-[8pt] border-collapse text-center">
            <thead>
              <tr className="border-b border-black bg-gray-50 font-bold">
                <th className="py-1 px-1 border-r border-black w-1/6">PLACA</th>
                <th className="py-1 px-1 border-r border-black w-2/6">
                  MOTORISTA
                </th>
                <th className="py-1 px-1 border-r border-black w-1/6">LACRE</th>
                <th className="py-1 px-1 border-r border-black w-1/12">
                  KM INICIAL
                </th>
                <th className="py-1 px-1 border-r border-black w-1/12">
                  KM FINAL
                </th>
                <th className="py-1 px-1 w-1/6">HORA CARGA</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black h-7">
                <td className="border-r border-black font-mono font-bold text-[9pt]">
                  {ordem.veiculo_placa || '—'}
                </td>
                <td className="border-r border-black uppercase font-semibold">
                  {ordem.motorista_nome || '—'}
                </td>
                <td className="border-r border-black font-mono">
                  {ordem.lacre || '—'}
                </td>
                <td className="border-r border-black font-mono">
                  {ordem.km_inicial ?? '—'}
                </td>
                <td className="border-r border-black font-mono">
                  {ordem.km_final ?? '—'}
                </td>
                <td className="font-mono">{ordem.hora_carga || '—'}</td>
              </tr>
              {/* Horários */}
              <tr className="bg-gray-50 text-[7.5pt] font-bold border-b border-black">
                <td className="border-r border-black py-0.5">SAÍDA CENTRAL</td>
                <td className="border-r border-black py-0.5">CHEGADA OBRA</td>
                <td className="border-r border-black py-0.5">
                  INÍCIO DESCARGA
                </td>
                <td className="border-r border-black py-0.5" colSpan={1}>
                  FIM DESCARGA
                </td>
                <td className="border-r border-black py-0.5" colSpan={1}>
                  SAÍDA OBRA
                </td>
                <td className="py-0.5">CHEGADA CENTRAL</td>
              </tr>
              <tr className="border-b border-black h-7 text-[8pt] font-mono">
                <td className="border-r border-black">
                  {ordem.hora_saida_central || '—'}
                </td>
                <td className="border-r border-black">
                  {ordem.hora_chegada_obra || '—'}
                </td>
                <td className="border-r border-black">
                  {ordem.hora_inicio_descarga || '—'}
                </td>
                <td className="border-r border-black">
                  {ordem.hora_fim_descarga || '—'}
                </td>
                <td className="border-r border-black">
                  {ordem.hora_saida_obra || '—'}
                </td>
                <td>{ordem.hora_chegada_central || '—'}</td>
              </tr>
              {/* Visto Obra */}
              <tr className="h-6 text-left">
                <td colSpan={6} className="px-2 py-1">
                  <span className="font-bold text-[8pt]">VISTO OBRA: </span>
                  <span className="uppercase text-[8pt]">
                    {ordem.visto_obra || ''}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* OBSERVAÇÕES */}
        <div className="border border-black p-2 mb-2 text-[8pt]">
          <span className="font-bold">Observações: </span>
          <span className="uppercase font-mono text-[7.5pt]">
            {ordem.observacoes ||
              `FOLGA DE ÁGUA: 15L/m3 VENDEDOR: ${ordem.vendedor_nome || '—'} CONTRATANTE: ${ordem.destinatario_nome} - CNPJ/CPF: ${ordem.destinatario_cpf_cnpj || '—'} - MOTORISTA: ${ordem.motorista_nome || '—'} - LACRE: ${ordem.lacre || '—'} - PLACA: ${ordem.veiculo_placa || '—'} - BOMBA ESTACIONÁRIA: ${ordem.bomba_estacionaria || '—'}`}
          </span>
        </div>

        {/* AVISO IMPORTANTE DE CURA ÚMIDA */}
        <div className="text-[7.5pt] mb-2 leading-snug">
          <span className="font-bold">IMPORTANTE: </span>
          Exposto ao sol e ao vento, o concreto perde a água antes de endurecer,
          o que ocasiona trincas e fissuras. Por isso, deve ser realizado o
          processo de cura úmida, pelo menos, três vezes ao dia e sete dias
          consecutivos.
        </div>

        {/* TERMO DE RESPONSABILIDADE */}
        <div className="border-t border-black pt-2 mb-3 text-[7.5pt] space-y-1">
          <div className="font-bold uppercase tracking-wider">
            TERMO DE RESPONSABILIDADE
          </div>
          <div className="font-medium">
            DETERMINO A ADIÇÃO DE{' '}
            <span className="font-mono font-bold underline px-2">
              {ordem.agua_adicional_termo != null
                ? `${ordem.agua_adicional_termo}`
                : '________'}
            </span>{' '}
            LITROS DE ÁGUA NESTA CARGA. TENHO CIÊNCIA DA ALTERAÇÃO NAS
            PROPRIEDADES DO CONCRETO.
          </div>
          <div className="flex justify-between items-end pt-3 text-[8pt]">
            <div>DATA : _____/_____/________</div>
            <div className="flex-1 max-w-[450px] border-b border-black text-center pb-0.5 text-[8pt]">
              ASSINATURA DO RESPONSÁVEL
            </div>
          </div>
        </div>

        {/* RECIBO DE RECEBIMENTO */}
        <div className="border-t-2 border-black pt-2 text-[8pt] space-y-1">
          <div className="flex justify-between items-center font-bold">
            <span className="font-black text-[9pt]">
              RECIBO Nº {ordem.numero_os}
            </span>
            <span className="uppercase text-[8pt]">
              RECEBEMOS DE {nomeEmpresa} OS ITENS LISTADOS
            </span>
          </div>
          <div className="flex justify-between items-end pt-4 text-[8pt]">
            <div>DATA : _____/_____/________</div>
            <div className="flex-1 max-w-[450px] border-b border-black text-center pb-0.5 text-[8pt]">
              ASSINATURA DO RESPONSÁVEL
            </div>
          </div>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <div className="mt-4 pt-1 border-t border-gray-300 flex justify-between text-[7pt] text-gray-500">
          <span>SISTEMA DE CONCRETO USINADO</span>
          <span>Impresso em {agoraDataHora}</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    )
  },
)

ReciboImpressao.displayName = 'ReciboImpressao'
