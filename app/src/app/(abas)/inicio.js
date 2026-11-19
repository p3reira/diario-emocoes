// Tela inicial. Sensibilidade ao contexto:
//  - o horário do dia muda a saudação e o convite;
//  - se o lembrete já passou e não há registro hoje, aparece um aviso;
//  - se o último registro foi um dia difícil, o app oferece o Kit e os canais de ajuda.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { CartaoAjuda, RostoHumor } from '../../componentes/diario';
import { Botao, Cartao, Carregando, Icone, IconeRedondo, Mensagem, Tela, Texto } from '../../componentes/ui';
import { useSessao } from '../../contexto/SessaoContexto';
import { useTema } from '../../contexto/TemaContexto';
import { listarRegistros } from '../../servicos/api';
import { dataISO, diasAtras, horaJaPassou, humorPorValor, periodoDoDia } from '../../util/diario';

const LETRAS_DIA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Visão rápida dos últimos 7 dias (item 02 do guia: revisitar com facilidade).
function Semana({ registros }) {
  const { cores } = useTema();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date();
    data.setDate(data.getDate() - (6 - i));
    const iso = dataISO(data);
    const doDia = registros.filter((r) => r.data === iso);
    const media = doDia.length ? Math.round(doDia.reduce((s, r) => s + r.humor, 0) / doDia.length) : null;
    return { iso, letra: LETRAS_DIA[data.getDay()], media };
  });

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
      {dias.map(({ iso, letra, media }) => (
        <View
          key={iso}
          style={{ alignItems: 'center', gap: 6, flex: 1 }}
          accessible
          accessibilityLabel={`${iso.split('-').reverse().join('/')}: ${media ? humorPorValor(media).rotulo : 'sem registro'}`}
        >
          {media ? (
            <RostoHumor valor={media} diametro={38} />
          ) : (
            <View style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderStyle: 'dashed', borderColor: cores.borda }} />
          )}
          <Texto variante="pequeno" cor="textoSuave" peso="media">{letra}</Texto>
        </View>
      ))}
    </View>
  );
}

export default function TelaInicio() {
  const { usuario } = useSessao();
  const { larga } = useTema();
  const [registros, setRegistros] = useState(null);
  // Redesenha a cada minuto: o aviso do lembrete aparece na hora certa mesmo
  // com o app parado nesta tela.
  const [, setMinuto] = useState(0);
  useEffect(() => {
    const relogio = setInterval(() => setMinuto((n) => n + 1), 60 * 1000);
    return () => clearInterval(relogio);
  }, []);
  const [erro, setErro] = useState('');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarRegistros({ de: diasAtras(6) })
        .then((dados) => ativo && (setRegistros(dados), setErro('')))
        .catch((e) => ativo && setErro(e.message));
      return () => {
        ativo = false;
      };
    }, [])
  );

  const periodo = periodoDoDia();
  const registrouHoje = registros?.some((r) => r.data === dataISO());
  const ultimo = registros?.[0];
  const diaDificil = ultimo && ultimo.humor <= 2;
  const lembrar = !registrouHoje && horaJaPassou(usuario.lembrete_hora);

  return (
    <Tela>
      <Texto variante="grande">{periodo.saudacao}, {usuario.nome}!</Texto>
      <Texto cor="textoSuave" style={{ marginTop: 4, marginBottom: 18 }}>{periodo.convite}</Texto>

      <Mensagem texto={erro} />
      {lembrar ? (
        <Mensagem tipo="alerta" texto={`Seu lembrete das ${usuario.lembrete_hora}: você ainda não registrou hoje. Leva menos de um minuto.`} />
      ) : null}

      <View style={{ flexDirection: larga ? 'row' : 'column', gap: larga ? 16 : 0 }}>
        <View style={larga ? { flex: 1 } : undefined}>
          <Cartao>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icone nome="circle" tamanho={12} cor="primaria" />
              <Texto variante="subtitulo">Seus últimos 7 dias</Texto>
            </View>
            {registros === null && !erro ? <Carregando /> : <Semana registros={registros ?? []} />}
            <Botao
              titulo={registrouHoje ? 'Registrar de novo' : 'Registrar como estou'}
              icone="plus"
              onPress={() => router.push('/registrar')}
              style={{ marginTop: 18 }}
            />
            <Botao titulo="Ver meu histórico" tipo="secundario" icone="creation" onPress={() => router.push('/registros')} />
          </Cartao>
        </View>

        <View style={larga ? { flex: 1 } : undefined}>
          {diaDificil ? (
            <>
              <Cartao tom="forte">
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                  <IconeRedondo nome="lifebuoy" fundo="fundo" cor="primaria" />
                  <Texto variante="subtitulo" style={{ flex: 1 }}>Dia difícil?</Texto>
                </View>
                <Texto>
                  Seu último registro foi "{humorPorValor(ultimo.humor).rotulo.toLowerCase()}". Seu kit reúne o que costuma te ajudar nos dias bons, em versões de 5 minutos.
                </Texto>
                <Botao titulo="Abrir meu kit" icone="lifebuoy" onPress={() => router.push('/kit')} />
              </Cartao>
              <CartaoAjuda compacto />
            </>
          ) : (
            <Cartao tom="forte">
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <IconeRedondo nome="lifebuoy" fundo="fundo" cor="primaria" />
                <Texto variante="subtitulo" style={{ flex: 1 }}>Seu Kit para dias difíceis</Texto>
              </View>
              <Texto cor="textoSuave">
                Quanto mais você marca o que tem a ver com os dias bons, mais o seu kit fica com a sua cara.
              </Texto>
              <Botao titulo="Ver meu kit" tipo="secundario" icone="lifebuoy" onPress={() => router.push('/kit')} />
            </Cartao>
          )}
        </View>
      </View>
    </Tela>
  );
}
