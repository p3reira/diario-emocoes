// Relatório em PDF a partir dos dados persistidos. Os registros vêm da API
// com o token, então o PDF só pode ter os dados do usuário logado.
import { useState } from 'react';
import { View } from 'react-native';
import { Botao, Cartao, Chip, Mensagem, Tela, Texto, Campo } from '../componentes/ui';
import { useSessao } from '../contexto/SessaoContexto';
import { listarRegistros } from '../servicos/api';
import { baixarPdf, montarHtmlRelatorio, resumirPeriodo } from '../servicos/arquivos';
import { dataBrParaISO, dataISO, diasAtras, formatarData, isoParaBr, mascaraData } from '../util/diario';

const ATALHOS = [
  ['Últimos 7 dias', 6],
  ['Últimos 30 dias', 29],
  ['Últimos 90 dias', 89],
];
const TUDO = 'tudo';

export default function TelaRelatorio() {
  const { usuario } = useSessao();
  // Datas digitadas como DD/MM/AAAA; "tudo" = todos os registros, sem filtro.
  const [deTexto, setDeTexto] = useState(isoParaBr(diasAtras(29)));
  const [ateTexto, setAteTexto] = useState(isoParaBr(dataISO()));
  const [todoPeriodo, setTodoPeriodo] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [gerando, setGerando] = useState(false);

  function escolherAtalho(dias) {
    setTodoPeriodo(dias === TUDO);
    if (dias !== TUDO) {
      setDeTexto(isoParaBr(diasAtras(dias)));
      setAteTexto(isoParaBr(dataISO()));
    }
  }

  async function gerar() {
    let de = null;
    let ate = null;
    if (!todoPeriodo) {
      de = dataBrParaISO(deTexto);
      ate = dataBrParaISO(ateTexto);
      if (!de || !ate) {
        setMensagem({ tipo: 'erro', texto: 'Confira as datas: use dia/mês/ano, por exemplo 01/11/2026.' });
        return;
      }
      if (de > ate) {
        setMensagem({ tipo: 'erro', texto: 'A data de início precisa vir antes da data final.' });
        return;
      }
    }
    setGerando(true);
    setMensagem(null);
    try {
      const registros = await listarRegistros(todoPeriodo ? {} : { de, ate });
      if (todoPeriodo) {
        // Período real: do registro mais antigo até hoje.
        de = registros.reduce((menor, r) => (r.data < menor ? r.data : menor), dataISO());
        ate = dataISO();
      }
      setResumo({ ...resumirPeriodo(registros), de, ate });
      await baixarPdf(montarHtmlRelatorio({ usuario, registros, de, ate }), `relatorio-diario-${de}-a-${ate}.pdf`);
      setMensagem({ tipo: 'sucesso', texto: 'Relatório pronto. Escolha onde salvar ou com quem compartilhar.' });
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message });
    } finally {
      setGerando(false);
    }
  }

  const atalhoMarcado = (dias) =>
    dias === TUDO ? todoPeriodo : !todoPeriodo && deTexto === isoParaBr(diasAtras(dias)) && ateTexto === isoParaBr(dataISO());

  return (
    <Tela>
      <Texto cor="textoSuave" style={{ marginBottom: 12 }}>
        O relatório traz o resumo e todos os seus registros do período. Pode ser útil para levar a uma consulta.
      </Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {[...ATALHOS, ['Todo o período', TUDO]].map(([rotulo, dias]) => (
          <Chip
            key={rotulo}
            rotulo={rotulo}
            icone={dias === TUDO ? 'calendar-multiple' : 'calendar-range'}
            selecionado={atalhoMarcado(dias)}
            onPress={() => escolherAtalho(dias)}
          />
        ))}
      </View>
      {todoPeriodo ? (
        <Texto cor="textoSuave" style={{ marginBottom: 12 }}>Todos os seus registros, do mais antigo até hoje.</Texto>
      ) : (
        <>
          <Campo rotulo="De" value={deTexto} onChangeText={(t) => setDeTexto(mascaraData(t))} placeholder="DD/MM/AAAA" maxLength={10} keyboardType="number-pad" />
          <Campo rotulo="Até" value={ateTexto} onChangeText={(t) => setAteTexto(mascaraData(t))} placeholder="DD/MM/AAAA" maxLength={10} keyboardType="number-pad" />
        </>
      )}

      <Mensagem texto={mensagem?.texto} tipo={mensagem?.tipo} />
      <Botao titulo="Gerar e baixar PDF" icone="file-pdf-box" onPress={gerar} carregando={gerando} />

      {resumo ? (
        <Cartao style={{ marginTop: 16 }}>
          <Texto variante="subtitulo">Resumo de {formatarData(resumo.de)} a {formatarData(resumo.ate)}</Texto>
          <Texto>Registros: {resumo.total}</Texto>
          {resumo.total ? <Texto>Humor médio: {resumo.media.toFixed(1)} de 5</Texto> : null}
        </Cartao>
      ) : null}
    </Tela>
  );
}
