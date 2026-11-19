// Navegação por abas na parte de baixo, com 5 destinos (item 81 do guia:
// navegação inferior com até cinco destinos, previsível e sempre visível).
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cabecalho } from '../../componentes/ui';
import { useSessao } from '../../contexto/SessaoContexto';
import { FONTES, useTema } from '../../contexto/TemaContexto';
import { listarRegistros } from '../../servicos/api';
import { dataISO, horaJaPassou } from '../../util/diario';

// [arquivo, nome na aba, título do cabeçalho, ícone]
const ABAS = [
  ['inicio', 'Início', 'Início', 'home-outline'],
  ['registrar', 'Registrar', 'Novo registro', 'playlist-edit'],
  ['registros', 'Registros', 'Histórico', 'creation'],
  ['kit', 'Meu kit', 'Meu kit', 'lifebuoy'],
  ['conta', 'Ajustes', 'Ajustes', 'cog-outline'],
];

export default function LayoutAbas() {
  const { usuario } = useSessao();
  const { cores, fonte, escala } = useTema();
  const margens = useSafeAreaInsets();

  // Sino do cabeçalho: ganha um ponto quando o horário do lembrete já passou e
  // ainda não há registro hoje. Confere de novo a cada troca de aba.
  const [lembretePendente, setLembretePendente] = useState(false);
  const conferirLembrete = useCallback(async () => {
    if (!usuario?.lembrete_hora || !horaJaPassou(usuario.lembrete_hora)) {
      setLembretePendente(false);
      return;
    }
    try {
      const hoje = dataISO();
      const deHoje = await listarRegistros({ de: hoje, ate: hoje });
      setLembretePendente(Array.isArray(deHoje) && deHoje.length === 0);
    } catch {
      setLembretePendente(false); // sem conexão: não mostra aviso
    }
  }, [usuario?.lembrete_hora]);

  // Também confere de minuto em minuto (o horário pode passar com o app aberto
  // na mesma tela) e quando o app volta do segundo plano.
  useEffect(() => {
    conferirLembrete();
    const relogio = setInterval(conferirLembrete, 60 * 1000);
    const estado = AppState.addEventListener('change', (s) => s === 'active' && conferirLembrete());
    return () => {
      clearInterval(relogio);
      estado.remove();
    };
  }, [conferirLembrete]);

  // Segurança extra: sem consentimento, nada do diário é mostrado.
  if (usuario && !usuario.consentimento_em) return <Redirect href="/consentimento" />;

  return (
    <Tabs
      screenListeners={{ focus: conferirLembrete }}
      screenOptions={{
        header: ({ options }) => <Cabecalho titulo={options.headerTitle} lembretePendente={lembretePendente} />,
        tabBarActiveTintColor: cores.texto,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: {
          backgroundColor: cores.cartao,
          borderTopWidth: 0,
          height: 76 + margens.bottom,
          paddingTop: 8,
          paddingBottom: 8 + margens.bottom,
        },
        tabBarLabelStyle: { fontSize: fonte(12), fontFamily: FONTES.media, marginTop: 4 },
        // Nome sempre embaixo do ícone (em tela larga o padrão seria ao lado).
        tabBarLabelPosition: 'below-icon',
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      {ABAS.map(([nome, titulo, cabecalho, icone]) => (
        <Tabs.Screen
          key={nome}
          name={nome}
          options={{
            title: titulo,
            headerTitle: cabecalho,
            tabBarAccessibilityLabel: `Aba ${titulo}`,
            // Aba ativa: ícone dentro de uma pílula lilás, além da cor do texto.
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 60,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? cores.primariaSuave : 'transparent',
                }}
              >
                <MaterialCommunityIcons name={icone} size={Math.round(24 * Math.min(escala, 1.2))} color={focused ? cores.sobrePrimariaSuave : color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
