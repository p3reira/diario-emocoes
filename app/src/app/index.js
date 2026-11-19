// Porta de entrada ("/"): manda para o login ou para a tela inicial, conforme a sessão.
// Também é para cá que o app volta quando a pessoa sai ou a sessão expira.
import { Redirect } from 'expo-router';
import { useSessao } from '../contexto/SessaoContexto';

export default function Entrada() {
  const { usuario } = useSessao();
  if (!usuario) return <Redirect href="/login" />;
  return <Redirect href={usuario.consentimento_em ? '/inicio' : '/consentimento'} />;
}
