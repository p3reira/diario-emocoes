// Janela de confirmação do próprio app.
// Substitui o window.confirm (que no navegador mostra a caixa feia "localhost diz...")
// e o Alert do celular: fica com as cores, a fonte e os botões do app, funciona igual
// no celular e no navegador e pode pedir a senha (reautenticação).
//
// Uso:  const confirmar = useConfirmacao();
//       const { confirmado, senha } = await confirmar({ titulo, mensagem, textoConfirmar, pedirSenha: true });
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useTema } from '../contexto/TemaContexto';
import { Botao, Campo, Icone, Texto } from './ui';

const ConfirmacaoContexto = createContext(null);

export function ConfirmacaoProvider({ children }) {
  const [pedido, setPedido] = useState(null); // { titulo, mensagem, textoConfirmar, perigo, pedirSenha }
  const [senha, setSenha] = useState('');
  const resolver = useRef(null);

  // Abre a janela e devolve uma Promise que só termina quando a pessoa escolhe.
  const confirmar = useCallback((opcoes) => {
    setSenha('');
    setPedido({ textoConfirmar: 'Confirmar', perigo: true, pedirSenha: false, ...opcoes });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function fechar(confirmado) {
    resolver.current?.({ confirmado, senha: confirmado ? senha : '' });
    resolver.current = null;
    setPedido(null);
    setSenha('');
  }

  return (
    <ConfirmacaoContexto.Provider value={confirmar}>
      {children}
      <JanelaConfirmacao pedido={pedido} senha={senha} setSenha={setSenha} aoFechar={fechar} />
    </ConfirmacaoContexto.Provider>
  );
}

export function useConfirmacao() {
  const confirmar = useContext(ConfirmacaoContexto);
  if (!confirmar) throw new Error('useConfirmacao precisa estar dentro do ConfirmacaoProvider');
  return confirmar;
}

function JanelaConfirmacao({ pedido, senha, setSenha, aoFechar }) {
  const { cores } = useTema();
  const aberta = pedido !== null;
  const faltaSenha = pedido?.pedirSenha && !senha;

  return (
    <Modal visible={aberta} transparent animationType="fade" onRequestClose={() => aoFechar(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Fundo escurecido: tocar fora cancela */}
        <Pressable
          onPress={() => aoFechar(false)}
          accessibilityLabel="Cancelar"
          style={{ flex: 1, backgroundColor: 'rgba(20, 18, 24, 0.55)', justifyContent: 'center', padding: 20 }}
        >
          {/* Cartão: tocar dentro não fecha */}
          <Pressable
            onPress={() => {}}
            accessibilityViewIsModal
            accessibilityRole="alert"
            style={{ backgroundColor: cores.fundo, borderRadius: 28, padding: 24, width: '100%', maxWidth: 440, alignSelf: 'center', gap: 12 }}
          >
            {pedido ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icone nome={pedido.perigo ? 'alert-circle-outline' : 'help-circle-outline'} tamanho={26} cor={pedido.perigo ? 'perigo' : 'primaria'} />
                  <Texto variante="subtitulo" peso="negrito" style={{ flex: 1 }}>{pedido.titulo}</Texto>
                </View>
                {pedido.mensagem ? <Texto cor="textoSuave">{pedido.mensagem}</Texto> : null}
                {pedido.pedirSenha ? (
                  <Campo
                    rotulo="Sua senha"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    autoCapitalize="none"
                    autoFocus
                    dica="Para confirmar que é você."
                    onSubmitEditing={() => !faltaSenha && aoFechar(true)}
                  />
                ) : null}
                <View style={{ gap: 4, marginTop: 4 }}>
                  <Botao
                    titulo={pedido.textoConfirmar}
                    tipo={pedido.perigo ? 'perigo' : 'primario'}
                    onPress={() => aoFechar(true)}
                    desativado={faltaSenha}
                  />
                  <Botao titulo="Cancelar" tipo="secundario" onPress={() => aoFechar(false)} />
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
