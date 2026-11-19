// Layout raiz: provedores de estado e a pilha de telas.
// Stack.Protected esconde as telas do diário de quem não está logado
// (e as telas de login/cadastro de quem já está).
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessaoProvider, useSessao } from '../contexto/SessaoContexto';
import { FONTES, TemaProvider, useTema } from '../contexto/TemaContexto';
import { apagarRelatoriosAntigos } from '../servicos/arquivos';

function Pilha() {
  const { usuario } = useSessao();
  const { cores, modo, fonte } = useTema();
  const logado = usuario !== null;

  // Privacidade: ao abrir o app, apaga qualquer PDF de relatório que tenha sobrado.
  useEffect(() => apagarRelatoriosAntigos(), []);

  return (
    <>
      <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerTintColor: cores.primaria,
          headerTitleStyle: { color: cores.texto, fontSize: fonte(19), fontFamily: FONTES.negrito },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: cores.fundo },
          headerBackTitle: 'Voltar',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />

        <Stack.Protected guard={!logado}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
        </Stack.Protected>

        <Stack.Protected guard={logado}>
          <Stack.Screen name="(abas)" options={{ headerShown: false }} />
          <Stack.Screen name="consentimento" options={{ headerShown: false }} />
          <Stack.Screen name="registro/[id]" options={{ title: 'Registro' }} />
          <Stack.Screen name="relatorio" options={{ title: 'Relatório em PDF' }} />
          <Stack.Screen name="perfil" options={{ title: 'Meus dados' }} />
        </Stack.Protected>

        {/* Abertas para todos: a política e a ajuda precisam estar sempre acessíveis */}
        <Stack.Screen name="privacidade" options={{ title: 'Política de privacidade' }} />
        <Stack.Screen name="ajuda" options={{ title: 'Ajuda agora' }} />
      </Stack>
    </>
  );
}

export default function LayoutRaiz() {
  // Carrega a fonte antes de mostrar o app. Se falhar (sem internet na web, por
  // exemplo), o app abre mesmo assim com a fonte do sistema.
  const [fontesProntas, erroFontes] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  if (!fontesProntas && !erroFontes) return null;

  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <TemaProvider>
          <Pilha />
        </TemaProvider>
      </SessaoProvider>
    </SafeAreaProvider>
  );
}
