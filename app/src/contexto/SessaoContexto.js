// Estado global da sessão: quem está logado e o perfil dele (com consentimento
// e preferências). As telas leem daqui com useSessao(), sem repassar props.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../servicos/api';

const SessaoContexto = createContext(null);

export function SessaoProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [aviso, setAviso] = useState(null); // mensagem mostrada no login (ex.: sessão expirada)

  const sair = useCallback((novoAviso = null) => {
    api.sair();
    setUsuario(null);
    setAviso(novoAviso);
  }, []);

  useEffect(() => {
    api.definirAoExpirarSessao(() =>
      sair({ texto: 'Sua sessão expirou. Entre de novo, por favor.', tipo: 'erro' })
    );
    return () => api.definirAoExpirarSessao(null);
  }, [sair]);

  const entrar = useCallback(async (login, senha) => {
    const perfil = await api.entrar(login, senha);
    setAviso(null);
    setUsuario(perfil);
    return perfil;
  }, []);

  // Toda tela que muda o perfil (preferências, consentimento, kit) chama isto
  // com o perfil que a API devolveu, e o app inteiro se atualiza.
  const atualizarUsuario = useCallback((perfil) => {
    if (perfil) setUsuario(perfil);
  }, []);

  const valor = useMemo(
    () => ({ usuario, aviso, setAviso, entrar, sair, atualizarUsuario }),
    [usuario, aviso, entrar, sair, atualizarUsuario]
  );

  return <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>;
}

export function useSessao() {
  const contexto = useContext(SessaoContexto);
  if (!contexto) throw new Error('useSessao precisa estar dentro de <SessaoProvider>');
  return contexto;
}
