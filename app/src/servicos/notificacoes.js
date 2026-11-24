// Lembrete diário como notificação do celular (expo-notifications, notificação LOCAL:
// agendada no próprio aparelho, sem servidor de push e sem enviar dado para fora).
//
// Regra: avisar no horário escolhido só nos dias em que a pessoa ainda não registrou.
// Uma notificação "repetir todo dia" não sabe se já houve registro, então o app agenda
// uma notificação avulsa para cada um dos próximos 7 dias e pula hoje se já registrou.
// Sempre que o app abre, troca de aba ou salva um registro, a agenda é refeita.
//
// Privacidade: o texto da notificação é genérico (aparece na tela bloqueada) e nunca
// mostra humor, emoções ou anotações.
import { LogBox, Platform } from 'react-native';

const DIAS_AGENDADOS = 7;
const CANAL = 'lembrete-diario';
const CONTEUDO = {
  title: 'Diário de Emoções',
  body: 'Como você está agora? Um toque já registra.',
  data: { abrir: '/registrar' },
};

// No Expo Go o pacote avisa que push remoto não funciona lá. Aqui só usamos
// notificação local, que funciona; o aviso é escondido para não confundir.
LogBox.ignoreLogs(['`expo-notifications` functionality is not fully supported in Expo Go']);

let modulo = null;
function notificacoes() {
  if (Platform.OS === 'web') return null; // navegador: fica só o aviso dentro do app
  if (!modulo) {
    // Carregado sob demanda, depois do ignoreLogs acima.
    // eslint-disable-next-line global-require
    modulo = require('expo-notifications');
    modulo.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return modulo;
}

// Pede permissão (Android 13+ e iOS perguntam). Devolve 'ok', 'negado' ou 'indisponivel'.
export async function pedirPermissao() {
  const N = notificacoes();
  if (!N) return 'indisponivel';
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CANAL, {
        name: 'Lembrete diário',
        importance: N.AndroidImportance.DEFAULT,
      });
    }
    let { status } = await N.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await N.requestPermissionsAsync());
    return status === 'granted' ? 'ok' : 'negado';
  } catch {
    return 'indisponivel';
  }
}

export async function cancelarLembretes() {
  const N = notificacoes();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    // nada a fazer
  }
}

// hora = 'HH:MM' ou null (desligado); registrouHoje = já existe registro hoje?
export async function agendarLembretes({ hora, registrouHoje }) {
  const N = notificacoes();
  if (!N) return 'indisponivel';
  await cancelarLembretes();
  if (!hora) return 'ok';

  const permissao = await pedirPermissao();
  if (permissao !== 'ok') return permissao;

  const [h, m] = hora.split(':').map(Number);
  const agora = new Date();
  try {
    for (let d = 0; d < DIAS_AGENDADOS; d++) {
      const quando = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + d, h, m, 0);
      if (d === 0 && (registrouHoje || quando <= agora)) continue; // hoje já registrou ou já passou
      await N.scheduleNotificationAsync({
        content: CONTEUDO,
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: quando, channelId: CANAL },
      });
    }
    return 'ok';
  } catch {
    return 'indisponivel';
  }
}

// Tocar na notificação abre o Registrar. Devolve a função que remove o ouvinte.
export function aoTocarNaNotificacao(acao) {
  const N = notificacoes();
  if (!N) return () => {};
  const assinatura = N.addNotificationResponseReceivedListener((resposta) => {
    acao(resposta.notification.request.content.data?.abrir ?? '/registrar');
  });
  return () => assinatura.remove();
}
