// Curva do dia: gráfico do humor ao longo das horas, desenhado com react-native-svg.
// Eixo X = hora do registro; eixo Y = humor de 1 a 5 (rostos à esquerda).
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTema } from '../contexto/TemaContexto';
import { HUMORES, humorPorValor } from '../util/diario';
import { Icone, Texto } from './ui';

const ALTURA = 220;
const MARGEM_Y = 18;          // espaço em cima e embaixo dentro do gráfico
const LARGURA_EIXO = 36;      // coluna dos rostos

const minutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

// Curva suave que passa por todos os pontos sem "passar do ponto": entre dois
// registros, a linha nunca sobe ou desce além dos valores reais (curva monotônica,
// método de Fritsch-Carlson). Assim o gráfico não mostra um humor que ninguém registrou.
function caminhoSuave(pontos) {
  const n = pontos.length;
  if (n < 2) return '';
  const dx = [];
  const inclinacao = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pontos[i + 1].x - pontos[i].x);
    inclinacao.push((pontos[i + 1].y - pontos[i].y) / (dx[i] || 1));
  }
  // Tangente em cada ponto: zero quando a curva muda de direção (pico ou vale).
  const tangente = pontos.map((_, i) => {
    if (i === 0) return inclinacao[0];
    if (i === n - 1) return inclinacao[n - 2];
    const a = inclinacao[i - 1];
    const b = inclinacao[i];
    if (a * b <= 0) return 0;
    return (2 * a * b) / (a + b);
  });
  let d = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const terco = dx[i] / 3;
    d += ` C ${p1.x + terco} ${p1.y + tangente[i] * terco}, ${p2.x - terco} ${p2.y - tangente[i + 1] * terco}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * @param {{ registros: { hora: string, humor: number }[] }} props  registros de UM dia
 */
export function CurvaDia({ registros }) {
  const { cores } = useTema();
  const [largura, setLargura] = useState(0);

  // Ordem cronológica (a API devolve do mais novo para o mais antigo).
  const doDia = [...registros].sort((a, b) => minutos(a.hora) - minutos(b.hora));
  const larguraGrafico = Math.max(0, largura - LARGURA_EIXO);

  // Escala X: da primeira à última hora, com folga nas pontas.
  const inicio = minutos(doDia[0].hora);
  const fim = minutos(doDia[doDia.length - 1].hora);
  const folga = 24;
  const x = (hora) =>
    fim === inicio ? larguraGrafico / 2 : folga + ((minutos(hora) - inicio) / (fim - inicio)) * (larguraGrafico - folga * 2);
  // Escala Y: humor 5 em cima, humor 1 embaixo.
  const y = (humor) => MARGEM_Y + ((5 - humor) / 4) * (ALTURA - MARGEM_Y * 2);

  const pontos = doDia.map((r) => ({ id: r.id, x: x(r.hora), y: y(r.humor), humor: r.humor, hora: r.hora }));
  const linha = caminhoSuave(pontos);
  const area = pontos.length > 1
    ? `${linha} L ${pontos[pontos.length - 1].x} ${ALTURA} L ${pontos[0].x} ${ALTURA} Z`
    : '';

  // Rótulos de hora: um por horário (dois registros no mesmo minuto mostram um só)
  // e no máximo 5, para não encavalar.
  const horarios = pontos.filter((p, i) => i === 0 || p.hora !== pontos[i - 1].hora);
  const passo = Math.ceil(horarios.length / 5);
  const rotulosHora = horarios.filter((_, i) => i % passo === 0 || i === horarios.length - 1);

  const descricao = `Curva do dia: ${doDia.map((r) => `${r.hora}, ${humorPorValor(r.humor).rotulo}`).join('; ')}.`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricao}>
      <View style={{ flexDirection: 'row' }} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {/* Eixo Y: um rosto por nível de humor, sempre com cor e forma diferentes */}
        <View style={{ width: LARGURA_EIXO, height: ALTURA }}>
          {[...HUMORES].reverse().map((h) => (
            <View key={h.valor} style={{ position: 'absolute', top: y(h.valor) - 13, left: 0 }}>
              <Icone nome={h.icone} tamanho={26} cor={h.tom} />
            </View>
          ))}
        </View>

        {larguraGrafico > 0 ? (
          <Svg width={larguraGrafico} height={ALTURA}>
            <Defs>
              <LinearGradient id="preenchimento" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={cores.primaria} stopOpacity="0.28" />
                <Stop offset="1" stopColor={cores.primaria} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            {HUMORES.map((h) => (
              <Line key={h.valor} x1="0" x2={larguraGrafico} y1={y(h.valor)} y2={y(h.valor)} stroke={cores.borda} strokeWidth="1" />
            ))}

            {area ? <Path d={area} fill="url(#preenchimento)" /> : null}
            {linha ? <Path d={linha} stroke={cores.primaria} strokeWidth="4" fill="none" strokeLinecap="round" /> : null}

            {/* Pontos: dias bons (4 e 5) com anel verde, os outros com anel roxo */}
            {pontos.map((p) => {
              const bom = p.humor >= 4;
              return (
                <Circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  fill={bom ? cores.menta : cores.fundo}
                  stroke={bom ? cores.verde : cores.primaria}
                  strokeWidth="4"
                />
              );
            })}
          </Svg>
        ) : null}
      </View>

      {/* Eixo X: horas */}
      <View style={{ height: 24, marginLeft: LARGURA_EIXO, marginTop: 6 }}>
        {rotulosHora.map((p) => (
          <Texto
            key={`r-${p.hora}`}
            variante="pequeno"
            cor="textoSuave"
            style={{ position: 'absolute', left: Math.max(0, Math.min(p.x - 22, larguraGrafico - 44)), width: 44, textAlign: 'center' }}
          >
            {p.hora}
          </Texto>
        ))}
      </View>
    </View>
  );
}
