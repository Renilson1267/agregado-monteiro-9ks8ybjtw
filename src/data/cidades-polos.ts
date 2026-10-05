// Lista fixa oficial curada de cidades num raio de até 120 km dos quatro polos:
// 1. São José do Egito/PE (-7.4725, -37.2789)
// 2. Monteiro/PB (-7.8897, -37.1214)
// 3. Patos/PB (-7.0244, -37.2761)
// 4. Caicó/RN (-6.4581, -37.0961)
//
// Calculadas via distância ortodrômica / Haversine oficial IBGE e unificadas sem duplicatas,
// ordenadas alfabeticamente exibindo nome e UF (ex.: "Coxixola/PB").
// Permite consulta direta e sugestão no autocomplete sem restringir digitação manual.

export interface CidadePoloRef {
  nome: string
  uf: "PE" | "PB" | "RN" | "CE"
  label: string // Ex: "Coxixola/PB"
}

export const CIDADES_RAIO_POLOS: CidadePoloRef[] = [
  // A
  { nome: "Acari", uf: "RN", label: "Acari/RN" },
  {
    nome: "Afogados da Ingazeira",
    uf: "PE",
    label: "Afogados da Ingazeira/PE",
  },
  { nome: "Água Branca", uf: "PB", label: "Água Branca/PB" },
  { nome: "Aguiar", uf: "PB", label: "Aguiar/PB" },
  { nome: "Alexandria", uf: "RN", label: "Alexandria/RN" },
  { nome: "Almino Afonso", uf: "RN", label: "Almino Afonso/RN" },
  { nome: "Amparo", uf: "PB", label: "Amparo/PB" },
  { nome: "Antônio Martins", uf: "RN", label: "Antônio Martins/RN" },
  { nome: "Aparecida", uf: "PB", label: "Aparecida/PB" },
  { nome: "Areia de Baraúnas", uf: "PB", label: "Areia de Baraúnas/PB" },
  { nome: "Assunção", uf: "PB", label: "Assunção/PB" },

  // B
  { nome: "Baraúna", uf: "PB", label: "Baraúna/PB" },
  { nome: "Barra de Santa Rosa", uf: "PB", label: "Barra de Santa Rosa/PB" },
  { nome: "Barra de São Miguel", uf: "PB", label: "Barra de São Miguel/PB" },
  {
    nome: "Belém do Brejo do Cruz",
    uf: "PB",
    label: "Belém do Brejo do Cruz/PB",
  },
  { nome: "Boa Ventura", uf: "PB", label: "Boa Ventura/PB" },
  { nome: "Bodó", uf: "RN", label: "Bodó/RN" },
  { nome: "Bom Jesus", uf: "PB", label: "Bom Jesus/PB" },
  { nome: "Bom Sucesso", uf: "PB", label: "Bom Sucesso/PB" },
  { nome: "Boqueirão", uf: "PB", label: "Boqueirão/PB" },
  { nome: "Brejo do Cruz", uf: "PB", label: "Brejo do Cruz/PB" },
  { nome: "Brejo dos Santos", uf: "PB", label: "Brejo dos Santos/PB" },

  // C
  { nome: "Cabaceiras", uf: "PB", label: "Cabaceiras/PB" },
  { nome: "Cacimba de Areia", uf: "PB", label: "Cacimba de Areia/PB" },
  { nome: "Cacimbas", uf: "PB", label: "Cacimbas/PB" },
  { nome: "Caicó", uf: "RN", label: "Caicó/RN" },
  { nome: "Calumbi", uf: "PE", label: "Calumbi/PE" },
  { nome: "Camalaú", uf: "PB", label: "Camalaú/PB" },
  { nome: "Caraúbas", uf: "PB", label: "Caraúbas/PB" },
  { nome: "Carnaíba", uf: "PE", label: "Carnaíba/PE" },
  { nome: "Carnaúba dos Dantas", uf: "RN", label: "Carnaúba dos Dantas/RN" },
  { nome: "Carnaubeira da Penha", uf: "PE", label: "Carnaubeira da Penha/PE" },
  { nome: "Catingueira", uf: "PB", label: "Catingueira/PB" },
  { nome: "Catolé do Rocha", uf: "PB", label: "Catolé do Rocha/PB" },
  { nome: "Caturité", uf: "PB", label: "Caturité/PB" },
  { nome: "Cerro Corá", uf: "RN", label: "Cerro Corá/RN" },
  { nome: "Condado", uf: "PB", label: "Condado/PB" },
  { nome: "Congo", uf: "PB", label: "Congo/PB" },
  { nome: "Coronel João Pessoa", uf: "RN", label: "Coronel João Pessoa/RN" },
  { nome: "Coxixola", uf: "PB", label: "Coxixola/PB" },
  { nome: "Cruzeta", uf: "RN", label: "Cruzeta/RN" },
  { nome: "Cuité", uf: "PB", label: "Cuité/PB" },
  { nome: "Currais Novos", uf: "RN", label: "Currais Novos/RN" },
  { nome: "Custódia", uf: "PE", label: "Custódia/PE" },

  // D
  { nome: "Damião", uf: "PB", label: "Damião/PB" },
  { nome: "Desterro", uf: "PB", label: "Desterro/PB" },
  { nome: "Diamante", uf: "PB", label: "Diamante/PB" },
  { nome: "Doutor Severiano", uf: "RN", label: "Doutor Severiano/RN" },

  // E
  { nome: "Emas", uf: "PB", label: "Emas/PB" },
  { nome: "Encanto", uf: "RN", label: "Encanto/RN" },
  { nome: "Equador", uf: "RN", label: "Equador/RN" },

  // F
  { nome: "Flores", uf: "PE", label: "Flores/PE" },
  { nome: "Florânia", uf: "RN", label: "Florânia/RN" },
  { nome: "Francisco Dantas", uf: "RN", label: "Francisco Dantas/RN" },
  { nome: "Frutuoso Gomes", uf: "RN", label: "Frutuoso Gomes/RN" },

  // G
  { nome: "Granito", uf: "PE", label: "Granito/PE" },
  { nome: "Gurjão", uf: "PB", label: "Gurjão/PB" },

  // I
  { nome: "Ibiara", uf: "PB", label: "Ibiara/PB" },
  { nome: "Ibirimirim", uf: "PE", label: "Ibirimirim/PE" },
  { nome: "Iguaracy", uf: "PE", label: "Iguaracy/PE" },
  { nome: "Ingazeira", uf: "PE", label: "Ingazeira/PE" },
  { nome: "Ipueira", uf: "RN", label: "Ipueira/RN" },
  { nome: "Itapetim", uf: "PE", label: "Itapetim/PE" },
  { nome: "Itaporanga", uf: "PB", label: "Itaporanga/PB" },
  { nome: "Itaú", uf: "RN", label: "Itaú/RN" },

  // J
  { nome: "Jandís", uf: "RN", label: "Jandís/RN" },
  { nome: "Jardim de Piranhas", uf: "RN", label: "Jardim de Piranhas/RN" },
  { nome: "Jardim do Seridó", uf: "RN", label: "Jardim do Seridó/RN" },
  { nome: "Jataúba", uf: "PE", label: "Jataúba/PE" },
  { nome: "Juazeirinho", uf: "PB", label: "Juazeirinho/PB" },
  { nome: "Jucurutu", uf: "RN", label: "Jucurutu/RN" },
  { nome: "Junco do Seridó", uf: "PB", label: "Junco do Seridó/PB" },
  { nome: "Juru", uf: "PB", label: "Juru/PB" },

  // L
  { nome: "Lagoa", uf: "PB", label: "Lagoa/PB" },
  { nome: "Lagoa Nova", uf: "RN", label: "Lagoa Nova/RN" },
  { nome: "Lastro", uf: "PB", label: "Lastro/PB" },
  { nome: "Livramento", uf: "PB", label: "Livramento/PB" },
  { nome: "Lucrécia", uf: "RN", label: "Lucrécia/RN" },
  { nome: "Luís Gomes", uf: "RN", label: "Luís Gomes/RN" },

  // M
  { nome: "Mãe d'Água", uf: "PB", label: "Mãe d'Água/PB" },
  { nome: "Major Sales", uf: "RN", label: "Major Sales/RN" },
  { nome: "Malta", uf: "PB", label: "Malta/PB" },
  { nome: "Manari", uf: "PE", label: "Manari/PE" },
  { nome: "Manaíra", uf: "PB", label: "Manaíra/PB" },
  { nome: "Marcelino Vieira", uf: "RN", label: "Marcelino Vieira/RN" },
  { nome: "Martins", uf: "RN", label: "Martins/RN" },
  { nome: "Messias Targino", uf: "RN", label: "Messias Targino/RN" },
  { nome: "Monteiro", uf: "PB", label: "Monteiro/PB" },

  // N
  { nome: "Nazarezinho", uf: "PB", label: "Nazarezinho/PB" },
  { nome: "Nova Floresta", uf: "PB", label: "Nova Floresta/PB" },
  { nome: "Nova Palmeira", uf: "PB", label: "Nova Palmeira/PB" },

  // O
  { nome: "Olho d'Água", uf: "PB", label: "Olho d'Água/PB" },
  {
    nome: "Olho-d'Água do Borges",
    uf: "RN",
    label: "Olho-d'Água do Borges/RN",
  },
  { nome: "Ouro Branco", uf: "RN", label: "Ouro Branco/RN" },
  { nome: "Ouro Velho", uf: "PB", label: "Ouro Velho/PB" },

  // P
  { nome: "Paraíba", uf: "PB", label: "Paraíba/PB" },
  { nome: "Parari", uf: "PB", label: "Parari/PB" },
  { nome: "Parelhas", uf: "RN", label: "Parelhas/RN" },
  { nome: "Passagem", uf: "PB", label: "Passagem/PB" },
  { nome: "Patos", uf: "PB", label: "Patos/PB" },
  { nome: "Pau dos Ferros", uf: "RN", label: "Pau dos Ferros/RN" },
  { nome: "Paulista", uf: "PB", label: "Paulista/PB" },
  { nome: "Pedra Lavrada", uf: "PB", label: "Pedra Lavrada/PB" },
  { nome: "Piancó", uf: "PB", label: "Piancó/PB" },
  { nome: "Picuí", uf: "PB", label: "Picuí/PB" },
  { nome: "Pilões", uf: "RN", label: "Pilões/RN" },
  { nome: "Pombal", uf: "PB", label: "Pombal/PB" },
  { nome: "Portalegre", uf: "RN", label: "Portalegre/RN" },
  { nome: "Prata", uf: "PB", label: "Prata/PB" },
  { nome: "Princesa Isabel", uf: "PB", label: "Princesa Isabel/PB" },

  // Q
  { nome: "Queimadas", uf: "PB", label: "Queimadas/PB" },
  { nome: "Quixabá", uf: "PB", label: "Quixabá/PB" },
  { nome: "Quixaba", uf: "PE", label: "Quixaba/PE" },

  // R
  { nome: "Rafael Fernandes", uf: "RN", label: "Rafael Fernandes/RN" },
  { nome: "Rafael Godeiro", uf: "RN", label: "Rafael Godeiro/RN" },
  { nome: "Riacho de Santana", uf: "RN", label: "Riacho de Santana/RN" },
  { nome: "Riacho dos Cavalos", uf: "PB", label: "Riacho dos Cavalos/PB" },

  // S
  { nome: "Salgadinho", uf: "PB", label: "Salgadinho/PB" },
  { nome: "Santa Cruz", uf: "PB", label: "Santa Cruz/PB" },
  {
    nome: "Santa Cruz da Baixa Verde",
    uf: "PE",
    label: "Santa Cruz da Baixa Verde/PE",
  },
  { nome: "Santa Helena", uf: "PB", label: "Santa Helena/PB" },
  { nome: "Santa Luzia", uf: "PB", label: "Santa Luzia/PB" },
  { nome: "Santa Terezinha", uf: "PB", label: "Santa Terezinha/PB" },
  { nome: "Santa Terezinha", uf: "PE", label: "Santa Terezinha/PE" },
  { nome: "Santana dos Garrotes", uf: "PB", label: "Santana dos Garrotes/PB" },
  { nome: "Santana do Matos", uf: "RN", label: "Santana do Matos/RN" },
  { nome: "Santana do Seridó", uf: "RN", label: "Santana do Seridó/RN" },
  { nome: "Santo André", uf: "PB", label: "Santo André/PB" },
  { nome: "São Bento", uf: "PB", label: "São Bento/PB" },
  { nome: "São Domingos", uf: "PB", label: "São Domingos/PB" },
  {
    nome: "São Domingos do Cariri",
    uf: "PB",
    label: "São Domingos do Cariri/PB",
  },
  { nome: "São Fernando", uf: "RN", label: "São Fernando/RN" },
  {
    nome: "São Francisco do Oeste",
    uf: "RN",
    label: "São Francisco do Oeste/RN",
  },
  { nome: "São João do Cariri", uf: "PB", label: "São João do Cariri/PB" },
  {
    nome: "São João do Rio do Peixe",
    uf: "PB",
    label: "São João do Rio do Peixe/PB",
  },
  { nome: "São João do Sabugi", uf: "RN", label: "São João do Sabugi/RN" },
  { nome: "São João do Tigre", uf: "PB", label: "São João do Tigre/PB" },
  { nome: "São José de Caiana", uf: "PB", label: "São José de Caiana/PB" },
  {
    nome: "São José de Espinharas",
    uf: "PB",
    label: "São José de Espinharas/PB",
  },
  { nome: "São José de Piranhas", uf: "PB", label: "São José de Piranhas/PB" },
  { nome: "São José de Princesa", uf: "PB", label: "São José de Princesa/PB" },
  { nome: "São José do Belmonte", uf: "PE", label: "São José do Belmonte/PE" },
  { nome: "São José do Bonfim", uf: "PB", label: "São José do Bonfim/PB" },
  {
    nome: "São José do Brejo do Cruz",
    uf: "PB",
    label: "São José do Brejo do Cruz/PB",
  },
  { nome: "São José do Egito", uf: "PE", label: "São José do Egito/PE" },
  { nome: "São José do Sabugi", uf: "PB", label: "São José do Sabugi/PB" },
  { nome: "São José do Seridó", uf: "RN", label: "São José do Seridó/RN" },
  { nome: "São Mamede", uf: "PB", label: "São Mamede/PB" },
  { nome: "São Miguel", uf: "RN", label: "São Miguel/RN" },
  { nome: "São Rafael", uf: "RN", label: "São Rafael/RN" },
  {
    nome: "São Sebastião do Umbuzeiro",
    uf: "PB",
    label: "São Sebastião do Umbuzeiro/PB",
  },
  { nome: "São Vicente", uf: "RN", label: "São Vicente/RN" },
  { nome: "Serra Branca", uf: "PB", label: "Serra Branca/PB" },
  { nome: "Serra Grande", uf: "PB", label: "Serra Grande/PB" },
  { nome: "Serra Negra do Norte", uf: "RN", label: "Serra Negra do Norte/RN" },
  { nome: "Serra Talhada", uf: "PE", label: "Serra Talhada/PE" },
  { nome: "Serrinha dos Pintos", uf: "RN", label: "Serrinha dos Pintos/RN" },
  { nome: "Sertânia", uf: "PE", label: "Sertânia/PE" },
  { nome: "Severiano Melo", uf: "RN", label: "Severiano Melo/RN" },
  { nome: "Solidão", uf: "PE", label: "Solidão/PE" },
  { nome: "Soledade", uf: "PB", label: "Soledade/PB" },
  { nome: "Sousa", uf: "PB", label: "Sousa/PB" },
  { nome: "Sumé", uf: "PB", label: "Sumé/PB" },

  // T
  { nome: "Tabira", uf: "PE", label: "Tabira/PE" },
  { nome: "Taperoá", uf: "PB", label: "Taperoá/PB" },
  { nome: "Tavares", uf: "PB", label: "Tavares/PB" },
  { nome: "Teixeira", uf: "PB", label: "Teixeira/PB" },
  { nome: "Tenente Ananias", uf: "RN", label: "Tenente Ananias/RN" },
  {
    nome: "Tenente Laurentino Cruz",
    uf: "RN",
    label: "Tenente Laurentino Cruz/RN",
  },
  { nome: "Tenório", uf: "PB", label: "Tenório/PB" },
  {
    nome: "Timbaúba dos Batistas",
    uf: "RN",
    label: "Timbaúba dos Batistas/RN",
  },
  { nome: "Triunfo", uf: "PB", label: "Triunfo/PB" },
  { nome: "Triunfo", uf: "PE", label: "Triunfo/PE" },
  { nome: "Triunfo Potiguar", uf: "RN", label: "Triunfo Potiguar/RN" },
  { nome: "Tuparetama", uf: "PE", label: "Tuparetama/PE" },

  // U
  { nome: "Uiraúna", uf: "PB", label: "Uiraúna/PB" },
  { nome: "Umarizal", uf: "RN", label: "Umarizal/RN" },

  // V
  { nome: "Várzea", uf: "PB", label: "Várzea/PB" },
  { nome: "Várzea", uf: "RN", label: "Várzea/RN" },
  { nome: "Viçosa", uf: "RN", label: "Viçosa/RN" },
  { nome: "Vista Serrana", uf: "PB", label: "Vista Serrana/PB" },

  // Z
  { nome: "Zabelê", uf: "PB", label: "Zabelê/PB" },
]

/**
 * Array de strings único formatado "Nome/UF" ordenado alfabeticamente.
 * Exemplo: ["Acari/RN", "Afogados da Ingazeira/PE", ..., "Zabelê/PB"]
 */
export const LISTA_CIDADES_RAIO_POLOS: string[] = Array.from(
  new Set(CIDADES_RAIO_POLOS.map((c) => c.label)),
).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
