// Política de privacidade em linguagem simples (LGPD, itens 15 e 51 do guia).
// Aberta para todos: dá para ler antes de criar a conta.
import { Cartao, Tela, Texto } from '../componentes/ui';

const SECOES = [
  ['Quem somos', 'O Diário de Emoções é um trabalho acadêmico da disciplina de Desenvolvimento de Aplicações para Dispositivos Móveis da UFPR. É um app de apoio e acompanhamento: não faz diagnóstico, não indica tratamento e não substitui atendimento profissional.'],
  ['Quais dados coletamos', 'Para a conta: nome, sobrenome, e-mail, nome de usuário e senha (guardada criptografada, ninguém consegue lê-la). No diário: a data, o humor de 1 a 5, as emoções e atividades que você marca e as anotações que escreve. Também guardamos suas preferências (tema, tamanho da fonte, lembrete) e a data em que você aceitou esta política.'],
  ['Para que usamos', 'Só para o próprio app funcionar para você: mostrar seu histórico, gerar seu relatório em PDF, montar o seu Kit e lembrar suas preferências. Não usamos seus dados para propaganda.'],
  ['Onde ficam guardados', 'Em um banco de dados PostgreSQL no servidor do app. Cada pessoa só consegue ver, alterar e excluir os próprios dados: o servidor confere quem você é a cada pedido. No celular, nada fica salvo depois que o app é fechado. O PDF do relatório existe no aparelho só enquanto você salva ou compartilha e é apagado logo em seguida (o arquivo que você escolher guardar fica onde você mandou). Se você ligar o lembrete, o celular guarda só os horários dos próximos avisos, com um texto genérico que nunca mostra seu humor ou suas anotações; eles são apagados quando você desliga o lembrete, sai da conta ou a exclui.'],
  ['O Kit e a inteligência artificial', 'O Kit é montado no seu próprio celular, a partir dos seus registros. O app não usa inteligência artificial: nenhum texto, anotação ou dado seu é enviado a serviços de IA ou a qualquer outra empresa.'],
  ['Com quem compartilhamos', 'Com ninguém. Seus dados não são vendidos, divulgados nem repassados a terceiros.'],
  ['Seus direitos', 'Na aba Ajustes você pode, a qualquer momento: ver e corrigir seus dados, exportar tudo (arquivo JSON), apagar todos os registros e excluir a conta. Para apagar ou excluir, o app pede sua senha de novo, para garantir que é você. Ao excluir a conta, todos os registros são apagados junto, sem possibilidade de recuperação.'],
  ['Se você estiver em crise', 'O app não é um serviço de emergência. Ligue para o CVV (188, gratuito, 24 horas) ou para o SAMU (192), ou procure o pronto-socorro mais próximo.'],
];

export default function TelaPrivacidade() {
  return (
    <Tela>
      <Texto cor="textoSuave" style={{ marginBottom: 16 }}>
        Escrita de forma simples, sem juridiquês. Última atualização: novembro de 2026.
      </Texto>
      {SECOES.map(([titulo, texto]) => (
        <Cartao key={titulo}>
          <Texto variante="subtitulo" style={{ marginBottom: 6 }}>{titulo}</Texto>
          <Texto>{texto}</Texto>
        </Cartao>
      ))}
    </Tela>
  );
}
