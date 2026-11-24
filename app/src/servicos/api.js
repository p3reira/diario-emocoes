// Comunicação com a API do app. As telas nunca chamam fetch direto:
// passam sempre por aqui, que cuida do endereço, do token e dos erros.
import { API_URL } from '../config';

// O token fica só na memória: some quando o app é fechado.
// Escolha de segurança: como o app guarda dados sensíveis, a sessão
// não fica gravada no aparelho (quem pegar o celular não entra sem a senha).
let token = null;
let aoExpirarSessao = null;

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

// O contexto de sessão registra aqui o que fazer quando o token vencer.
export function definirAoExpirarSessao(funcao) {
  aoExpirarSessao = funcao;
}

export function sair() {
  token = null;
}

async function requisitar(caminho, { metodo = 'GET', corpo, autenticado = true } = {}) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (autenticado && token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/api${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi('Não consegui falar com o servidor. Confira sua conexão e tente de novo.', 0);
  }

  let json = null;
  try {
    json = await resposta.json();
  } catch {
    json = null;
  }

  // 401 numa rota fechada = sessão expirada. No login, 401 é só senha errada.
  if (autenticado && resposta.status === 401) {
    token = null;
    aoExpirarSessao?.();
    throw new ErroApi('Sua sessão expirou. Entre de novo, por favor.', 401);
  }

  if (!resposta.ok || json?.sucesso === false) {
    throw new ErroApi(json?.mensagem || `Algo deu errado (erro ${resposta.status}).`, resposta.status);
  }

  return json?.dados ?? null;
}

// ---------- Conta ----------

export async function entrar(login, senha) {
  const dados = await requisitar('/usuarios/login', {
    metodo: 'POST',
    corpo: { login, senha },
    autenticado: false,
  });
  token = dados.token;
  return dados.usuario;
}

export function cadastrar({ nome, sobrenome, email, usuario, senha }) {
  return requisitar('/usuarios', {
    metodo: 'POST',
    corpo: { nome, sobrenome, email, usuario, senha },
    autenticado: false,
  });
}

export const buscarPerfil = () => requisitar('/usuarios/eu');
// Se mudar e-mail ou senha, "campos" leva também a senhaAtual (a API confere).
export const alterarPerfil = (campos) => requisitar('/usuarios/eu', { metodo: 'PUT', corpo: campos });
// Ações sem volta: a API só executa com a senha correta (reautenticação).
export const excluirConta = (senha) => requisitar('/usuarios/eu', { metodo: 'DELETE', corpo: { senha } });
export const darConsentimento = () => requisitar('/usuarios/eu/consentimento', { metodo: 'POST' });
export const salvarPreferencias = (prefs) => requisitar('/usuarios/eu/preferencias', { metodo: 'PUT', corpo: prefs });
export const exportarDados = () => requisitar('/usuarios/eu/exportar');

// ---------- Registros do diário ----------

// Data do registro mais antigo (ou null), para o Histórico saber se há mais para carregar.
export const buscarDataMaisAntiga = () => requisitar('/registros/mais-antigo').then((d) => d.data);

export function listarRegistros({ de, ate } = {}) {
  const filtros = new URLSearchParams();
  if (de) filtros.set('de', de);
  if (ate) filtros.set('ate', ate);
  const consulta = filtros.toString();
  return requisitar(`/registros${consulta ? `?${consulta}` : ''}`);
}

export const buscarRegistro = (id) => requisitar(`/registros/${id}`);
export const criarRegistro = (dados) => requisitar('/registros', { metodo: 'POST', corpo: dados });
export const alterarRegistro = (id, dados) => requisitar(`/registros/${id}`, { metodo: 'PUT', corpo: dados });
export const excluirRegistro = (id) => requisitar(`/registros/${id}`, { metodo: 'DELETE' });
export const excluirTodosRegistros = (senha) => requisitar('/registros', { metodo: 'DELETE', corpo: { senha } });
