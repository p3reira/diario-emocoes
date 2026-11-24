// Componentes visuais reutilizados em todas as telas.
// Todos leem cores, fonte e tamanho de texto do TemaContexto, então o tema e a
// fonte ajustável valem no app inteiro sem cada tela se preocupar com isso.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTES, useTema } from '../contexto/TemaContexto';

const TAMANHOS = { grande: 32, titulo: 26, subtitulo: 19, corpo: 16, rotulo: 15, pequeno: 13 };

// Peso padrão de cada variante. "negrito" força o peso mais forte.
const PESO_PADRAO = { grande: 'negrito', titulo: 'negrito', subtitulo: 'seminegrito' };

export function Texto({ variante = 'corpo', cor = 'texto', negrito, peso, centro, style, children, ...props }) {
  const { cores, fonte } = useTema();
  const tamanho = fonte(TAMANHOS[variante]);
  const familia = FONTES[negrito ? 'negrito' : peso ?? PESO_PADRAO[variante] ?? 'regular'];
  return (
    <Text
      style={[
        {
          color: cores[cor] ?? cor,
          fontSize: tamanho,
          lineHeight: Math.round(tamanho * (variante === 'grande' ? 1.2 : 1.4)),
          fontFamily: familia,
          letterSpacing: variante === 'grande' ? -0.5 : 0,
          textAlign: centro ? 'center' : undefined,
        },
        style,
      ]}
      accessibilityRole={variante === 'titulo' || variante === 'grande' ? 'header' : undefined}
      {...props}
    >
      {children}
    </Text>
  );
}

// Contêiner rolável de toda tela. Em telas largas (tablet, paisagem) o conteúdo
// fica centralizado com largura máxima, para as linhas não ficarem longas demais.
// Teclado: no Android (tela de ponta a ponta) a janela não encolhe quando o teclado
// abre, então a própria Tela cuida disso: soma a altura do teclado no fim da rolagem
// e rola até o campo focado, para ele nunca ficar escondido atrás do teclado.
const TecladoContexto = createContext({ mostrarCampoFocado: () => {} });
const FOLGA_TECLADO = 24;

function useTeclado(rolagem, deslocamento) {
  const [altura, setAltura] = useState(0);
  const topoTeclado = useRef(null); // posição Y do topo do teclado na tela

  const mostrarCampoFocado = useCallback(() => {
    // Espera o layout aplicar o espaço extra antes de medir e rolar.
    setTimeout(() => {
      if (topoTeclado.current === null || !rolagem.current) return; // teclado fechado (ou web)
      const campo = TextInput.State?.currentlyFocusedInput?.();
      if (!campo?.measureInWindow) return;
      campo.measureInWindow((x, y, largura, alturaCampo) => {
        const excesso = y + alturaCampo + FOLGA_TECLADO - topoTeclado.current;
        if (excesso > 0) {
          rolagem.current.scrollTo({ y: deslocamento.current + excesso, animated: true });
        }
      });
    }, 120);
  }, [rolagem, deslocamento]);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const abriu = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      topoTeclado.current = e.endCoordinates.screenY;
      setAltura(e.endCoordinates.height);
      mostrarCampoFocado();
    });
    const fechou = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      topoTeclado.current = null;
      setAltura(0);
    });
    return () => {
      abriu.remove();
      fechou.remove();
    };
  }, [mostrarCampoFocado]);

  return { altura, mostrarCampoFocado };
}

export function Tela({ children, centralizar = false, semRolagem = false, style, rolarPara }) {
  const { cores, larga } = useTema();
  const margens = useSafeAreaInsets();
  const rolagem = useRef(null);
  const deslocamento = useRef(0);
  const teclado = useTeclado(rolagem, deslocamento);

  // Rolagem pedida pela tela (ex.: Ajustes abre direto no cartão do lembrete).
  useEffect(() => {
    if (rolarPara && rolagem.current) rolagem.current.scrollTo({ y: rolarPara.y, animated: true });
  }, [rolarPara]);
  const conteudo = {
    flexGrow: 1,
    width: '100%',
    maxWidth: larga ? 980 : 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32 + (teclado.altura > 0 ? teclado.altura : margens.bottom),
    justifyContent: centralizar ? 'center' : 'flex-start',
  };

  if (semRolagem) {
    return <View style={[{ flex: 1, backgroundColor: cores.fundo }, conteudo, style]}>{children}</View>;
  }

  return (
    <TecladoContexto.Provider value={teclado}>
      <ScrollView
        ref={rolagem}
        style={{ flex: 1, backgroundColor: cores.fundo }}
        contentContainerStyle={[conteudo, style]}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => { deslocamento.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </TecladoContexto.Provider>
  );
}

// tom: 'normal' (lilás bem claro), 'forte' (lilás) ou 'menta' (verde-menta).
export function Cartao({ children, style, tom = 'normal', destaque }) {
  const { cores } = useTema();
  const fundo = { normal: cores.cartao, forte: cores.cartaoForte, menta: cores.menta }[destaque ? 'forte' : tom];
  return (
    <View style={[{ backgroundColor: fundo, borderRadius: 28, padding: 20, marginBottom: 16 }, style]}>
      {children}
    </View>
  );
}

export function Icone({ nome, tamanho = 22, cor = 'texto', style }) {
  const { cores, escala } = useTema();
  return (
    <MaterialCommunityIcons
      name={nome}
      size={Math.round(tamanho * escala)}
      color={cores[cor] ?? cor}
      style={style}
      // O ícone é decorativo: o texto ao lado já diz o que ele significa.
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

// Ícone dentro de um círculo colorido (logo, ícones de seção).
export function IconeRedondo({ nome, tamanho = 22, cor = 'sobrePrimariaSuave', fundo = 'primariaSuave', diametro = 44 }) {
  const { cores, escala } = useTema();
  const d = Math.round(diametro * Math.min(escala, 1.3));
  return (
    <View
      style={{
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: cores[fundo] ?? fundo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icone nome={nome} tamanho={tamanho} cor={cor} />
    </View>
  );
}

export function Campo({ rotulo, dica, style, multiline, rodape, onFocus, onBlur, ...props }) {
  const { cores, fonte } = useTema();
  const { mostrarCampoFocado } = useContext(TecladoContexto);
  // Destaque do campo selecionado feito pelo próprio app (borda roxa que acompanha
  // o arredondamento). No navegador, o contorno quadrado padrão (outline) é desligado
  // abaixo; o foco continua visível, então a acessibilidade pelo teclado se mantém.
  const [focado, setFocado] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      {rotulo ? (
        <Texto variante="rotulo" peso="seminegrito" style={{ marginBottom: 6 }}>
          {rotulo}
        </Texto>
      ) : null}
      <View
        style={{
          borderWidth: focado ? 2 : 1,
          margin: focado ? 0 : 1, // compensa a borda mais grossa: o campo não "pula"
          borderColor: focado ? cores.primaria : cores.borda,
          borderRadius: multiline ? 24 : 16,
          backgroundColor: cores.campo,
          overflow: 'hidden',
        }}
      >
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? rotulo}
          accessibilityHint={dica}
          placeholderTextColor={cores.textoSuave}
          autoCorrect={false}
          multiline={multiline}
          style={[
            {
              paddingHorizontal: 16,
              paddingVertical: 14,
              minHeight: multiline ? 130 : 52,
              textAlignVertical: multiline ? 'top' : 'center',
              fontSize: fonte(16),
              fontFamily: FONTES.regular,
              color: cores.texto,
              outlineStyle: 'none', // só existe na web: tira o quadrado do navegador
            },
            style,
          ]}
          {...props}
          onFocus={(e) => {
            setFocado(true);
            mostrarCampoFocado(); // trocar de campo com o teclado já aberto também rola
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
        />
        {rodape ? <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>{rodape}</View> : null}
      </View>
      {dica ? (
        <Texto variante="pequeno" cor="textoSuave" style={{ marginTop: 6 }}>
          {dica}
        </Texto>
      ) : null}
    </View>
  );
}

// Botão em pílula, com área de toque mínima de 52 px (acessibilidade e item 82 do guia).
// tipo: 'primario' (roxo), 'secundario' (lilás) ou 'perigo' (contorno vermelho).
export function Botao({ titulo, onPress, tipo = 'primario', icone, carregando = false, desativado = false, dica, style }) {
  const { cores } = useTema();
  const bloqueado = carregando || desativado;
  const fundo = { primario: cores.primaria, secundario: cores.primariaSuave, perigo: 'transparent' }[tipo];
  const corTexto = { primario: cores.sobrePrimaria, secundario: cores.sobrePrimariaSuave, perigo: cores.perigo }[tipo];

  return (
    <Pressable
      onPress={onPress}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: bloqueado, busy: carregando }}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: 999,
          paddingHorizontal: 22,
          paddingVertical: 10,
          marginTop: 10,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fundo,
          borderWidth: tipo === 'perigo' ? 1.5 : 0,
          borderColor: corTexto,
          opacity: bloqueado ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone ? <Icone nome={icone} cor={corTexto} tamanho={20} /> : null}
          <Texto peso="seminegrito" cor={corTexto}>
            {titulo}
          </Texto>
        </>
      )}
    </Pressable>
  );
}

export function Mensagem({ texto, tipo = 'erro' }) {
  const { cores } = useTema();
  if (!texto) return null;
  const estilo = {
    erro: [cores.erroFundo, 'erroTexto', 'alert-circle-outline'],
    sucesso: [cores.sucessoFundo, 'sucessoTexto', 'check-circle-outline'],
    alerta: [cores.alertaFundo, 'alertaTexto', 'information-outline'],
  }[tipo];
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tipo === 'erro' ? 'alert' : 'text'}
      style={{ flexDirection: 'row', gap: 10, backgroundColor: estilo[0], borderRadius: 18, padding: 14, marginBottom: 14 }}
    >
      <Icone nome={estilo[2]} cor={estilo[1]} tamanho={20} />
      <Texto cor={estilo[1]} style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}

// Etiqueta em pílula (contextos, emoções, tema...). Selecionada: lilás com ✓.
export function Chip({ rotulo, selecionado, onPress, icone }) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: selecionado }}
      hitSlop={4}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundColor: selecionado ? cores.primariaSuave : cores.chip,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {/* Marca visível além da cor: quem não distingue cores vê o ✓ */}
      {selecionado ? <Icone nome="check" tamanho={18} cor="sobrePrimariaSuave" /> : null}
      {icone ? <Icone nome={icone} tamanho={20} cor={selecionado ? 'sobrePrimariaSuave' : 'textoSuave'} /> : null}
      {!selecionado && !icone ? <Icone nome="plus" tamanho={16} cor="textoSuave" /> : null}
      <Texto variante="rotulo" cor={selecionado ? 'sobrePrimariaSuave' : 'texto'} peso={selecionado ? 'seminegrito' : 'media'}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

// Etiqueta pequena, só para mostrar (sem toque).
export function Etiqueta({ texto }) {
  const { cores } = useTema();
  return (
    <View style={{ backgroundColor: cores.chip, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Texto variante="pequeno" cor="textoSuave" peso="media">{texto}</Texto>
    </View>
  );
}

export function Carregando({ texto = 'Carregando...' }) {
  const { cores } = useTema();
  return (
    <View style={{ padding: 32, alignItems: 'center', gap: 12 }} accessibilityLiveRegion="polite">
      <ActivityIndicator color={cores.primaria} size="large" />
      <Texto cor="textoSuave">{texto}</Texto>
    </View>
  );
}

// Barra do topo das abas: logo, título, sino (lembrete) e avatar (meus dados).
export function Cabecalho({ titulo, lembretePendente = false }) {
  const { cores } = useTema();
  const margens = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: cores.fundo,
        paddingTop: margens.top + 10,
        paddingBottom: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <IconeRedondo nome="spa-outline" tamanho={24} diametro={48} />
      <Texto variante="titulo" style={{ flex: 1 }} numberOfLines={1}>
        {titulo}
      </Texto>
      <Pressable
        // Com o pontinho, o sino leva direto para registrar; sem ele, para o
        // cartão do lembrete nos Ajustes.
        onPress={() => (lembretePendente
          ? router.navigate('/registrar')
          : router.navigate({ pathname: '/conta', params: { secao: 'lembrete' } }))}
        accessibilityRole="button"
        accessibilityLabel={lembretePendente ? 'Lembrete: você ainda não registrou hoje. Toque para registrar agora' : 'Ajustes do lembrete'}
        hitSlop={8}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icone nome={lembretePendente ? 'bell-badge-outline' : 'bell-outline'} tamanho={26} cor={lembretePendente ? 'primaria' : 'texto'} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/perfil')}
        accessibilityRole="button"
        accessibilityLabel="Meus dados"
        hitSlop={4}
      >
        <IconeRedondo nome="account-outline" tamanho={22} cor="sobrePrimaria" fundo="primaria" diametro={44} />
      </Pressable>
    </View>
  );
}

// Aviso flutuante no rodapé (ex.: "Registro salvo" com o botão Desfazer).
export function AvisoFlutuante({ texto, acao, aoAgir, visivel }) {
  const { cores } = useTema();
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacidade, { toValue: visivel ? 1 : 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [visivel, opacidade]);

  if (!visivel) return null;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={{
        opacity: opacidade,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: cores.aviso,
        borderRadius: 24,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginTop: 16,
      }}
    >
      <Icone nome="check-circle-outline" cor="acaoAviso" />
      <Texto cor="sobreAviso" style={{ flex: 1 }}>{texto}</Texto>
      {acao ? (
        <Pressable onPress={aoAgir} accessibilityRole="button" accessibilityLabel={acao} hitSlop={10}>
          <Texto cor="acaoAviso" peso="seminegrito">{acao}</Texto>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
