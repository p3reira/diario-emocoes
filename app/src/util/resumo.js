// Resumo do dia e "gentil descoberta" da aba Registros (funções puras, sem tela).
import { humorPorValor, rotulo } from './diario';

function maisFrequente(itens) {
  const contagem = new Map();
  for (const item of itens) contagem.set(item, (contagem.get(item) ?? 0) + 1);
  let melhor = null;
  for (const [item, vezes] of contagem) {
    if (!melhor || vezes > melhor.vezes) melhor = { item, vezes };
  }
  return melhor?.item ?? null;
}

// registrosDoDia: só os registros de um dia.
export function resumoDoDia(registrosDoDia) {
  const humor = maisFrequente(registrosDoDia.map((r) => r.humor));
  const contexto = maisFrequente(registrosDoDia.flatMap((r) => r.atividades));
  return {
    total: registrosDoDia.length,
    humorMaisFrequente: humor ? humorPorValor(humor) : null,
    contextoMaisMarcado: contexto ? rotulo(contexto) : null,
  };
}

const media = (lista) => lista.reduce((s, r) => s + r.humor, 0) / lista.length;

// Procura o contexto em que o humor costuma ficar melhor que nos outros momentos.
// Só fala algo quando há dados suficientes: o contexto em 2+ registros, 2+ registros
// sem ele, e diferença de pelo menos meio ponto na média.
export function descobertaGentil(registros) {
  const contextos = [...new Set(registros.flatMap((r) => r.atividades))];
  let melhor = null;

  for (const contexto of contextos) {
    const com = registros.filter((r) => r.atividades.includes(contexto));
    const sem = registros.filter((r) => !r.atividades.includes(contexto));
    if (com.length < 2 || sem.length < 2) continue;
    const diferenca = media(com) - media(sem);
    if (diferenca >= 0.5 && (!melhor || diferenca > melhor.diferenca)) {
      melhor = { contexto, diferenca, mediaCom: media(com), mediaSem: media(sem), vezes: com.length };
    }
  }

  if (!melhor) return null;
  return {
    ...melhor,
    texto: `Nos momentos em que você marcou ${rotulo(melhor.contexto)}, seu humor costuma ficar melhor: em média "${humorPorValor(Math.round(melhor.mediaCom)).rotulo}", contra "${humorPorValor(Math.round(melhor.mediaSem)).rotulo}" nos outros.`,
  };
}
