// INOVAÇÃO: "Kit para dias difíceis".
// O kit é montado aqui mesmo, no celular, a partir dos registros da própria pessoa
// (veja util/kit.js). Nada é enviado para fora do app.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { CartaoAjuda } from '../../componentes/diario';
import { Cartao, Carregando, Icone, Mensagem, Tela, Texto } from '../../componentes/ui';
import { useTema } from '../../contexto/TemaContexto';
import { listarRegistros } from '../../servicos/api';
import { montarKit } from '../../util/kit';

function Sugestao({ sugestao, indice }) {
  return (
    <Cartao>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 }}>
        <Texto variante="subtitulo" cor="primaria">{indice + 1}.</Texto>
        <Texto variante="subtitulo" style={{ flex: 1 }}>
          {sugestao.nome.charAt(0).toUpperCase() + sugestao.nome.slice(1)}
        </Texto>
      </View>
      <Texto variante="pequeno" cor="textoSuave" style={{ marginBottom: 8 }}>
        Apareceu em {sugestao.vezes} dos seus dias bons.
      </Texto>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icone nome="timer-outline" cor="primaria" tamanho={20} />
        <Texto style={{ flex: 1 }}>
          <Texto negrito>Versão de 5 minutos: </Texto>
          {sugestao.versaoCurta}
        </Texto>
      </View>
    </Cartao>
  );
}

function Tecnica({ tecnica }) {
  return (
    <Cartao tom="menta">
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 }}>
        <Icone nome="weather-windy" cor="primaria" />
        <Texto variante="subtitulo" style={{ flex: 1 }}>Técnica: {tecnica.titulo}</Texto>
      </View>
      <Texto cor="textoSuave" style={{ marginBottom: 8 }}>
        {tecnica.quando}
        {tecnica.emocao ? ` Escolhida porque seu último registro teve "${tecnica.emocao}".` : ''}
      </Texto>
      {tecnica.passos.map((passo, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
          <Texto negrito cor="primaria">{i + 1}.</Texto>
          <Texto style={{ flex: 1 }}>{passo}</Texto>
        </View>
      ))}
      <Texto variante="pequeno" cor="textoSuave" style={{ marginTop: 4 }}>
        Fonte: {tecnica.fonte}.
      </Texto>
    </Cartao>
  );
}

export default function TelaKit() {
  const { larga } = useTema();
  const [kit, setKit] = useState(null);
  const [erro, setErro] = useState('');

  // Recalcula sempre que a aba ganha foco: um registro novo já muda o kit.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarRegistros()
        .then((registros) => ativo && (setKit(montarKit(registros)), setErro('')))
        .catch((e) => ativo && setErro(e.message));
      return () => {
        ativo = false;
      };
    }, [])
  );

  return (
    <Tela>
      <Texto variante="titulo">Kit para dias difíceis</Texto>
      <Texto cor="textoSuave" style={{ marginBottom: 16 }}>
        O que já funcionou nos seus dias bons, em versões pequenas para quando a energia estiver baixa.
      </Texto>

      <Mensagem texto={erro} />
      {kit === null && !erro ? <Carregando texto="Olhando seus dias bons..." /> : null}

      {kit ? (
        <View style={{ flexDirection: larga ? 'row' : 'column', gap: larga ? 16 : 0, alignItems: 'flex-start' }}>
          <View style={larga ? { flex: 1 } : { width: '100%' }}>
            <Texto variante="subtitulo" style={{ marginBottom: 10 }}>O que costuma te ajudar</Texto>
            {kit.sugestoes.length ? (
              kit.sugestoes.map((s, i) => <Sugestao key={s.nome} sugestao={s} indice={i} />)
            ) : (
              <Mensagem
                tipo="alerta"
                texto='Ainda não há contextos marcados em dias bons. Quando registrar "Bem" ou "Muito bem", marque o que teve a ver com o seu humor, e ele aparece aqui.'
              />
            )}
            <Tecnica tecnica={kit.tecnica} />
          </View>

          <View style={larga ? { flex: 1 } : { width: '100%' }}>
            {/* Transparência do algoritmo (item 55 do guia) */}
            <Cartao>
              <Texto variante="subtitulo" style={{ marginBottom: 6 }}>Como o kit é montado</Texto>
              <Texto style={{ marginBottom: 6 }}>
                O app olha os seus registros com humor "Bem" ou "Muito bem" ({kit.diasBons} até agora), conta o que mais aparece marcado neles (sono, amigos, exercício...) e sugere uma versão curta de cada um.
              </Texto>
              <Texto style={{ marginBottom: 6 }}>
                A técnica vem de um guia da OPAS/OMS e muda conforme as emoções do seu último registro.
              </Texto>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Icone nome="shield-check-outline" cor="sucessoTexto" />
                <Texto cor="sucessoTexto" style={{ flex: 1 }}>
                  Tudo é calculado no seu celular. Nenhum dado sai do app para montar o kit.
                </Texto>
              </View>
            </Cartao>
            <CartaoAjuda />
          </View>
        </View>
      ) : null}
    </Tela>
  );
}
