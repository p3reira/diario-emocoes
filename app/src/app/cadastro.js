import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Botao, Campo, Mensagem, Tela, Texto } from '../componentes/ui';
import { useSessao } from '../contexto/SessaoContexto';
import { cadastrar } from '../servicos/api';

export default function TelaCadastro() {
  const { setAviso } = useSessao();
  const [dados, setDados] = useState({ nome: '', sobrenome: '', email: '', usuario: '', senha: '' });
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const mudar = (campo) => (valor) => setDados((atual) => ({ ...atual, [campo]: valor }));

  async function enviar() {
    if (Object.values(dados).some((v) => !v.trim())) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (dados.senha !== confirmacao) {
      setErro('As duas senhas não são iguais.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      await cadastrar(dados);
      setAviso({ texto: 'Conta criada! Agora é só entrar.', tipo: 'sucesso' });
      router.back();
    } catch (e) {
      setErro(e.message);
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <Texto cor="textoSuave" style={{ marginBottom: 16 }}>
        Use dados fictícios se estiver só testando o app.
      </Texto>
      <Mensagem texto={erro} />
      <Campo rotulo="Nome" value={dados.nome} onChangeText={mudar('nome')} autoComplete="given-name" />
      <Campo rotulo="Sobrenome" value={dados.sobrenome} onChangeText={mudar('sobrenome')} autoComplete="family-name" />
      <Campo rotulo="E-mail" value={dados.email} onChangeText={mudar('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Campo
        rotulo="Nome de usuário"
        value={dados.usuario}
        onChangeText={mudar('usuario')}
        autoCapitalize="none"
        dica="De 3 a 30 caracteres: letras, números, ponto ou sublinhado."
      />
      <Campo rotulo="Senha" value={dados.senha} onChangeText={mudar('senha')} secureTextEntry autoCapitalize="none" dica="Pelo menos 6 caracteres." />
      <Campo rotulo="Repita a senha" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry autoCapitalize="none" onSubmitEditing={enviar} />

      <Texto variante="pequeno" cor="textoSuave" style={{ marginTop: 4 }}>
        Ao criar a conta, você confirma que leu a{' '}
        <Link href="/privacidade">
          <Texto variante="pequeno" cor="primaria">política de privacidade</Texto>
        </Link>
        .
      </Texto>
      <Botao titulo="Criar conta" icone="account-plus-outline" onPress={enviar} carregando={carregando} />
    </Tela>
  );
}
