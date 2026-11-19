// INOVAÇÃO: "Kit para dias difíceis", montado no próprio celular, sem IA e sem
// enviar nada para fora do app.
//
// Como funciona:
//  1. olha os registros com humor "Bem" ou "Muito bem" e conta as atividades;
//  2. transforma as mais frequentes em uma "versão de 5 minutos", que cabe num dia
//     de pouca energia;
//  3. escolhe uma técnica do guia da OPAS/OMS conforme as emoções do último registro.

const FONTE_GUIA = 'OPAS/OMS, "Faça o que importa em tempos de estresse: guia ilustrado"';

// Versão curta de cada atividade sugerida no formulário. Atividades escritas pela
// própria pessoa caem na versão genérica, no fim da função versaoCurta.
const VERSOES_CURTAS = {
  sono: 'Deite 15 minutos mais cedo hoje, com o celular longe da cama.',
  trabalho: 'Termine uma tarefa pequena e risque da lista.',
  estudo: 'Escolha uma tarefa de 10 minutos e pare quando terminar.',
  amigos: 'Mande uma mensagem curta para um amigo de confiança.',
  lazer: 'Separe 10 minutos para algo de que você gosta, sem culpa.',
  'exercício': 'Alongue o corpo ou caminhe por 5 minutos, no seu ritmo.',
  'família': 'Ligue ou mande um áudio curto para alguém da família.',
  natureza: 'Fique 5 minutos perto de uma janela, de uma planta ou do céu aberto.',
  'música': 'Coloque duas ou três músicas de que você gosta e só escute.',
  caminhada: 'Uma volta de 5 minutos, nem que seja até a esquina.',
  leitura: 'Leia uma página, sem meta de terminar o capítulo.',
  'meditação': 'Faça um minuto de respiração lenta, soltando bem o ar.',
  jogo: 'Jogue uma partida rápida, de uns 10 minutos, só pela diversão.',
  videogame: 'Jogue uma partida rápida, de uns 10 minutos, só pela diversão.',
  'série': 'Assista a um episódio curto ou a uma cena de que você gosta.',
  filme: 'Assista ao trailer ou a uma cena favorita de um filme que te faz bem.',
  cozinhar: 'Prepare algo simples, como um chá ou um lanche de que você gosta.',
  desenho: 'Rabisque qualquer coisa por 5 minutos, sem se preocupar com o resultado.',
  arte: 'Rabisque qualquer coisa por 5 minutos, sem se preocupar com o resultado.',
  escrita: 'Escreva três linhas sobre como foi o seu dia.',
  'dança': 'Coloque uma música e mexa o corpo do jeito que der.',
  pet: 'Passe 5 minutos com o seu bichinho, só fazendo carinho.',
  banho: 'Tome um banho com calma, prestando atenção na água.',
};

// Deixa "Jogos", " JOGO " e "jogo" iguais na hora de procurar a versão curta.
function normalizar(texto) {
  const t = String(texto).trim().toLowerCase();
  if (VERSOES_CURTAS[t]) return t;
  const singular = t.replace(/s$/, '');
  return VERSOES_CURTAS[singular] ? singular : t;
}

export function versaoCurta(atividade) {
  const chave = normalizar(atividade);
  return VERSOES_CURTAS[chave]
    ?? `Separe 5 minutos para ${String(atividade).trim().toLowerCase()} hoje, sem meta, só porque te faz bem.`;
}

// Técnicas do guia, reescritas com palavras simples (não é cópia do texto original).
const TECNICAS = {
  ancorar: {
    titulo: 'Ancorar-se',
    quando: 'Ajuda quando a ansiedade ou o medo parecem uma tempestade.',
    passos: [
      'Perceba o que você está sentindo e pensando, sem brigar com isso.',
      'Volte para o corpo: pressione os pés no chão, alongue os braços e respire devagar, soltando bem o ar.',
      'Volte para o mundo à sua volta: repare no que você vê, ouve e toca agora.',
    ],
  },
  nomear: {
    titulo: 'Perceber, nomear e voltar',
    quando: 'Ajuda quando a raiva ou a irritação puxam toda a sua atenção.',
    passos: [
      'Perceba quando um pensamento ou sentimento "te puxou".',
      'Dê um nome a ele, em silêncio: "estou percebendo raiva".',
      'Volte a atenção para o que você está fazendo e para quem está com você.',
    ],
  },
  gentileza: {
    titulo: 'Ser gentil consigo',
    quando: 'Ajuda quando bate tristeza, solidão ou autocrítica.',
    passos: [
      'Perceba os pensamentos duros sobre você mesmo(a).',
      'Fale consigo como falaria com um amigo que está passando pelo mesmo.',
      'Se ajudar, coloque a mão sobre o peito e respire devagar por alguns instantes.',
    ],
  },
  espaco: {
    titulo: 'Abrir espaço para o que você sente',
    quando: 'Ajuda quando o sentimento é difícil e não vai embora.',
    passos: [
      'Observe com curiosidade onde o sentimento aparece no corpo.',
      'Respire devagar em volta dele, sem tentar expulsá-lo.',
      'Quando estiver pronto(a), volte a atenção para o que está fazendo.',
    ],
  },
};

const TECNICA_POR_EMOCAO = {
  ansiedade: 'ancorar',
  medo: 'ancorar',
  raiva: 'nomear',
  'irritação': 'nomear',
  tristeza: 'gentileza',
  'solidão': 'gentileza',
  'cansaço': 'espaco',
};

// Escolhe a técnica pela primeira emoção conhecida do último registro.
export function escolherTecnica(ultimoRegistro) {
  const emocoes = ultimoRegistro?.emocoes ?? [];
  const chave = emocoes.map((e) => TECNICA_POR_EMOCAO[e]).find(Boolean) ?? 'ancorar';
  return { ...TECNICAS[chave], fonte: FONTE_GUIA, emocao: emocoes.find((e) => TECNICA_POR_EMOCAO[e]) ?? null };
}

// Conta as atividades dos dias com humor 4 ou 5, da mais frequente para a menos.
export function atividadesDosDiasBons(registros) {
  const contagem = new Map();
  for (const registro of registros) {
    if (registro.humor < 4) continue;
    for (const atividade of registro.atividades ?? []) {
      contagem.set(atividade, (contagem.get(atividade) ?? 0) + 1);
    }
  }
  return [...contagem.entries()]
    .map(([nome, vezes]) => ({ nome, vezes }))
    .sort((a, b) => b.vezes - a.vezes);
}

// Monta o kit completo a partir dos registros (que já vêm da API em ordem de data, do mais novo).
export function montarKit(registros) {
  const diasBons = registros.filter((r) => r.humor >= 4).length;
  const sugestoes = atividadesDosDiasBons(registros)
    .slice(0, 3)
    .map(({ nome, vezes }) => ({ nome, vezes, versaoCurta: versaoCurta(nome) }));

  return {
    diasBons,
    sugestoes,
    tecnica: escolherTecnica(registros[0]),
  };
}
