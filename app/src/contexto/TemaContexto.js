// Tema (personalização) e tamanho da fonte (acessibilidade).
// As escolhas ficam salvas no perfil, na API, e valem em qualquer aparelho.
// Antes do login, o app segue o tema do sistema (claro/escuro).
import { createContext, useContext, useMemo } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { useSessao } from './SessaoContexto';

// Paleta lilás + verde-menta, com contraste AA nos textos (guia TrackWell, item 28:
// segurança emocional). Cada cor tem versão clara e escura.
const PALETAS = {
  claro: {
    fundo: '#fdf7ff',
    cartao: '#f5eff8',
    cartaoForte: '#ece2f7',
    campo: '#f7f2fa',
    texto: '#1d1b20',
    textoSuave: '#49454f',
    borda: '#ddd5e4',
    chip: '#ece6f0',
    primaria: '#65558f',
    primariaSuave: '#eaddff',
    sobrePrimaria: '#ffffff',
    sobrePrimariaSuave: '#4f378a',
    menta: '#c3eedf',
    sobreMenta: '#1f4d3e',
    verde: '#4e7c6b',
    perigo: '#b3261e',
    erroTexto: '#8c1d18',
    erroFundo: '#f9dedc',
    sucessoTexto: '#1f5c47',
    sucessoFundo: '#c8eedf',
    alertaFundo: '#fcefd3',
    alertaTexto: '#6b4e00',
    aviso: '#322f37',
    sobreAviso: '#f4eff4',
    acaoAviso: '#a8e6cf',
    humor1: '#b3423a',
    humor2: '#7a5300',
    humor3: '#5d5869',
    humor4: '#3f7363',
    humor5: '#6750a4',
    humorFundo1: '#fadad5',
    humorFundo2: '#f8e8c6',
    humorFundo3: '#e7e0ec',
    humorFundo4: '#bdebda',
    humorFundo5: '#eaddff',
  },
  escuro: {
    fundo: '#141218',
    cartao: '#1f1b24',
    cartaoForte: '#2b2535',
    campo: '#211d26',
    texto: '#e6e0e9',
    textoSuave: '#cac4d0',
    borda: '#3d3744',
    chip: '#2b2832',
    primaria: '#d0bcff',
    primariaSuave: '#4a4060',
    sobrePrimaria: '#381e72',
    sobrePrimariaSuave: '#eaddff',
    menta: '#244a3d',
    sobreMenta: '#bdebda',
    verde: '#8fd3ba',
    perigo: '#f2b8b5',
    erroTexto: '#f9dedc',
    erroFundo: '#601410',
    sucessoTexto: '#bdebda',
    sucessoFundo: '#1f3b31',
    alertaFundo: '#3e3018',
    alertaTexto: '#f6dfa4',
    aviso: '#e6e0e9',
    sobreAviso: '#322f35',
    acaoAviso: '#1f6b52',
    humor1: '#ffb4ab',
    humor2: '#f0c46f',
    humor3: '#cac4d0',
    humor4: '#9adbc2',
    humor5: '#d0bcff',
    humorFundo1: '#5a2620',
    humorFundo2: '#4a3a14',
    humorFundo3: '#36323d',
    humorFundo4: '#224538',
    humorFundo5: '#3f3557',
  },
};

// Fonte Plus Jakarta Sans: cada peso é um arquivo, então o peso é escolhido pelo
// nome da família (no Android, fontWeight não funciona com fontes carregadas).
export const FONTES = {
  regular: 'PlusJakartaSans_400Regular',
  media: 'PlusJakartaSans_500Medium',
  seminegrito: 'PlusJakartaSans_600SemiBold',
  negrito: 'PlusJakartaSans_700Bold',
};

const TemaContexto = createContext(null);

export function TemaProvider({ children }) {
  const { usuario } = useSessao();
  const esquemaSistema = useColorScheme();
  const { width, height } = useWindowDimensions();

  const valor = useMemo(() => {
    const preferido = usuario?.tema ?? 'sistema';
    const modo = preferido === 'sistema' ? (esquemaSistema === 'dark' ? 'escuro' : 'claro') : preferido;
    const escala = usuario?.escala_fonte ?? 1;

    return {
      modo,
      cores: PALETAS[modo],
      escala,
      // fonte(16) devolve 16 multiplicado pela escala escolhida pela pessoa.
      fonte: (tamanho) => Math.round(tamanho * escala),
      // Responsividade: a largura e a orientação decidem o layout.
      largura: width,
      paisagem: width > height,
      larga: width >= 700,
    };
  }, [usuario?.tema, usuario?.escala_fonte, esquemaSistema, width, height]);

  return <TemaContexto.Provider value={valor}>{children}</TemaContexto.Provider>;
}

export function useTema() {
  const contexto = useContext(TemaContexto);
  if (!contexto) throw new Error('useTema precisa estar dentro de <TemaProvider>');
  return contexto;
}
