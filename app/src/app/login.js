import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CartaoBoasVindas } from '../componentes/boasVindas';
import { Botao, Campo, Mensagem, Tela, Texto } from '../componentes/ui';
import { useSessao } from '../contexto/SessaoContexto';

export default function TelaLogin() {
  const { entrar, aviso } = useSessao();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrarNoApp() {
    if (!login.trim() || !senha) {
      setErro('Preencha o usuário (ou e-mail) e a senha.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      const perfil = await entrar(login.trim(), senha);
      // Sem consentimento ainda? Mostra as boas-vindas e o aviso de dados sensíveis antes de tudo.
      router.replace(perfil.consentimento_em ? '/inicio' : '/consentimento');
    } catch (e) {
      setErro(e.message);
      setSenha('');
      setCarregando(false);
    }
  }

  return (
    <Tela centralizar style={{ paddingTop: 32 }}>
      <CartaoBoasVindas />

      {erro ? <Mensagem texto={erro} /> : <Mensagem texto={aviso?.texto} tipo={aviso?.tipo} />}

      <Campo
        rotulo="Usuário ou e-mail"
        value={login}
        onChangeText={setLogin}
        placeholder="ana.ficticia"
        autoCapitalize="none"
        autoComplete="username"
        returnKeyType="next"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Sua senha"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={entrarNoApp}
      />

      <Botao titulo="Entrar" icone="login" onPress={entrarNoApp} carregando={carregando} />
      <Botao titulo="Criar uma conta" tipo="secundario" onPress={() => router.push('/cadastro')} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
        <Link href="/privacidade" accessibilityRole="link">
          <Texto cor="primaria" variante="rotulo" peso="seminegrito">Política de privacidade</Texto>
        </Link>
        <Link href="/ajuda" accessibilityRole="link">
          <Texto cor="primaria" variante="rotulo" peso="seminegrito">Preciso de ajuda agora</Texto>
        </Link>
      </View>
    </Tela>
  );
}
