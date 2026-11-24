// Componentes específicos do diário: seletor de humor, cartão de registro,
// formulário (usado em "Registrar" e em "Alterar") e o cartão de canais de ajuda.
import { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, View } from 'react-native';
import { useTema } from '../contexto/TemaContexto';
import {
  CONTEXTOS,
  EMOCOES_SUGERIDAS,
  HUMORES,
  dataISO,
  diaDaSemana,
  formatarData,
  horaAtual,
  humorPorValor,
  iconeDoContexto,
  rotulo,
  rotuloDia,
  DIAS_RETROATIVOS,
  dataBrParaISO,
  ehAntigoDemais,
  ehFuturo,
  ehHoraValida,
  isoParaBr,
  mascaraData,
  mascaraHora,
} from '../util/diario';
import { Botao, Campo, Cartao, Chip, Etiqueta, Icone, IconeRedondo, Mensagem, Texto } from './ui';

// Rosto do humor num círculo colorido. "destacado" = selecionado (verde).
export function RostoHumor({ valor, diametro = 56, destacado = false, branco = false }) {
  const { cores } = useTema();
  const humor = humorPorValor(valor);
  return (
    <View
      style={{
        width: diametro,
        height: diametro,
        borderRadius: diametro / 2,
        backgroundColor: destacado ? cores.verde : branco ? cores.fundo : cores[humor.fundo],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icone nome={humor.icone} tamanho={Math.round(diametro * 0.58)} cor={destacado ? cores.fundo : humor.tom} />
    </View>
  );
}

export function SeletorHumor({ valor, aoMudar }) {
  const { cores } = useTema();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Como você está se sentindo?"
      style={{ flexDirection: 'row', gap: 6 }}
    >
      {HUMORES.map((humor) => {
        const selecionado = valor === humor.valor;
        return (
          <Pressable
            key={humor.valor}
            onPress={() => aoMudar(humor.valor)}
            accessibilityRole="radio"
            accessibilityLabel={`${humor.rotulo}, ${humor.valor} de 5`}
            accessibilityState={{ selected: selecionado }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 104,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              paddingHorizontal: 2,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: selecionado ? cores.verde : 'transparent',
              backgroundColor: selecionado ? cores.menta : cores.cartao,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <RostoHumor valor={humor.valor} diametro={48} destacado={selecionado} />
            <Texto
              variante="pequeno"
              centro
              peso={selecionado ? 'negrito' : 'media'}
              cor={selecionado ? 'sobreMenta' : 'textoSuave'}
            >
              {humor.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

// Humor mostrado com rosto + texto (nunca só cor).
export function SeloHumor({ valor }) {
  const humor = humorPorValor(valor);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <RostoHumor valor={valor} diametro={40} />
      <Texto variante="subtitulo">{humor.rotulo}</Texto>
    </View>
  );
}

// Cartão de um registro na lista (aba Registros).
export function CartaoRegistro({ registro, onPress, style }) {
  const { cores } = useTema();
  const humor = humorPorValor(registro.humor);
  const [, mes, dia] = registro.data.split('-');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${humor.rotulo} às ${registro.hora}, ${diaDaSemana(registro.data)}, ${formatarData(registro.data)}.${registro.atividades.length ? ` Contexto: ${registro.atividades.join(', ')}.` : ''}`}
      accessibilityHint="Abre o registro para ver, alterar ou excluir"
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          backgroundColor: cores.cartao,
          borderRadius: 24,
          padding: 16,
          marginBottom: 12,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <RostoHumor valor={registro.humor} diametro={52} branco />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Texto variante="subtitulo">{humor.rotulo}</Texto>
          <Texto cor="textoSuave">· {registro.hora}</Texto>
        </View>
        {registro.atividades.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {registro.atividades.slice(0, 4).map((a) => <Etiqueta key={a} texto={rotulo(a)} />)}
          </View>
        ) : null}
        {registro.nota ? (
          <Texto variante="pequeno" cor="textoSuave" numberOfLines={1}>{registro.nota}</Texto>
        ) : null}
      </View>
      <Texto variante="pequeno" cor="textoSuave">{dia}/{mes}</Texto>
      <Icone nome="dots-vertical" cor="textoSuave" />
    </Pressable>
  );
}

// Pílula de data ou hora no topo do formulário.
function PilulaInfo({ icone, texto, onPress, rotuloAcessivel }) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      accessibilityHint="Toque para alterar"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 48,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundColor: cores.chip,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Icone nome={icone} tamanho={20} cor="textoSuave" />
      <Texto peso="media" cor="textoSuave">{texto}</Texto>
    </Pressable>
  );
}

function SeletorEtiquetas({ sugestoes, selecionadas, aoMudar, comIcone, rotuloNovo }) {
  const [nova, setNova] = useState('');
  const todas = [...new Set([...sugestoes, ...selecionadas])];

  function alternar(item) {
    aoMudar(selecionadas.includes(item) ? selecionadas.filter((i) => i !== item) : [...selecionadas, item]);
  }

  function acrescentar() {
    const item = nova.trim().toLowerCase();
    if (item && item.length <= 40 && !selecionadas.includes(item)) aoMudar([...selecionadas, item]);
    setNova('');
  }

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        {todas.map((item) => (
          <Chip
            key={item}
            rotulo={rotulo(item)}
            icone={comIcone ? iconeDoContexto(item) : undefined}
            selecionado={selecionadas.includes(item)}
            onPress={() => alternar(item)}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Campo
            accessibilityLabel={rotuloNovo}
            value={nova}
            onChangeText={setNova}
            placeholder={`${rotuloNovo}...`}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={acrescentar}
          />
        </View>
        <Botao titulo="Incluir" tipo="secundario" icone="plus" onPress={acrescentar} desativado={!nova.trim()} style={{ marginTop: 0 }} />
      </View>
    </View>
  );
}

// Formulário curto: só o humor é obrigatório (itens 44 e 82 do guia).
export function FormRegistro({ inicial, aoSalvar, textoBotao = 'Salvar registro' }) {
  const [humor, setHumor] = useState(inicial?.humor ?? null);
  const [dataTexto, setDataTexto] = useState(isoParaBr(inicial?.data ?? dataISO())); // DD/MM/AAAA
  const [hora, setHora] = useState(inicial?.hora ?? horaAtual());
  const [editandoQuando, setEditandoQuando] = useState(false);
  // Num registro novo, data e hora acompanham o relógio até a pessoa mexer nelas.
  // Sem isso, a aba Registrar (que fica montada) guardava o horário de quando foi
  // aberta, e o registro saía com uma hora "congelada".
  const [quandoManual, setQuandoManual] = useState(Boolean(inicial));
  const [atividades, setAtividades] = useState(inicial?.atividades ?? []);
  const [emocoes, setEmocoes] = useState(inicial?.emocoes ?? []);
  const [mostrarEmocoes, setMostrarEmocoes] = useState((inicial?.emocoes ?? []).length > 0);
  const [nota, setNota] = useState(inicial?.nota ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (quandoManual) return undefined;
    const atualizar = () => {
      setDataTexto(isoParaBr(dataISO()));
      setHora(horaAtual());
    };
    atualizar();
    const relogio = setInterval(atualizar, 15 * 1000);                  // a cada 15 s
    const estado = AppState.addEventListener('change', (s) => s === 'active' && atualizar()); // voltou ao app
    return () => {
      clearInterval(relogio);
      estado.remove();
    };
  }, [quandoManual]);

  const data = dataBrParaISO(dataTexto); // AAAA-MM-DD ou null

  async function salvar() {
    // Sem ajuste manual, vale o momento exato do toque em Salvar.
    const dataSalvar = quandoManual ? data : dataISO();
    const horaSalvar = quandoManual ? hora : horaAtual();
    if (!humor) {
      setErro('Como você está agora? Toque em um dos rostinhos acima para salvar.');
      return;
    }
    if (!dataSalvar) {
      setEditandoQuando(true);
      setErro('Essa data não parece certa. Use o formato dia/mês/ano, por exemplo 20/11/2026.');
      return;
    }
    if (!ehHoraValida(horaSalvar)) {
      setEditandoQuando(true);
      setErro('Essa hora não parece certa. Use o formato 21:30, com horas de 00 a 23.');
      return;
    }
    if (ehFuturo(dataSalvar, horaSalvar)) return; // o aviso suave já aparece embaixo dos campos
    // Editar um registro antigo sem mudar a data continua permitido.
    if (ehAntigoDemais(dataSalvar) && dataSalvar !== inicial?.data) {
      setEditandoQuando(true);
      setErro(`Dá para registrar até ${DIAS_RETROATIVOS} dias atrás. Que tal escolher uma data mais recente?`);
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      await aoSalvar({ humor, data: dataSalvar, hora: horaSalvar, emocoes, atividades, nota: nota.trim() || null });
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  const dataValida = data !== null;
  // Um diário guarda o que já foi sentido: um momento futuro não pode ser salvo.
  const noFuturo = dataValida && ehHoraValida(hora) && ehFuturo(data, hora);

  function voltarParaAgora() {
    setDataTexto(isoParaBr(dataISO()));
    setHora(horaAtual());
    setQuandoManual(false); // volta a acompanhar o relógio
    setErro('');
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <PilulaInfo
          icone="calendar-blank-outline"
          texto={dataValida ? rotuloDia(data) : dataTexto}
          rotuloAcessivel={`Data: ${dataValida ? formatarData(data) : dataTexto}. Toque para mudar a data e a hora`}
          onPress={() => setEditandoQuando(!editandoQuando)}
        />
        <PilulaInfo icone="clock-outline" texto={hora} rotuloAcessivel={`Hora: ${hora}. Toque para mudar a data e a hora`} onPress={() => setEditandoQuando(!editandoQuando)} />
      </View>
      {editandoQuando ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 3 }}>
            <Campo rotulo="Data" value={dataTexto} onChangeText={(t) => { setDataTexto(mascaraData(t)); setQuandoManual(true); }} placeholder="DD/MM/AAAA" maxLength={10} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 2 }}>
            <Campo rotulo="Hora" value={hora} onChangeText={(t) => { setHora(mascaraHora(t)); setQuandoManual(true); }} placeholder="HH:MM" maxLength={5} keyboardType="number-pad" />
          </View>
        </View>
      ) : null}
      {noFuturo ? (
        <View style={{ marginBottom: 16 }}>
          <Mensagem tipo="alerta" texto="Aqui a gente guarda o que você já sentiu. Que tal registrar como você está agora?" />
          <Botao titulo="Registrar agora" tipo="secundario" icone="clock-outline" onPress={voltarParaAgora} style={{ marginTop: 0 }} />
        </View>
      ) : null}

      <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <IconeRedondo nome="heart-outline" tamanho={26} cor="primaria" fundo="fundo" diametro={56} />
        <View style={{ flex: 1 }}>
          <Texto>Um momento para respirar e se acolher.</Texto>
          <Texto variante="pequeno" cor="textoSuave">Suas respostas são pessoais e sem julgamentos.</Texto>
        </View>
      </Cartao>

      <Texto variante="subtitulo">Selecione seu humor</Texto>
      <Texto cor="textoSuave" style={{ marginBottom: 12 }}>Como seu corpo e mente estão se sentindo agora?</Texto>
      <SeletorHumor valor={humor} aoMudar={(v) => { setHumor(v); setErro(''); }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 28, marginBottom: 12, flexWrap: 'wrap' }}>
        <Texto variante="subtitulo">O que tem a ver com seu humor?</Texto>
        {atividades.length ? <Etiqueta texto={`${atividades.length} ${atividades.length === 1 ? 'selecionado' : 'selecionados'}`} /> : null}
      </View>
      <SeletorEtiquetas
        sugestoes={CONTEXTOS.map((c) => c.nome)}
        selecionadas={atividades}
        aoMudar={setAtividades}
        comIcone
        rotuloNovo="Outro contexto"
      />

      {mostrarEmocoes ? (
        <>
          <Texto variante="subtitulo" style={{ marginTop: 12, marginBottom: 12 }}>Quer dar nome ao que sentiu?</Texto>
          <SeletorEtiquetas sugestoes={EMOCOES_SUGERIDAS} selecionadas={emocoes} aoMudar={setEmocoes} rotuloNovo="Outra emoção" />
        </>
      ) : (
        <Botao
          titulo="Dar nome ao que sentiu (opcional)"
          tipo="secundario"
          icone="emoticon-outline"
          onPress={() => setMostrarEmocoes(true)}
          dica="Ajuda o Kit a escolher uma técnica para você"
          style={{ alignSelf: 'flex-start', marginBottom: 8 }}
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
        <Texto variante="subtitulo">Anotação pessoal</Texto>
        <Etiqueta texto="(Opcional)" />
      </View>
      <Campo
        accessibilityLabel="Anotação pessoal"
        value={nota}
        onChangeText={setNota}
        placeholder="Se quiser, conte como foi seu dia..."
        multiline
        maxLength={2000}
        autoCorrect
        rodape={<Texto variante="pequeno" cor="textoSuave">Seu espaço seguro. Só você pode ler.</Texto>}
      />

      <Mensagem texto={erro} />
      <Botao titulo={textoBotao} icone="check-circle-outline" onPress={salvar} carregando={salvando} desativado={noFuturo} />
    </View>
  );
}

// No computador pode não haver app de telefone: o número continua escrito no cartão.
function abrirTelefone(numero) {
  Linking.openURL(`tel:${numero}`).catch(() => {});
}

// Canais de ajuda sempre à mão (itens 31 e 37 do guia; orientação de crise).
export function CartaoAjuda({ compacto = false }) {
  return (
    <Cartao tom="menta">
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <IconeRedondo nome="hand-heart-outline" cor="sobreMenta" fundo="fundo" diametro={44} />
        <Texto variante="subtitulo" cor="sobreMenta" style={{ flex: 1 }}>Precisa conversar agora?</Texto>
      </View>
      <Texto cor="sobreMenta">
        O CVV (Centro de Valorização da Vida) atende de graça, 24 horas, pelo telefone 188 ou pelo chat em cvv.org.br.
        {compacto ? '' : ' Em risco imediato, ligue 192 (SAMU) ou vá ao pronto-socorro.'}
      </Texto>
      <Botao titulo="Ligar para o CVV (188)" icone="phone" onPress={() => abrirTelefone('188')} />
      {compacto ? null : (
        <>
          <Botao titulo="Abrir o chat do CVV" icone="chat-outline" tipo="secundario" onPress={() => Linking.openURL('https://cvv.org.br/')} />
          <Botao titulo="Ligar para o SAMU (192)" icone="ambulance" tipo="secundario" onPress={() => abrirTelefone('192')} />
        </>
      )}
    </Cartao>
  );
}
