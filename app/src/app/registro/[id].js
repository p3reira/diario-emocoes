// CRUD: consultar, alterar e excluir um registro.
// A API só devolve o registro se ele for do usuário do token (senão, 404).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FormRegistro, SeloHumor } from '../../componentes/diario';
import { Botao, Cartao, Carregando, Mensagem, Tela, Texto, confirmar } from '../../componentes/ui';
import { alterarRegistro, buscarRegistro, excluirRegistro } from '../../servicos/api';
import { diaDaSemana, formatarData, rotulo } from '../../util/diario';

function Linha({ titulo, valor }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Texto variante="pequeno" cor="textoSuave" negrito>{titulo}</Texto>
      <Texto>{valor}</Texto>
    </View>
  );
}

export default function TelaRegistro() {
  const { id } = useLocalSearchParams();
  const [registro, setRegistro] = useState(null);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    buscarRegistro(id).then(setRegistro).catch((e) => setErro(e.message));
  }, [id]);

  async function excluir() {
    if (!(await confirmar('Excluir este registro?', 'Ele será apagado para sempre.', 'Excluir'))) return;
    setExcluindo(true);
    try {
      await excluirRegistro(id);
      router.back();
    } catch (e) {
      setErro(e.message);
      setExcluindo(false);
    }
  }

  if (!registro) {
    return <Tela>{erro ? <Mensagem texto={erro} /> : <Carregando />}</Tela>;
  }

  if (editando) {
    return (
      <Tela>
        <FormRegistro
          inicial={registro}
          textoBotao="Salvar alterações"
          aoSalvar={async (dados) => {
            setRegistro(await alterarRegistro(id, dados));
            setEditando(false);
            setAviso('Registro alterado.');
          }}
        />
        <Botao titulo="Cancelar" tipo="secundario" onPress={() => setEditando(false)} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Mensagem texto={aviso} tipo="sucesso" />
      <Mensagem texto={erro} />
      <Cartao>
        <Texto cor="textoSuave">{diaDaSemana(registro.data)}, {formatarData(registro.data)}, às {registro.hora}</Texto>
        <View style={{ marginTop: 8 }}><SeloHumor valor={registro.humor} /></View>
        <Linha titulo="Emoções" valor={registro.emocoes.join(', ') || 'Nenhuma marcada'} />
        <Linha titulo="O que teve a ver com o humor" valor={registro.atividades.map(rotulo).join(', ') || 'Nada marcado'} />
        <Linha titulo="Anotação" valor={registro.nota || 'Sem anotação'} />
      </Cartao>
      {/* Editar entradas antigas permite rever como a percepção mudou (item 05 do guia) */}
      <Botao titulo="Alterar" icone="pencil-outline" onPress={() => { setAviso(''); setEditando(true); }} />
      <Botao titulo="Excluir" tipo="perigo" icone="delete-outline" onPress={excluir} carregando={excluindo} />
    </Tela>
  );
}
