// Histórico (CRUD: listar e consultar). Mostra um dia por vez:
//  - Curva do dia: humor ao longo das horas;
//  - Resumo do dia e "gentil descoberta" (o contexto em que o humor costuma melhorar);
//  - os registros do dia, que abrem para ver, alterar ou excluir.
// Responsiva: em tela larga, gráfico e resumo à esquerda, lista à direita.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CurvaDia } from '../../componentes/CurvaDia';
import { CartaoRegistro } from '../../componentes/diario';
import { Botao, Cartao, Carregando, Etiqueta, Icone, IconeRedondo, Mensagem, Tela, Texto } from '../../componentes/ui';
import { useTema } from '../../contexto/TemaContexto';
import { listarRegistros } from '../../servicos/api';
import { dataISO, diasAtras, rotuloDia } from '../../util/diario';
import { descobertaGentil, resumoDoDia } from '../../util/resumo';

function SeletorDia({ dias, selecionado, aoEscolher, quantidade }) {
  const { cores } = useTema();
  const [aberto, setAberto] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => setAberto(!aberto)}
          accessibilityRole="button"
          accessibilityLabel={`Dia mostrado: ${rotuloDia(selecionado)}. Trocar de dia`}
          accessibilityState={{ expanded: aberto }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            minHeight: 52,
            paddingHorizontal: 18,
            borderRadius: 999,
            backgroundColor: cores.primariaSuave,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Icone nome="calendar-blank-outline" cor="sobrePrimariaSuave" />
          <Texto variante="subtitulo" cor="sobrePrimariaSuave">{rotuloDia(selecionado)}</Texto>
          <Icone nome={aberto ? 'chevron-up' : 'chevron-down'} cor="sobrePrimariaSuave" />
        </Pressable>
        <Texto cor="textoSuave" peso="media">
          {quantidade} {quantidade === 1 ? 'momento registrado' : 'momentos registrados'}
        </Texto>
      </View>

      {aberto ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {dias.map((dia) => (
            <Pressable
              key={dia}
              onPress={() => {
                aoEscolher(dia);
                setAberto(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={rotuloDia(dia)}
              accessibilityState={{ selected: dia === selecionado }}
              style={{
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: dia === selecionado ? cores.primariaSuave : cores.chip,
              }}
            >
              <Texto variante="rotulo" peso="media" cor={dia === selecionado ? 'sobrePrimariaSuave' : 'texto'}>{rotuloDia(dia)}</Texto>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function LinhaResumo({ icone, children }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <Icone nome={icone} cor="textoSuave" />
      <Texto style={{ flex: 1 }}>{children}</Texto>
    </View>
  );
}

export default function TelaRegistros() {
  const { larga } = useTema();
  const [registros, setRegistros] = useState(null);
  const [diaEscolhido, setDiaEscolhido] = useState(null);
  const [erro, setErro] = useState('');

  // Recarrega sempre que a aba ganha foco (ex.: depois de registrar ou alterar).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarRegistros({ de: diasAtras(59) })
        .then((dados) => ativo && (setRegistros(dados), setErro('')))
        .catch((e) => ativo && setErro(e.message));
      return () => {
        ativo = false;
      };
    }, [])
  );

  // Dias que têm registro (mais novo primeiro). Valores derivados, sem estado extra.
  const dias = useMemo(() => [...new Set((registros ?? []).map((r) => r.data))], [registros]);
  const dia = diaEscolhido && dias.includes(diaEscolhido) ? diaEscolhido : dias.includes(dataISO()) ? dataISO() : dias[0];
  const doDia = (registros ?? []).filter((r) => r.data === dia);
  const resumo = resumoDoDia(doDia);
  const descoberta = useMemo(() => descobertaGentil(registros ?? []), [registros]);

  const cabecalho = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <View style={{ flex: 1 }}>
        <Texto variante="titulo">Seus registros</Texto>
        <Texto cor="textoSuave">Acompanhe seu ritmo de autocuidado</Texto>
      </View>
      <Botao titulo="Exportar" tipo="secundario" icone="tray-arrow-down" onPress={() => router.push('/relatorio')} dica="Abre o relatório em PDF" style={{ marginTop: 0 }} />
    </View>
  );

  if (registros === null) {
    return <Tela>{cabecalho}{erro ? <Mensagem texto={erro} /> : <Carregando texto="Abrindo seu histórico..." />}</Tela>;
  }

  if (dias.length === 0) {
    return (
      <Tela>
        {cabecalho}
        <Mensagem texto={erro} />
        <Cartao style={{ alignItems: 'center', gap: 10 }}>
          <IconeRedondo nome="notebook-edit-outline" diametro={64} tamanho={30} />
          <Texto centro cor="textoSuave">Nenhum registro nos últimos 60 dias. Que tal começar agora? Leva menos de um minuto.</Texto>
          <Botao titulo="Registrar como estou" icone="plus" onPress={() => router.push('/registrar')} />
        </Cartao>
      </Tela>
    );
  }

  const ultimaHora = [...doDia].sort((a, b) => b.hora.localeCompare(a.hora))[0]?.hora;

  const graficoEResumo = (
    <>
      <Cartao>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icone nome="circle" tamanho={12} cor="primaria" />
            <Texto variante="subtitulo">Curva do dia</Texto>
          </View>
          {ultimaHora ? <Etiqueta texto={`Atualizado ${ultimaHora}`} /> : null}
        </View>
        <CurvaDia registros={doDia} />
      </Cartao>

      <Cartao tom="forte">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <IconeRedondo nome="chart-timeline-variant-shimmer" fundo="fundo" cor="primaria" />
          <Texto variante="subtitulo">Resumo do dia</Texto>
        </View>
        <LinhaResumo icone="check-circle-outline">
          <Texto negrito>{resumo.total} {resumo.total === 1 ? 'registro' : 'registros'}</Texto> {dia === dataISO() ? 'realizados hoje' : 'neste dia'}
        </LinhaResumo>
        {resumo.humorMaisFrequente ? (
          <LinhaResumo icone={resumo.humorMaisFrequente.icone}>
            Humor mais frequente: <Texto negrito>{resumo.humorMaisFrequente.rotulo}</Texto>
          </LinhaResumo>
        ) : null}
        <LinhaResumo icone="tag-outline">
          Contexto mais marcado: <Texto negrito>{resumo.contextoMaisMarcado ?? 'nenhum'}</Texto>
        </LinhaResumo>

        {descoberta ? (
          <Cartao tom="menta" style={{ flexDirection: 'row', gap: 14, marginBottom: 0, marginTop: 6, borderRadius: 20 }}>
            <IconeRedondo nome="lightbulb-on-outline" fundo="verde" cor="menta" />
            <View style={{ flex: 1 }}>
              <Texto peso="seminegrito" cor="sobreMenta">Gentil descoberta</Texto>
              <Texto cor="sobreMenta">{descoberta.texto}</Texto>
            </View>
          </Cartao>
        ) : (
          <Texto variante="pequeno" cor="textoSuave" style={{ marginTop: 4 }}>
            Com mais registros marcando o contexto, aparece aqui uma descoberta sobre o que costuma te ajudar.
          </Texto>
        )}
      </Cartao>
    </>
  );

  const lista = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: larga ? 0 : 8 }}>
        <Texto variante="subtitulo">Registros do dia</Texto>
        <Texto variante="pequeno" cor="textoSuave">Mais recentes primeiro</Texto>
      </View>
      {doDia.map((r) => (
        <CartaoRegistro key={r.id} registro={r} onPress={() => router.push(`/registro/${r.id}`)} />
      ))}
    </View>
  );

  return (
    <Tela>
      {cabecalho}
      <Mensagem texto={erro} />
      <SeletorDia dias={dias} selecionado={dia} aoEscolher={setDiaEscolhido} quantidade={doDia.length} />
      {larga ? (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.2 }}>{graficoEResumo}</View>
          <View style={{ flex: 1 }}>{lista}</View>
        </View>
      ) : (
        <>
          {graficoEResumo}
          {lista}
        </>
      )}
    </Tela>
  );
}
