// Conta: personalização (tema, lembrete), acessibilidade (tamanho da fonte)
// e controle dos dados pela própria pessoa (LGPD, item 10 do guia).
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Botao, Campo, Cartao, Chip, Icone, Mensagem, Tela, Texto } from '../../componentes/ui';
import { useConfirmacao } from '../../componentes/confirmacao';
import { cancelarLembretes, pedirPermissao } from '../../servicos/notificacoes';
import { useSessao } from '../../contexto/SessaoContexto';
import { useTema } from '../../contexto/TemaContexto';
import * as api from '../../servicos/api';
import { dataISO, ehHoraValida, mascaraHora } from '../../util/diario';
import { compartilharDados } from '../../servicos/arquivos';

const TEMAS = [
  ['sistema', 'Igual ao celular', 'theme-light-dark'],
  ['claro', 'Claro', 'white-balance-sunny'],
  ['escuro', 'Escuro', 'weather-night'],
];
const ESCALAS = [0.9, 1, 1.15, 1.3, 1.5];
const HORARIOS = ['08:00', '12:00', '20:00', '21:00', '22:00'];

export default function TelaConta() {
  const { usuario, atualizarUsuario, sair } = useSessao();
  const { escala, larga } = useTema();
  const [mensagem, setMensagem] = useState(null);
  const [horaPropria, setHoraPropria] = useState('');
  const [avisoLembrete, setAvisoLembrete] = useState(null); // resposta logo abaixo do lembrete
  const [ocupado, setOcupado] = useState('');

  async function salvar(prefs) {
    setMensagem(null);
    try {
      atualizarUsuario(await api.salvarPreferencias(prefs));
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message });
    }
  }

  const confirmar = useConfirmacao();
  const [avisoApagar, setAvisoApagar] = useState(null); // resposta dentro do cartão "Apagar"

  // Ações sem volta: a janela pede a senha e a API confere antes de apagar.
  async function apagarComSenha(chave, opcoes, acao) {
    setAvisoApagar(null);
    const { confirmado, senha } = await confirmar({ ...opcoes, perigo: true, pedirSenha: true });
    if (!confirmado) return;
    setOcupado(chave);
    try {
      await acao(senha);
    } catch (e) {
      setAvisoApagar({ tipo: 'erro', texto: e.message });
    } finally {
      setOcupado('');
    }
  }

  async function executar(chave, acao) {
    setOcupado(chave);
    setMensagem(null);
    try {
      await acao();
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message });
    } finally {
      setOcupado('');
    }
  }

  // Lembrete: confere o formato antes de enviar e responde ali mesmo, no cartão.
  // "extras" leva junto o horário personalizado, quando ele muda.
  async function salvarLembrete(hora, extras = {}) {
    if (hora !== null && !ehHoraValida(hora)) {
      setAvisoLembrete({ tipo: 'erro', texto: 'Use o formato 19:30, com horas de 00 a 23.' });
      return;
    }
    try {
      atualizarUsuario(await api.salvarPreferencias({ lembrete_hora: hora, ...extras }));
      setHoraPropria('');
      if (!hora) {
        setAvisoLembrete({ tipo: 'sucesso', texto: 'Lembrete desligado. Você pode ligar de novo quando quiser.' });
        return;
      }
      // Notificação do celular: pede permissão na hora em que a pessoa liga o lembrete.
      const permissao = await pedirPermissao();
      const extra = {
        ok: ' O celular também vai te avisar nesse horário, só nos dias sem registro.',
        negado: ' As notificações estão bloqueadas nas configurações do celular; o aviso fica só dentro do app.',
        indisponivel: '',
      }[permissao];
      setAvisoLembrete({
        tipo: 'sucesso',
        texto: `Lembrete definido para ${hora}. Depois desse horário, se você ainda não registrou no dia, o Início avisa e o sino ganha um pontinho.${extra}`,
      });
    } catch (e) {
      setAvisoLembrete({ tipo: 'erro', texto: e.message });
    }
  }

  // Horário criado pela pessoa: fica guardado na conta e continua na lista.
  function usarHorarioProprio() {
    const hora = horaPropria;
    salvarLembrete(hora, HORARIOS.includes(hora) ? {} : { lembrete_personalizado: hora });
  }

  async function apagarHorarioProprio() {
    const ativo = usuario.lembrete_hora === usuario.lembrete_personalizado;
    try {
      atualizarUsuario(await api.salvarPreferencias({ lembrete_personalizado: null, ...(ativo ? { lembrete_hora: null } : {}) }));
      setAvisoLembrete({ tipo: 'sucesso', texto: ativo ? 'Horário apagado e lembrete desligado.' : 'Horário apagado.' });
    } catch (e) {
      setAvisoLembrete({ tipo: 'erro', texto: e.message });
    }
  }

  // Já registrou hoje? Então o lembrete de hoje não vai aparecer, e o cartão avisa.
  const [registrouHoje, setRegistrouHoje] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const hoje = dataISO();
      api.listarRegistros({ de: hoje, ate: hoje })
        .then((r) => setRegistrouHoje(Array.isArray(r) && r.length > 0))
        .catch(() => setRegistrouHoje(false));
    }, []),
  );

  // Vindo do sino: rola a tela até o cartão do lembrete.
  // Posição do cartão = topo das colunas + topo do cartão dentro da coluna.
  const { secao } = useLocalSearchParams();
  const posicao = useRef({ colunas: null, cartao: null });
  const pendente = useRef(false);
  const [rolarPara, setRolarPara] = useState(null);
  const tentarRolar = useCallback(() => {
    const { colunas, cartao } = posicao.current;
    if (!pendente.current || colunas === null || cartao === null) return;
    pendente.current = false;
    setRolarPara({ y: Math.max(0, colunas + cartao - 12), vez: Date.now() });
    router.setParams({ secao: '' });
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (secao === 'lembrete') {
        pendente.current = true;
        tentarRolar();
      }
    }, [secao, tentarRolar]),
  );

  const lembrete = usuario.lembrete_hora;
  const personalizado = usuario.lembrete_personalizado && !HORARIOS.includes(usuario.lembrete_personalizado)
    ? usuario.lembrete_personalizado
    : null;
  // Compatibilidade: lembrete ativo fora da lista e sem personalizado guardado.
  const avulso = lembrete && !HORARIOS.includes(lembrete) && lembrete !== personalizado ? lembrete : null;

  const indiceEscala = ESCALAS.findIndex((e) => Math.abs(e - escala) < 0.01);
  const mudarFonte = (passo) => {
    const proximo = ESCALAS[Math.min(ESCALAS.length - 1, Math.max(0, (indiceEscala === -1 ? 1 : indiceEscala) + passo))];
    salvar({ escala_fonte: proximo });
  };

  return (
    <Tela rolarPara={rolarPara}>
      <Texto variante="titulo">{usuario.nome} {usuario.sobrenome}</Texto>
      <Texto cor="textoSuave" style={{ marginBottom: 16 }}>@{usuario.usuario} · {usuario.email}</Texto>
      <Mensagem texto={mensagem?.texto} tipo={mensagem?.tipo} />

      <View
        style={{ flexDirection: larga ? 'row' : 'column', gap: larga ? 16 : 0, alignItems: 'flex-start' }}
        onLayout={(e) => { posicao.current.colunas = e.nativeEvent.layout.y; tentarRolar(); }}
      >
        <View style={larga ? { flex: 1 } : { width: '100%' }}>
          {/* PERSONALIZAÇÃO */}
          <Cartao>
            <Texto variante="subtitulo" style={{ marginBottom: 4 }}>Aparência</Texto>
            <Texto variante="pequeno" cor="textoSuave" style={{ marginBottom: 10 }}>Fica salvo na sua conta.</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Tema">
              {TEMAS.map(([valor, rotulo, icone]) => (
                <Chip key={valor} rotulo={rotulo} icone={icone} selecionado={usuario.tema === valor} onPress={() => salvar({ tema: valor })} />
              ))}
            </View>
          </Cartao>

          {/* ACESSIBILIDADE */}
          <Cartao>
            <Texto variante="subtitulo" style={{ marginBottom: 4 }}>Tamanho do texto</Texto>
            <Texto style={{ marginBottom: 10 }}>Exemplo: é assim que os textos aparecem no app.</Texto>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Botao titulo="A−" tipo="secundario" onPress={() => mudarFonte(-1)} desativado={indiceEscala === 0} dica="Diminui o texto" style={{ flex: 1, marginTop: 0 }} />
              <Texto negrito accessibilityLiveRegion="polite" accessibilityLabel={`Tamanho atual: ${Math.round(escala * 100)} por cento`}>
                {Math.round(escala * 100)}%
              </Texto>
              <Botao titulo="A+" tipo="secundario" onPress={() => mudarFonte(1)} desativado={indiceEscala === ESCALAS.length - 1} dica="Aumenta o texto" style={{ flex: 1, marginTop: 0 }} />
            </View>
          </Cartao>

          {/* LEMBRETE (personalização) */}
          <View onLayout={(e) => { posicao.current.cartao = e.nativeEvent.layout.y; tentarRolar(); }}>
          <Cartao>
            <Texto variante="subtitulo" style={{ marginBottom: 4 }}>Lembrete diário</Texto>
            <Texto variante="pequeno" cor="textoSuave" style={{ marginBottom: 10 }}>
              Depois deste horário, se você ainda não registrou no dia, a tela inicial lembra você. Sem pressão: é só um convite.
            </Texto>
            <Texto peso="seminegrito" style={{ marginBottom: registrouHoje && lembrete ? 4 : 10 }} accessibilityLiveRegion="polite">
              {lembrete ? `Ativo: todos os dias às ${lembrete}` : 'Desligado'}
            </Texto>
            {registrouHoje && lembrete ? (
              <Texto variante="pequeno" cor="textoSuave" style={{ marginBottom: 10 }}>
                Hoje você já registrou, então o lembrete não vai aparecer hoje. 💜
              </Texto>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <Chip rotulo="Desligado" icone="bell-off-outline" selecionado={!lembrete} onPress={() => salvarLembrete(null)} />
              {[...HORARIOS, ...(avulso ? [avulso] : [])].map((h) => (
                <Chip key={h} rotulo={h} icone="bell-outline" selecionado={lembrete === h} onPress={() => salvarLembrete(h)} />
              ))}
              {personalizado ? (
                <ChipPersonalizado
                  hora={personalizado}
                  selecionado={lembrete === personalizado}
                  aoEscolher={() => salvarLembrete(personalizado)}
                  aoApagar={apagarHorarioProprio}
                />
              ) : null}
            </View>
            <Campo
              rotulo={personalizado ? 'Trocar meu horário' : 'Criar meu horário'}
              value={horaPropria}
              onChangeText={(t) => { setHoraPropria(mascaraHora(t)); setAvisoLembrete(null); }}
              placeholder="19:30"
              maxLength={5}
              keyboardType="number-pad"
            />
            <Botao titulo="Usar este horário" tipo="secundario" onPress={usarHorarioProprio} desativado={!horaPropria} style={{ marginTop: -6 }} />
            {avisoLembrete ? (
              <View style={{ marginTop: 14 }}>
                <Mensagem texto={avisoLembrete.texto} tipo={avisoLembrete.tipo} />
              </View>
            ) : null}
          </Cartao>
          </View>
        </View>

        <View style={larga ? { flex: 1 } : { width: '100%' }}>
          {/* CONTROLE DOS DADOS */}
          <Cartao>
            <Texto variante="subtitulo" style={{ marginBottom: 6 }}>Seus dados</Texto>
            <Botao titulo="Ver e alterar meus dados" tipo="secundario" icone="account-edit-outline" onPress={() => router.push('/perfil')} />
            <Botao
              titulo="Exportar todos os meus dados"
              tipo="secundario"
              icone="download-outline"
              carregando={ocupado === 'exportar'}
              dica="Gera um arquivo com sua conta e todos os registros"
              onPress={() => executar('exportar', async () => compartilharDados(await api.exportarDados()))}
            />
            <Botao titulo="Política de privacidade" tipo="secundario" icone="shield-account-outline" onPress={() => router.push('/privacidade')} />
            <Botao titulo="Ajuda agora (CVV 188)" tipo="secundario" icone="hand-heart-outline" onPress={() => router.push('/ajuda')} />
          </Cartao>

          <Cartao>
            <Texto variante="subtitulo" style={{ marginBottom: 6 }}>Apagar</Texto>
            <Botao
              titulo="Apagar todos os meus registros"
              tipo="perigo"
              icone="notebook-remove-outline"
              carregando={ocupado === 'registros'}
              onPress={() => apagarComSenha('registros', {
                titulo: 'Apagar todos os registros?',
                mensagem: 'Todos os registros do seu diário serão apagados para sempre. A conta continua existindo.',
                textoConfirmar: 'Apagar tudo',
              }, async (senha) => {
                const { quantidade } = await api.excluirTodosRegistros(senha);
                setAvisoApagar({ tipo: 'sucesso', texto: `${quantidade} registro(s) apagado(s).` });
              })}
            />
            <Botao
              titulo="Excluir minha conta"
              tipo="perigo"
              icone="account-remove-outline"
              carregando={ocupado === 'conta'}
              onPress={() => apagarComSenha('conta', {
                titulo: 'Excluir sua conta?',
                mensagem: 'Sua conta e TODOS os registros serão apagados para sempre. Não é possível desfazer.',
                textoConfirmar: 'Excluir conta',
              }, async (senha) => {
                await api.excluirConta(senha);
                await cancelarLembretes();
                sair({ texto: 'Sua conta e todos os seus dados foram excluídos.', tipo: 'sucesso' });
              })}
            />
            {avisoApagar ? (
              <View style={{ marginTop: 10 }}>
                <Mensagem texto={avisoApagar.texto} tipo={avisoApagar.tipo} />
              </View>
            ) : null}
          </Cartao>

          <Botao
            titulo="Sair"
            tipo="secundario"
            icone="logout"
            onPress={async () => {
              await cancelarLembretes(); // outra pessoa pode entrar neste celular
              sair();
            }}
          />
        </View>
      </View>
    </Tela>
  );
}

// Horário criado pela pessoa: visual próprio (borda tracejada, sino com lápis)
// para se destacar dos horários prontos, e um "x" para apagar.
function ChipPersonalizado({ hora, selecionado, aoEscolher, aoApagar }) {
  const { cores } = useTema();
  return (
    <View
      style={{
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: cores.primaria,
        backgroundColor: selecionado ? cores.primariaSuave : 'transparent',
      }}
    >
      <Pressable
        onPress={aoEscolher}
        accessibilityRole="checkbox"
        accessibilityLabel={`Meu horário, ${hora}`}
        accessibilityState={{ checked: selecionado }}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 6, minHeight: 44, opacity: pressed ? 0.75 : 1 })}
      >
        {selecionado ? <Icone nome="check" tamanho={18} cor="sobrePrimariaSuave" /> : null}
        <Icone nome="bell-cog-outline" tamanho={20} cor={selecionado ? 'sobrePrimariaSuave' : 'primaria'} />
        <Texto variante="rotulo" cor={selecionado ? 'sobrePrimariaSuave' : 'primaria'} peso="seminegrito">
          {hora} · meu horário
        </Texto>
      </Pressable>
      <Pressable
        onPress={aoApagar}
        accessibilityRole="button"
        accessibilityLabel={`Apagar meu horário ${hora}`}
        hitSlop={8}
        style={({ pressed }) => ({ paddingLeft: 4, paddingRight: 12, minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
      >
        <Icone nome="close-circle-outline" tamanho={20} cor={selecionado ? 'sobrePrimariaSuave' : 'textoSuave'} />
      </Pressable>
    </View>
  );
}
