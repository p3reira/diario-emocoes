// "Meus dados": consultar e alterar os dados da própria conta (LGPD).
import { router } from 'expo-router';
import { useState } from 'react';
import { Botao, Campo, Mensagem, Tela, Texto } from '../componentes/ui';
import { useSessao } from '../contexto/SessaoContexto';
import { alterarPerfil } from '../servicos/api';

export default function TelaPerfil() {
  const { usuario, atualizarUsuario } = useSessao();
  const [dados, setDados] = useState({
    nome: usuario.nome,
    sobrenome: usuario.sobrenome,
    email: usuario.email,
    usuario: usuario.usuario,
  });
  const [senha, setSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const mudar = (campo) => (valor) => setDados((atual) => ({ ...atual, [campo]: valor }));

  // E-mail, usuário e senha dão acesso à conta: mudar qualquer um pede a senha atual.
  const mudaAcesso =
    dados.email.trim() !== usuario.email || dados.usuario.trim() !== usuario.usuario || senha !== '';

  async function salvar() {
    setErro('');
    setSalvando(true);
    try {
      // Só manda o que mudou; a senha só vai se a pessoa escreveu uma nova.
      const alterados = Object.fromEntries(Object.entries(dados).filter(([campo, valor]) => valor.trim() !== usuario[campo]));
      if (senha) alterados.senha = senha;
      if (Object.keys(alterados).length === 0) {
        router.back();
        return;
      }
      if (mudaAcesso) alterados.senhaAtual = senhaAtual;
      atualizarUsuario(await alterarPerfil(alterados));
      router.back();
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  const desde = new Date(usuario.criado_em).toLocaleDateString('pt-BR');
  const consentiu = new Date(usuario.consentimento_em).toLocaleString('pt-BR');

  return (
    <Tela>
      <Texto variante="pequeno" cor="textoSuave" style={{ marginBottom: 12 }}>
        Conta criada em {desde}. Consentimento de dados dado em {consentiu}.
      </Texto>
      <Campo rotulo="Nome" value={dados.nome} onChangeText={mudar('nome')} />
      <Campo rotulo="Sobrenome" value={dados.sobrenome} onChangeText={mudar('sobrenome')} />
      <Campo rotulo="E-mail" value={dados.email} onChangeText={mudar('email')} keyboardType="email-address" autoCapitalize="none" />
      <Campo rotulo="Nome de usuário" value={dados.usuario} onChangeText={mudar('usuario')} autoCapitalize="none" />
      <Campo rotulo="Nova senha" value={senha} onChangeText={setSenha} secureTextEntry autoCapitalize="none" dica="Deixe em branco para manter a senha atual." />
      {mudaAcesso ? (
        <Campo
          rotulo="Senha atual"
          value={senhaAtual}
          onChangeText={setSenhaAtual}
          secureTextEntry
          autoCapitalize="none"
          dica="Para mudar e-mail, usuário ou senha, confirme que é você."
        />
      ) : null}
      <Mensagem texto={erro} />
      <Botao
        titulo="Salvar"
        icone="content-save-outline"
        onPress={salvar}
        carregando={salvando}
        desativado={mudaAcesso && !senhaAtual}
      />
    </Tela>
  );
}
