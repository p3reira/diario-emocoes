// Cartão de abertura com o nome do app e os cinco humores (login e boas-vindas).
import { View } from 'react-native';
import { useTema } from '../contexto/TemaContexto';
import { HUMORES } from '../util/diario';
import { RostoHumor } from './diario';
import { Cartao, Icone, Texto } from './ui';

export function CartaoBoasVindas() {
  const { cores } = useTema();
  return (
    <Cartao style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: cores.chip, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 }}>
        <Icone nome="spa" tamanho={18} cor="primaria" />
        <Texto variante="pequeno" cor="textoSuave" peso="media">Espaço de Cuidado Pessoal</Texto>
      </View>
      <Texto variante="grande" centro>Diário de Emoções</Texto>
      <Texto cor="textoSuave" centro style={{ marginBottom: 18 }}>Gentileza e atenção ao seu ritmo interior</Texto>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', backgroundColor: cores.fundo, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {HUMORES.map((h) => (
          <View key={h.valor} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
            <RostoHumor valor={h.valor} diametro={42} />
            <Texto variante="pequeno" cor="textoSuave" centro>{h.rotulo}</Texto>
          </View>
        ))}
      </View>
    </Cartao>
  );
}

