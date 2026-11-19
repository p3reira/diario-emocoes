// CRUD: criar registro. Depois de salvar, o formulário volta ao início e aparece
// um aviso com "Desfazer" por alguns segundos (apaga o registro recém-criado).
import { useEffect, useRef, useState } from 'react';
import { FormRegistro } from '../../componentes/diario';
import { AvisoFlutuante, Tela } from '../../componentes/ui';
import { criarRegistro, excluirRegistro } from '../../servicos/api';

const TEMPO_AVISO_MS = 6000;

export default function TelaRegistrar() {
  // Mudar a "chave" recria o formulário do zero (limpa todos os campos).
  const [chaveFormulario, setChaveFormulario] = useState(0);
  const [aviso, setAviso] = useState(null); // { texto, idParaDesfazer }
  const cronometro = useRef(null);

  // Ao sair da tela, cancela o cronômetro do aviso.
  useEffect(() => () => clearTimeout(cronometro.current), []);

  function mostrarAviso(novoAviso) {
    clearTimeout(cronometro.current);
    setAviso(novoAviso);
    cronometro.current = setTimeout(() => setAviso(null), TEMPO_AVISO_MS);
  }

  async function salvar(dados) {
    const registro = await criarRegistro(dados);
    setChaveFormulario((n) => n + 1);
    mostrarAviso({ texto: 'Registro salvo. Você está se cuidando hoje 💜', idParaDesfazer: registro.id });
  }

  async function desfazer() {
    const id = aviso?.idParaDesfazer;
    if (!id) return;
    try {
      await excluirRegistro(id);
      mostrarAviso({ texto: 'Registro desfeito.' });
    } catch (e) {
      mostrarAviso({ texto: e.message });
    }
  }

  return (
    <Tela>
      <FormRegistro key={chaveFormulario} aoSalvar={salvar} />
      <AvisoFlutuante
        visivel={aviso !== null}
        texto={aviso?.texto}
        acao={aviso?.idParaDesfazer ? 'Desfazer' : null}
        aoAgir={desfazer}
      />
    </Tela>
  );
}
