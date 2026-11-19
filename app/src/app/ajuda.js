// Canais de ajuda: acessível de qualquer lugar do app, inclusive sem login.
import { CartaoAjuda } from '../componentes/diario';
import { Cartao, Tela, Texto } from '../componentes/ui';

export default function TelaAjuda() {
  return (
    <Tela>
      <Texto variante="titulo">Você não está sozinho(a)</Texto>
      <Texto cor="textoSuave" style={{ marginBottom: 16 }}>
        Se estiver difícil agora, falar com alguém pode ajudar.
      </Texto>
      <CartaoAjuda />
      <Cartao>
        <Texto variante="subtitulo" style={{ marginBottom: 6 }}>Para acompanhamento</Texto>
        <Texto>
          Procure a Unidade Básica de Saúde (posto de saúde) do seu bairro: a equipe pode acolher e encaminhar você. O CAPS (Centro de Atenção Psicossocial) atende pessoas em sofrimento intenso ou persistente. Muitas universidades têm serviço-escola de psicologia gratuito ou de baixo custo.
        </Texto>
      </Cartao>
      <Texto variante="pequeno" cor="textoSuave">
        Este app é de apoio e acompanhamento e não substitui atendimento profissional.
      </Texto>
    </Tela>
  );
}
