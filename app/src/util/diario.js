// Dados fixos e funções de apoio do diário (sem tela, sem estado).

// Rótulos não clínicos (guia TrackWell, item 82). Cada humor tem rosto + texto,
// para a informação não depender só da cor (acessibilidade).
export const HUMORES = [
  { valor: 1, rotulo: 'Muito mal', icone: 'emoticon-dead', tom: 'humor1', fundo: 'humorFundo1' },
  { valor: 2, rotulo: 'Mal', icone: 'emoticon-sad', tom: 'humor2', fundo: 'humorFundo2' },
  { valor: 3, rotulo: 'Neutro', icone: 'emoticon-neutral', tom: 'humor3', fundo: 'humorFundo3' },
  { valor: 4, rotulo: 'Bem', icone: 'emoticon-happy', tom: 'humor4', fundo: 'humorFundo4' },
  { valor: 5, rotulo: 'Muito bem', icone: 'emoticon-excited', tom: 'humor5', fundo: 'humorFundo5' },
];

export const humorPorValor = (valor) => HUMORES.find((h) => h.valor === valor) ?? HUMORES[2];

export const EMOCOES_SUGERIDAS = [
  'alegria', 'calma', 'gratidão', 'esperança', 'cansaço', 'ansiedade',
  'tristeza', 'raiva', 'medo', 'solidão', 'irritação', 'orgulho',
];

// O que tem a ver com o humor (gravado no campo "atividades" do registro).
export const CONTEXTOS = [
  { nome: 'sono', icone: 'weather-night' },
  { nome: 'trabalho', icone: 'briefcase-outline' },
  { nome: 'estudo', icone: 'book-open-variant' },
  { nome: 'amigos', icone: 'account-group-outline' },
  { nome: 'lazer', icone: 'gamepad-variant-outline' },
  { nome: 'exercício', icone: 'run' },
  { nome: 'família', icone: 'home-heart' },
  { nome: 'natureza', icone: 'tree-outline' },
  { nome: 'música', icone: 'music-note-outline' },
];

export const iconeDoContexto = (nome) => CONTEXTOS.find((c) => c.nome === nome)?.icone ?? 'tag-outline';

// "sono" -> "Sono" (os valores ficam em minúsculas no banco).
export const rotulo = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '');

// Hora local no formato HH:MM.
export function horaAtual(data = new Date()) {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

// Data local no formato AAAA-MM-DD (toISOString usaria UTC e poderia mudar o dia à noite).
export function dataISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function diasAtras(quantidade) {
  const data = new Date();
  data.setDate(data.getDate() - quantidade);
  return dataISO(data);
}

// 'AAAA-MM-DD' -> 'DD/MM/AAAA'
export function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// "Hoje, 16/11", "Ontem, 15/11" ou "sex., 14/11".
export function rotuloDia(iso) {
  const [, mes, dia] = iso.split('-');
  if (iso === dataISO()) return `Hoje, ${dia}/${mes}`;
  if (iso === diasAtras(1)) return `Ontem, ${dia}/${mes}`;
  return `${diaDaSemana(iso).slice(0, 3)}., ${dia}/${mes}`;
}

export function diaDaSemana(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()];
}

// Sensibilidade ao contexto: o período do dia muda a saudação e o convite da tela inicial.
export function periodoDoDia(hora = new Date().getHours()) {
  if (hora >= 5 && hora < 12) {
    return { chave: 'manha', saudacao: 'Bom dia', convite: 'Como você está começando o dia?' };
  }
  if (hora >= 12 && hora < 18) {
    return { chave: 'tarde', saudacao: 'Boa tarde', convite: 'Que tal uma pausa para ver como você está?' };
  }
  if (hora >= 18 && hora < 23) {
    return { chave: 'noite', saudacao: 'Boa noite', convite: 'Como foi o seu dia? Registrar agora ajuda a lembrar depois.' };
  }
  return { chave: 'madrugada', saudacao: 'Olá', convite: 'Está acordado(a) até tarde. Se precisar conversar, o CVV atende 24 h pelo 188.' };
}

// 'HH:MM' já passou hoje?
export function horaJaPassou(horaMinuto, agora = new Date()) {
  if (!horaMinuto) return false;
  const [h, m] = horaMinuto.split(':').map(Number);
  return agora.getHours() * 60 + agora.getMinutes() >= h * 60 + m;
}

// ---------------------------------------------------------------------------
// Campos de data e hora digitados: só números, a barra e os dois-pontos entram
// sozinhos. A data aparece como DD/MM/AAAA (jeito brasileiro) e vai para a API
// como AAAA-MM-DD.

export function mascaraData(texto) {
  const n = String(texto).replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

export function mascaraHora(texto) {
  const n = String(texto).replace(/\D/g, '').slice(0, 4);
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}:${n.slice(2)}`;
}

// "05/11/2026" -> "2026-11-05", ou null se a data não existir (ex.: 31/02).
export function dataBrParaISO(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [, dia, mes, ano] = m.map(Number);
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export const isoParaBr = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : iso);

export const ehHoraValida = (hora) => /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);

// Registro no futuro? (um diário é sobre o que já aconteceu)
export function ehFuturo(iso, hora, agora = new Date()) {
  const hoje = dataISO(agora);
  if (iso > hoje) return true;
  return iso === hoje && hora > horaAtual(agora);
}

// Registros retroativos: até 60 dias atrás (para o "esqueci de registrar ontem").
export const DIAS_RETROATIVOS = 60;
export const ehAntigoDemais = (iso, agora = new Date()) => {
  const limite = new Date(agora);
  limite.setDate(limite.getDate() - DIAS_RETROATIVOS);
  return iso < dataISO(limite);
};
