// Boas-vindas e consentimento (LGPD): aparece depois do login enquanto a pessoa
// não tiver aceitado. A API também recusa registros sem consentimento.
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CartaoBoasVindas } from '../componentes/boasVindas';
import { Botao, Cartao, Icone, IconeRedondo, Mensagem, Tela, Texto } from '../componentes/ui';
import { useSessao } from '../contexto/SessaoContexto';
import { useTema } from '../contexto/TemaContexto';
import { darConsentimento } from '../servicos/api';

function Item({ children }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
      <IconeRedondo nome="check" tamanho={18} cor="sobreMenta" fundo="menta" diametro={32} />
      <Texto style={{ flex: 1 }}>{children}</Texto>
    </View>
  );
}

export default function TelaConsentimento() {
  const { atualizarUsuario, sair } = useSessao();
  const { cores } = useTema();
  const [concordo, setConcordo] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aceitar() {
    setCarregando(true);
    setErro('');
    try {
      atualizarUsuario(await darConsentimento());
      router.replace('/inicio');
    } catch (e) {
      setErro(e.message);
      setCarregando(false);
    }
  }

  return (
    <Tela style={{ paddingTop: 40 }}>
      <CartaoBoasVindas />

      <Texto variante="titulo" peso="seminegrito" style={{ marginTop: 8 }}>Boas-vindas</Texto>
      <Texto cor="textoSuave" style={{ marginBottom: 18 }}>
        Um espaço seguro para acompanhar como seu sono, seus estudos e sua rotina influenciam o que você sente a cada dia.
      </Texto>

      <Cartao>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <IconeRedondo nome="shield-lock-outline" cor="menta" fundo="verde" diametro={52} />
          <View style={{ flex: 1 }}>
            <Texto variante="subtitulo">Seus dados são seus</Texto>
            <Texto variante="pequeno" cor="textoSuave">Privacidade simples e transparente</Texto>
          </View>
        </View>
        <Texto style={{ marginBottom: 12 }}>
          Humor e emoções são <Texto negrito>dados pessoais sensíveis</Texto> pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Por isso, antes do primeiro registro:
        </Texto>
        <Item>Os registros ficam guardados com segurança na sua conta, protegidos pela sua senha, e servem só para o seu histórico, seus relatórios e o seu Kit.</Item>
        <Item>Ninguém mais vê seus dados: eles não são vendidos nem enviados a outras empresas ou a serviços de inteligência artificial.</Item>
        <Item>Você pode exportar seus registros quando quiser.</Item>
        <Item>Você pode excluir tudo a qualquer momento, inclusive a conta.</Item>
        <Texto variante="pequeno" cor="textoSuave" style={{ marginBottom: 6 }}>
          O app é de apoio e acompanhamento: não faz diagnóstico e não substitui atendimento profissional.
        </Texto>

        <Link href="/privacidade" asChild>
          <Pressable
            accessibilityRole="link"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, marginHorizontal: -20, marginBottom: -20, padding: 20, backgroundColor: cores.cartaoForte, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
          >
            <Icone nome="file-document-outline" cor="primaria" />
            <View style={{ flex: 1 }}>
              <Texto peso="seminegrito" cor="primaria">Ler política de privacidade</Texto>
              <Texto variante="pequeno" cor="textoSuave">Texto curto, direto e sem juridiquês</Texto>
            </View>
            <Icone nome="arrow-right" cor="textoSuave" />
          </Pressable>
        </Link>
      </Cartao>

      <Pressable
        onPress={() => setConcordo(!concordo)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: concordo }}
        accessibilityLabel="Concordo com o registro dos meus dados de humor para essas finalidades"
        style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 12 }}
      >
        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: concordo ? cores.primaria : cores.chip, alignItems: 'center', justifyContent: 'center', borderWidth: concordo ? 0 : 1.5, borderColor: cores.borda }}>
          {concordo ? <Icone nome="check" tamanho={20} cor="sobrePrimaria" /> : null}
        </View>
        <Texto style={{ flex: 1 }}>Concordo com o registro dos meus dados de humor para essas finalidades</Texto>
      </Pressable>

      <Mensagem texto={erro} />
      <Botao titulo="Continuar" icone="arrow-right" onPress={aceitar} desativado={!concordo} carregando={carregando} />
      <Botao titulo="Não concordo (sair)" tipo="secundario" onPress={() => sair()} />
      <Texto variante="pequeno" cor="textoSuave" centro style={{ marginTop: 16 }}>
        O lembrete diário é opcional e pode ser ligado ou desligado depois em Ajustes.
      </Texto>
    </Tela>
  );
}
