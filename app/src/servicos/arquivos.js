// Relatório em PDF e exportação dos dados (LGPD).
// Os dados vêm da API com o token do usuário logado, então o relatório
// só pode conter os registros dessa pessoa.
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import { HUMORES, diaDaSemana, formatarData, humorPorValor } from '../util/diario';

// Escapa o texto do usuário antes de colocar no HTML (evita quebrar o layout).
const escapar = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function maisFrequentes(listas, limite = 5) {
  const contagem = new Map();
  for (const lista of listas) for (const item of lista) contagem.set(item, (contagem.get(item) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, limite);
}

export function resumirPeriodo(registros) {
  const total = registros.length;
  const media = total ? registros.reduce((soma, r) => soma + r.humor, 0) / total : 0;
  const porHumor = HUMORES.map((h) => ({ ...h, quantidade: registros.filter((r) => r.humor === h.valor).length }));
  return {
    total,
    media,
    porHumor,
    emocoes: maisFrequentes(registros.map((r) => r.emocoes)),
    atividades: maisFrequentes(registros.map((r) => r.atividades)),
  };
}

export function montarHtmlRelatorio({ usuario, registros, de, ate }) {
  const resumo = resumirPeriodo(registros);
  const geradoEm = new Date().toLocaleString('pt-BR');
  const lista = (itens) =>
    itens.length ? itens.map(([nome, vezes]) => `${escapar(nome)} (${vezes}x)`).join(', ') : 'nenhum registro';

  const linhas = [...registros]
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .map(
      (r) => `<tr>
        <td>${formatarData(r.data)} ${escapar(r.hora)}<br><small>${diaDaSemana(r.data)}</small></td>
        <td>${escapar(humorPorValor(r.humor).rotulo)} (${r.humor} de 5)</td>
        <td>${escapar(r.emocoes.join(', ')) || '-'}</td>
        <td>${escapar(r.atividades.join(', ')) || '-'}</td>
        <td>${escapar(r.nota) || '-'}</td>
      </tr>`
    )
    .join('');

  const barras = resumo.porHumor
    .map(
      (h) => `<tr><td>${escapar(h.rotulo)}</td><td>${h.quantidade}</td>
        <td><div style="background:#3b6e8f;height:12px;width:${resumo.total ? (h.quantidade / resumo.total) * 100 : 0}%"></div></td></tr>`
    )
    .join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>Relatório do diário</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2a37; margin: 32px; font-size: 12px; }
    h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 24px 0 8px; }
    .suave { color: #56606e; } table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d5d9df; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #e3eef5; } .resumo td { border: none; padding: 3px 6px; }
    .aviso { margin-top: 24px; padding: 10px; background: #f6f5f2; border-radius: 6px; }
  </style></head><body>
  <h1>Relatório do diário de emoções</h1>
  <p class="suave">${escapar(usuario.nome)} ${escapar(usuario.sobrenome)} · Período: ${formatarData(de)} a ${formatarData(ate)} · Gerado em ${geradoEm}</p>

  <h2>Resumo</h2>
  <p>Registros no período: <b>${resumo.total}</b>${resumo.total ? ` · Humor médio: <b>${resumo.media.toFixed(1)} de 5</b>` : ''}</p>
  <table class="resumo">${barras}</table>
  <p><b>Emoções mais registradas:</b> ${lista(resumo.emocoes)}</p>
  <p><b>Contextos mais marcados:</b> ${lista(resumo.atividades)}</p>

  <h2>Registros</h2>
  ${registros.length ? `<table><thead><tr><th>Data e hora</th><th>Humor</th><th>Emoções</th><th>Contexto</th><th>Anotação</th></tr></thead><tbody>${linhas}</tbody></table>` : '<p>Nenhum registro neste período.</p>'}

  <p class="aviso">Este relatório é um registro pessoal de acompanhamento. Ele não é diagnóstico nem substitui
  avaliação profissional. Se quiser, leve-o para conversar com um(a) profissional de saúde.
  Em sofrimento intenso, ligue para o CVV: 188 (24 horas, gratuito).</p>
  </body></html>`;
}

// No navegador, o expo-print imprime a PÁGINA INTEIRA do app e ignora o html.
// Por isso o relatório vai para um iframe escondido e só ele é impresso
// (na janela de impressão, a pessoa escolhe "Salvar como PDF").
function imprimirNaWeb(html, nomeArquivo) {
  return new Promise((resolver) => {
    const quadro = document.createElement('iframe');
    quadro.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
    quadro.title = nomeArquivo;
    quadro.onload = () => {
      quadro.contentWindow.focus();
      quadro.contentWindow.print();
      // O print() costuma bloquear até a janela fechar; o tempo é só uma folga.
      setTimeout(() => {
        quadro.remove();
        resolver();
      }, 1000);
    };
    quadro.srcdoc = html;
    document.body.appendChild(quadro);
  });
}

// No celular: gera o arquivo PDF e abre o menu para salvar ou compartilhar.
// No navegador: abre a janela de impressão só com o relatório.
export async function baixarPdf(html, nomeArquivo) {
  if (Platform.OS === 'web') {
    await imprimirNaWeb(html, nomeArquivo);
    return;
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este aparelho não permite salvar ou compartilhar o arquivo.');
  }
  // A4. Pedimos o PDF também em base64 para gravar nós mesmos o arquivo.
  const { base64 } = await Print.printToFileAsync({ html, width: 595, height: 842, base64: true });

  // No Android (principalmente no Expo Go), o expo-sharing recusa o arquivo na pasta
  // onde o expo-print salva ("Not allowed to read file under given URL"). Por isso
  // gravamos o PDF na pasta de cache do app, com um nome legível, e compartilhamos esse.
  apagarRelatoriosAntigos(); // sobra de alguma vez em que o app fechou no meio
  const base = nomeArquivo.replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '-');
  const nome = `${base.startsWith(PREFIXO_PDF) ? base : PREFIXO_PDF + base}.pdf`;
  const destino = new File(Paths.cache, nome);
  if (destino.exists) destino.delete();
  destino.create();
  await destino.write(base64, { encoding: 'base64' });

  try {
    await Sharing.shareAsync(destino.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: nomeArquivo });
  } finally {
    // Privacidade: a cópia não fica no celular. Espera um pouco antes de apagar,
    // porque alguns apps (WhatsApp, Drive) ainda leem o arquivo logo depois que o
    // menu de compartilhar fecha.
    setTimeout(() => apagarArquivo(destino), TEMPO_PARA_APAGAR_MS);
  }
}

const PREFIXO_PDF = 'relatorio-diario-';
const TEMPO_PARA_APAGAR_MS = 60 * 1000;

function apagarArquivo(arquivo) {
  try {
    if (arquivo.exists) arquivo.delete();
  } catch {
    // Se não der agora, apagarRelatoriosAntigos tenta de novo na próxima vez.
  }
}

// Apaga do cache qualquer relatório que tenha ficado para trás.
export function apagarRelatoriosAntigos() {
  if (Platform.OS === 'web') return;
  try {
    for (const item of Paths.cache.list()) {
      if (item instanceof File && item.name.startsWith(PREFIXO_PDF) && item.name.endsWith('.pdf')) {
        apagarArquivo(item);
      }
    }
  } catch {
    // Pasta indisponível: nada a fazer.
  }
}

// LGPD — portabilidade: entrega todos os dados em JSON.
export async function compartilharDados(dados) {
  const texto = JSON.stringify(dados, null, 2);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `meus-dados-diario-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: 'Meus dados do diário', message: texto });
}
