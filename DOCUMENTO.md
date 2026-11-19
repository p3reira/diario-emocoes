# Diário de Emoções: documento do aplicativo

Trabalho Final de **Desenvolvimento de Aplicações para Dispositivos Móveis**, UFPR, Setor Palotina.
Professor: Anderson da Silva Marcolino.

**Autor (trabalho individual):** Gustavo Pereira Rodrigues

Este é o documento do aplicativo exigido na Seção 3 do enunciado, com os dez itens na ordem pedida.
O [README](README.md) traz só a apresentação e a execução rápida.

O repositório tem duas partes:

| Pasta | O que é | Onde roda |
|---|---|---|
| `api-app` | API do aplicativo: usuários, login com token, CRUD dos registros, consentimento, preferências e exportação (Node + Express + PostgreSQL) | no computador, porta 3000 |
| `app` | Aplicativo em React Native (Expo + Expo Router) | celular (Expo Go ou APK) ou navegador |

---

## 1. Apresentação do aplicativo

**Tema:** diário de emoções e autocuidado, dentro do domínio de Saúde Mental.

**Público-alvo:** jovens e adultos, em especial estudantes universitários, que querem acompanhar o próprio humor e entender o que os ajuda nos dias bons. Justificativa: é um público que usa o celular todos os dias e passa por períodos de estresse (provas, trabalho e estudo ao mesmo tempo), e registrar o humor é uma prática simples e de baixo esforço.

**Caráter:** apoio e acompanhamento. O app **não faz diagnóstico, não indica tratamento e não substitui atendimento profissional**. Isso aparece no consentimento, na política de privacidade, na tela de ajuda e no relatório em PDF.

### Funcionalidades

| Funcionalidade | Tela | Por que existe |
|---|---|---|
| Cadastro e login | Login, Criar conta | Os dados são sensíveis e precisam ficar ligados a uma conta protegida por senha. |
| Aviso de dados sensíveis e consentimento | Boas-vindas | Exigência da LGPD para dados de saúde: a pessoa precisa saber o que é coletado e para quê **antes** do primeiro registro. A API também recusa registros sem consentimento. |
| Registrar humor (criar) | Registrar | Núcleo do app. Só o humor é obrigatório; contexto (sono, estudo, amigos...), emoções e anotação são opcionais para o registro levar menos de um minuto. Data e hora vêm preenchidas e podem ser trocadas para até 60 dias atrás (para o "esqueci de registrar ontem"); um momento futuro não é aceito, porque o diário guarda o que já foi sentido. Depois de salvar, um aviso permite **desfazer** por alguns segundos. |
| Histórico (listar e consultar) | Registros | Mostra um dia por vez: a **curva do dia** (humor ao longo das horas), o resumo do dia e os registros daquele dia. |
| Gentil descoberta | Registros | Compara a média de humor com e sem cada contexto e, quando há dados suficientes, mostra onde o humor costuma ficar melhor. Ajuda a pessoa a perceber padrões sem precisar interpretar gráficos. |
| Alterar e excluir registro | Registro | Completa o CRUD da entidade `registros`. Alterar permite corrigir ou rever um dia; excluir dá controle à pessoa. |
| Resumo dos últimos 7 dias | Início | Visão rápida para refletir sem precisar abrir o histórico. |
| **Kit para dias difíceis** (inovação) | Meu kit, Início | Transforma o que funcionou nos dias bons da pessoa em versões de 5 minutos e sugere uma técnica de autocuidado conforme a emoção do último registro. Ver item 9. |
| Relatório em PDF | Relatório em PDF | Resumo e registros de um período (7, 30 ou 90 dias, datas escolhidas ou todo o período), para guardar ou levar a uma consulta. |
| Tema, tamanho do texto e lembrete | Ajustes | Personalização e acessibilidade, salvas na conta. |
| Exportar, apagar registros, excluir conta | Ajustes, Meus dados | Direitos do titular previstos na LGPD. |
| Política de privacidade e Ajuda agora (CVV 188) | Abertas a todos | Precisam estar acessíveis mesmo sem login. |

---

## 2. Tecnologias e bibliotecas

### API do aplicativo (`api-app`)

| Biblioteca | Versão | Por que |
|---|---|---|
| Node.js | 20 ou mais novo | Mesmo ambiente usado nas aulas; JavaScript no app e na API. |
| express | 5.1 | Framework visto na disciplina; o Express 5 trata erros de funções assíncronas. |
| pg | 8.16 | Driver oficial do PostgreSQL, com consultas parametrizadas (evita SQL injection). |
| bcryptjs | 3.0 | Senhas guardadas com hash bcrypt (requisito de segurança). Versão em JavaScript puro, sem compilar nada no Windows. |
| jsonwebtoken | 9.0 | Autenticação por token JWT nas rotas restritas. |
| dotenv | 17.2 | Lê o `.env`, para que senhas e chaves não fiquem no código. |
| cors | 2.8 | Permite o app no navegador (Expo web) chamar a API. |
| PostgreSQL | 14 ou mais novo | Banco relacional usado na disciplina; o tipo `TEXT[]` guarda as listas de emoções e atividades de cada registro. |

### Aplicativo (`app`)

| Biblioteca | Versão | Por que |
|---|---|---|
| expo | ~58.0 | Ferramenta usada na disciplina; roda no Expo Go, no navegador e gera o APK. |
| react-native / react | 0.88 / 19.3 | Versões que acompanham o Expo SDK 58. |
| expo-router | ~58.0 | Navegação por arquivos (como nas aulas do To Do App), com `Stack.Protected` para separar telas de quem está logado e de quem não está. |
| react-native-screens / safe-area-context | 4.30 / 5.10 | Dependências do Expo Router; a área segura evita conteúdo embaixo da barra do sistema. |
| expo-print | ~58.0 | Gera o PDF do relatório a partir de HTML. |
| expo-sharing | ~58.0 | Abre o menu do celular para salvar ou compartilhar o PDF. |
| @expo/vector-icons | 15.0 | Ícones (rostos de humor, abas, contextos) que acompanham o texto. |
| react-native-svg | 15.16 | Desenha a curva do dia (linhas, área com degradê e pontos) com qualidade em qualquer tamanho de tela, sem biblioteca de gráficos pronta: o gráfico fica simples e explicável. |
| expo-font + @expo-google-fonts/plus-jakarta-sans | ~58.0 / 0.4 | Fonte Plus Jakarta Sans, arredondada e legível, que combina com o tom acolhedor do app. Um arquivo por peso, porque no Android o `fontWeight` não funciona com fontes carregadas. |
| expo-build-properties | ~58.0 | Libera conexão HTTP com a API na rede local no APK (o Android bloqueia por padrão). Só para desenvolvimento; em produção seria HTTPS (seção 4.4). |

---

## 3. Decisões arquiteturais

### App (`app/src`)

```
src/
├── app/            telas (rotas do Expo Router: cada arquivo é uma tela)
│   ├── _layout.js          provedores de estado + pilha com Stack.Protected
│   ├── index.js            entrada: redireciona para login, consentimento ou início
│   ├── login.js, cadastro.js, consentimento.js, privacidade.js, ajuda.js
│   ├── perfil.js, relatorio.js
│   ├── registro/[id].js    ver, alterar e excluir um registro
│   └── (abas)/             abas inferiores: inicio, registrar, registros, kit, conta (Ajustes)
├── componentes/    peças visuais reutilizadas (ui.js, diario.js, CurvaDia.js, boasVindas.js)
├── contexto/       estado global (SessaoContexto, TemaContexto)
├── servicos/       comunicação externa e arquivos (api.js, arquivos.js)
├── util/           regras sem tela: diario.js (datas, humores), kit.js (inovação) e resumo.js (resumo do dia e gentil descoberta)
└── config.js       endereço da API (lido do .env)
```

- **Telas × componentes:** as telas montam a página e cuidam do fluxo; o visual repetido (botão, campo, cartão, seletor de humor) fica em `componentes/`. Assim, uma mudança de estilo ou de acessibilidade vale para o app todo.
- **Comunicação com a API:** nenhuma tela chama `fetch`. Tudo passa por `servicos/api.js`, que cuida do endereço, do token e das mensagens de erro. Se a API mudar, só esse arquivo muda.
- **Regras separadas da interface:** a lógica do Kit (`util/kit.js`) e do resumo e da gentil descoberta (`util/resumo.js`) fica em funções puras, que recebem os registros e devolvem o resultado. Isso deixa as regras fáceis de testar e de explicar, e as telas só exibem o resultado.
- **Visual centralizado:** as cores (claras e escuras) e a fonte ficam no `TemaContexto`; o formato de botões, cartões e chips fica em `componentes/ui.js`. A paleta lilás com verde-menta foi trocada inteira mexendo praticamente só nesses dois arquivos.
- **Estado:** React Context, sem biblioteca extra. `SessaoContexto` guarda o usuário logado (com consentimento e preferências); `TemaContexto` calcula cores, tamanho da fonte e se a tela é larga. Escolhemos Context porque o estado global é pequeno; Redux seria complexidade sem ganho aqui.
- **Token só na memória:** a sessão não fica gravada no aparelho. Como o app guarda dados sensíveis, quem pegar o celular não entra sem a senha.

### API do app (`api-app`)

Camadas, como na API da disciplina: `routes` (endereços) → `middlewares` (token) → `controllers` (validação e resposta) → `models` (SQL). Cada camada tem uma responsabilidade, o que facilita achar e testar cada parte.

Decisão de segurança central: **não existe rota com o id de outro usuário**. A conta é sempre `/api/usuarios/eu`, e toda consulta de registros tem `usuario_id = <id do token>`. Um registro de outra pessoa simplesmente "não existe" (404).

---

## 4. Execução em ambiente de desenvolvimento

### 4.1 Programas

- [Node.js](https://nodejs.org) 20 ou mais novo
- [PostgreSQL](https://www.postgresql.org/download/) (anote a senha do usuário `postgres`)
- [Git](https://git-scm.com)
- No celular: app **Expo Go** (opcional; também roda no navegador)

### 4.2 Copiar o repositório e os arquivos do ZIP

```
git clone https://github.com/p3reira/diario-emocoes.git
cd diario-emocoes
```

Coloque cada arquivo do ZIP da entrega assim:

| Arquivo do ZIP | Vai para |
|---|---|
| `api-app.env` | `api-app/.env` |
| `app.env` | `app/.env` |

Cada pasta tem um `.env.exemplo` mostrando as variáveis.

### 4.3 Banco de dados

```
psql -U postgres -c "CREATE DATABASE app_diario"
psql -U postgres -d app_diario -f api-app/banco.sql
```

(No pgAdmin: crie o banco `app_diario`, abra o Query Tool nele e rode o conteúdo de `api-app/banco.sql`.)

O `banco.sql` é o único script: cria as duas tabelas completas num banco vazio.

### 4.4 Variáveis de ambiente

`api-app/.env`

| Variável | Exemplo | Para quê |
|---|---|---|
| `PORT` | `3000` | porta da API |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `5432`, `app_diario`, `postgres`, sua senha | conexão com o banco |
| `JWT_SECRET` | texto longo e aleatório | assina os tokens |

`app/.env`: `EXPO_PUBLIC_API_URL`. **No celular, `localhost` é o próprio celular**: use o IP do computador na rede Wi-Fi (no Windows, `ipconfig` → "Endereço IPv4"), por exemplo `http://192.168.0.10:3000`. Celular e computador precisam estar na mesma rede.

> **HTTP só em desenvolvimento.** Na rede local a API roda em `http://`, porque o computador não tem certificado. Por isso o APK libera HTTP (`usesCleartextTraffic` via `expo-build-properties`). Em produção, a API ficaria num servidor com **HTTPS**, `EXPO_PUBLIC_API_URL` passaria a ser `https://...` e a liberação de HTTP seria removida do `app.json`: sem criptografia, o token e os registros emocionais poderiam ser lidos por quem estivesse na mesma rede.

### 4.5 Rodar (um terminal para cada)

```
cd api-app
npm install
npm run dev
```

```
cd app
npm install
npx expo start     # leia o QR code com o Expo Go, ou aperte "w" para abrir no navegador
```

Teste rápido da API: arquivo `api-app/testes.http` (extensão REST Client do VS Code).

---

## 5. Geração do APK (produção)

1. Crie uma conta gratuita em https://expo.dev e entre: `npx eas-cli login`.
2. Em `app/eas.json`, perfil `preview`, troque `EXPO_PUBLIC_API_URL` pelo IP do computador que roda a `api-app`. (O `.env` não é enviado ao servidor de build, porque está no `.gitignore`; por isso o endereço vai no `eas.json`. Ele não é segredo.)
3. Na pasta `app`:
   ```
   npx eas-cli build -p android --profile preview
   ```
4. Ao terminar, o EAS mostra um link e um QR code para baixar o `.apk`. Instale no celular (permita "instalar apps desconhecidos").

O perfil `preview` usa `buildType: apk` para gerar um APK instalável direto, em vez do `.aab` da Play Store. O `expo-build-properties` libera HTTP para a API na rede local; isso vale só para o ambiente de desenvolvimento e teste (em produção, HTTPS, ver seção 4.4).

---

## 6. Requisitos de qualidade

| Qualidade | Medida | Justificativa |
|---|---|---|
| Facilidade de uso | Registro com um único campo obrigatório; seções curtas; navegação inferior com 5 abas fixas; aviso com "Desfazer" depois de salvar; mensagens de erro em linguagem simples | Registrar precisa ser rápido para virar hábito; a navegação previsível reduz a carga cognitiva. |
| Desempenho | Listagem filtrada por período no banco (índice `usuario_id, data, hora`); o histórico mostra um dia por vez; curva desenhada em SVG, sem biblioteca de gráficos pesada; Kit e resumo calculados no aparelho, sem chamada extra | Menos dados trafegando e telas que respondem rápido mesmo com muitos registros. |
| Manutenibilidade | Camadas separadas na API; telas sem `fetch`; regras do Kit em funções puras; componentes e cores centralizados | Cada mudança fica em um lugar só. |
| Confiabilidade | Validação de todos os campos na API (datas reais, humor de 1 a 5, limites de tamanho); o Kit não depende de serviço externo; confirmação antes de excluir | O app não pode perder ou corromper dados sensíveis, e a inovação funciona mesmo sem internet além da API do app. |

---

## 7. Segurança e proteção de dados (LGPD)

| Requisito | Onde | Justificativa |
|---|---|---|
| Senha criptografada | `api-app/src/controllers/UsuarioController.js` (bcrypt) | Nem quem acessa o banco consegue ler as senhas. O limite de 72 é conferido em bytes, porque o bcrypt ignora o que passa disso. |
| Limite de tentativas de login | `api-app/src/middlewares/limiteLogin.js` | Depois de 5 senhas erradas em 15 minutos (por IP e login), a API responde 429. Dificulta descobrir senhas por tentativa e erro; a mensagem não revela se a conta existe. |
| Transporte | `app/.env`, `app.json` | HTTP só no desenvolvimento, na rede local. Em produção a API usaria HTTPS e o app deixaria de aceitar HTTP (seção 4.4). |
| Token e rotas restritas | `api-app/src/middlewares/autenticacao.js`; rotas em `src/routes/` | Sem token válido, a API responde 401. |
| Cada usuário consulta, altera, exclui e exporta só os próprios dados | rotas `/api/usuarios/eu`; `RegistroModel.js` (todo SQL com `usuario_id`); telas Ajustes e Meus dados | Não existe rota que receba o id de outra pessoa. |
| Exportar os próprios dados | `GET /api/usuarios/eu/exportar`; aba Ajustes → "Exportar todos os meus dados" | Direito de portabilidade. |
| Chaves fora do repositório | `.gitignore` em cada pasta; `.env` entregue no ZIP | Uma chave no histórico do Git é considerada exposta. |
| Aviso e consentimento antes do 1º registro | tela `consentimento.js`; `POST /api/usuarios/eu/consentimento`; a API recusa registro sem consentimento (403) | O consentimento é obrigatório para dados sensíveis e não pode ser pulado nem pela API. |
| Política de privacidade | tela `privacidade.js` (aberta sem login, link no login, no cadastro, nas boas-vindas e nos Ajustes) | Linguagem simples: o que, para quê, onde e com quem (ninguém). |
| Excluir dados e conta | aba Ajustes; `DELETE /api/registros` e `DELETE /api/usuarios/eu` (`ON DELETE CASCADE`) | A exclusão da conta apaga tudo de verdade. |
| Nenhum envio de texto à IA | `app/src/util/kit.js`; seção "O Kit e a inteligência artificial" da política (`privacidade.js`) | O app não usa IA: o Kit é calculado no aparelho, e a política avisa que nenhum texto ou dado é enviado a serviços de IA ou a terceiros. |
| Nada guardado no celular | token só na memória; PDF gravado no cache e apagado logo depois de compartilhar (`app/src/servicos/arquivos.js`) | Confere com o que a política promete: ao fechar o app, nenhum dado do diário fica no aparelho. |
| Dados fictícios | prints em `prints/` e testes | Exigência do trabalho. |

---

## 8. Interface, IHC e UX

Guia usado: **TrackWell** (eduCAPES, https://educapes.capes.gov.br/handle/capes/1132272).

| Item do guia | Tela | Justificativa |
|---|---|---|
| 02: Revisitação objetiva | Início (últimos 7 dias), Registros (curva do dia e resumo), Relatório | Resumos visuais permitem rever o humor sem esforço. |
| 05: Reflexão transformativa | Registro (Alterar) | Editar um registro antigo permite rever como a percepção mudou. |
| 07: Eu qualitativo | Novo registro (Anotação) | Além do número, a pessoa pode escrever sobre o dia. |
| 08: Design personalizável | Ajustes (tema) | A pessoa escolhe a aparência que acha mais confortável. |
| 10: Controle e soberania dos dados | Ajustes, Registro | Editar, excluir e exportar, sempre com confirmação. |
| 15: Conformidade com privacidade | Boas-vindas | Os dados são pedidos no momento certo, com explicação simples. |
| 20: Padrões de acessibilidade | Todas | Rótulos para leitor de tela, contraste AA, fonte ajustável, toque de 48 px. |
| 24: Hábito e engajamento sustentável | Ajustes (lembrete), Início, sino do cabeçalho | A pessoa escolhe um horário pronto ou cria o próprio (que fica guardado, com visual diferente), e pode desligar. Se já registrou no dia, o cartão avisa que o lembrete não vai aparecer. Com o pontinho aceso, o sino leva direto para registrar. |
| 28: Segurança emocional | Todas | Paleta lilás e verde-menta, cantos bem arredondados, espaço em branco e mensagens acolhedoras ("Um momento para respirar e se acolher"). |
| 31: Suporte e ajuda | Ajuda agora, cartão do CVV | Ajuda a um toque, inclusive sem login. |
| 37: Mediação humana | Início (dia difícil), Ajuda, relatório | O app se apresenta como complemento ao cuidado profissional. |
| 44: Simplificação sequencial | Registrar | Registro em seções curtas (humor, contexto, emoções opcionais, anotação), com só o humor obrigatório. |
| 51: Política de privacidade transparente | Login, Cadastro, Boas-vindas, Ajustes | Política acessível no início e nas configurações. |
| 52: Interface estável e profissional | Todas | Navegação previsível, indicadores de carregamento e erros amigáveis. |
| 55: Transparência do algoritmo | Meu kit ("Como o kit é montado"), Registros (gentil descoberta) | A pessoa sabe de onde vêm as sugestões, e a descoberta diz exatamente o que foi comparado. |
| 56: Mitigar dano persuasivo | Ajustes, Registro, Registrar | Ações que não têm volta pedem confirmação; um registro salvo por engano pode ser desfeito. |
| 81: Interfaces simples | Abas | Navegação inferior com 5 destinos, com a aba ativa destacada por uma pílula. |
| 82: Menos esforço para registrar | Registrar | Rótulos de humor não clínicos, rostos grandes, data e hora já preenchidas e a aba Registrar sempre a um toque. |

### Responsividade
Com `useWindowDimensions`, o app sabe a largura e a orientação. Em telas largas ou deitadas (700 px ou mais), o Histórico mostra a **curva e o resumo à esquerda e a lista à direita**, e o Início, o Kit e os Ajustes ficam **lado a lado**; a curva do dia se redesenha na largura disponível. O conteúdo tem largura máxima para as linhas não ficarem longas. O `app.json` usa `orientation: default`, então o app gira. Justificativa: o app precisa funcionar em celulares pequenos, tablets e com o celular deitado. Prints: `prints/18-paisagem-historico.png`, `prints/19-paisagem-inicio.png` e `prints/20-paisagem-kit.png`.

### Sensibilidade ao contexto
O app se adapta ao **horário do dia** e ao **histórico de uso**:
- a saudação e o convite mudam (manhã, tarde, noite, madrugada; de madrugada, lembra do CVV);
- se o horário do lembrete já passou e não há registro hoje, aparece um aviso no Início e o sino do cabeçalho ganha um ponto (é um lembrete dentro do app, não uma notificação do sistema);
- se o último registro foi "Mal" ou "Muito mal", o Início oferece o Kit e os canais de ajuda;
- no Kit, a técnica de autocuidado muda conforme as emoções do último registro (ansiedade, raiva, tristeza, cansaço).

Justificativa: o convite certo na hora certa (item 60 do guia) e o apoio aparecendo justamente depois de um dia ruim.

### Personalização
Tema (igual ao celular, claro ou escuro), horário do lembrete e o horário criado pela pessoa, na aba Ajustes, **salvos na conta** (`PUT /api/usuarios/eu/preferencias`). Valem em qualquer aparelho e continuam depois de fechar o app.

### Acessibilidade (funcionalidade diferente da personalização)
- **Tamanho do texto ajustável** (90% a 150%), aplicado a todos os textos e ícones;
- **humor nunca só por cor:** sempre rosto + texto, inclusive no eixo da curva do dia; etiquetas selecionadas têm ✓;
- **gráfico com descrição:** a curva do dia tem um texto para leitor de tela com cada hora e humor;
- **leitor de tela:** `accessibilityLabel`, `accessibilityRole` e `accessibilityState` em botões, campos, abas e seletores;
- **áreas de toque** de pelo menos 48 px; **contraste** das cores pensado para o padrão AA.

---

## 9. Criatividade e inovação

### Aplicativos pesquisados

Pesquisa feita nas páginas oficiais das lojas e dos desenvolvedores, em novembro de 2026.

| App | Características observadas | Fonte |
|---|---|---|
| Daylio | Registro de humor e atividades com notas e fotos; estatísticas semanais, mensais e anuais que medem o impacto de cada atividade no humor; metas, lembretes e dados guardados no próprio celular | [App Store](https://apps.apple.com/app/id1194023242) |
| How We Feel | Check-in de emoções com vocabulário amplo (baseado no Mood Meter, da Universidade Yale); vídeos e atividades de estratégias para mudar para o estado desejado; padrões ao longo do tempo | [Yale School of Medicine](https://medicine.yale.edu/news-article/the-how-we-feel-app-helping-emotions-work-for-us-not-against-us/) |
| Wysa | Chatbot de IA para conversar; exercícios inspirados em TCC e DBT; meditações; acompanhamento do humor pelas conversas; coaching humano opcional | [Google Play](https://play.google.com/store/apps/details?id=bot.touchkin) |
| Cíngulo (brasileiro) | Sessões guiadas de autoconhecimento com técnicas para ansiedade, estresse e autoestima; testes periódicos; diário de altos e baixos; técnicas rápidas de SOS | [App Store](https://apps.apple.com/app/id1190110484) |

**Pontos comuns:** os apps de registro (Daylio) mostram estatísticas e deixam a interpretação e a ação com a pessoa; os apps de apoio (How We Feel, Wysa, Cíngulo) oferecem estratégias, conversas ou sessões de um catálogo geral, que não partem das atividades que já funcionaram para aquela pessoa.

### A inovação: Kit para dias difíceis
O app olha os registros em que a pessoa se sentiu **bem ou muito bem**, conta as atividades que mais aparecem e transforma cada uma numa **versão de 5 minutos**, pensada para um dia de pouca energia (por exemplo, "caminhada" vira "uma volta de 5 minutos, nem que seja até a esquina"). Junto, sugere uma **técnica de autocuidado** do guia *Faça o que importa em tempos de estresse* (OPAS/OMS), escolhida conforme as emoções do último registro: ancorar-se para ansiedade e medo, perceber e nomear para raiva, ser gentil consigo para tristeza e solidão, abrir espaço para cansaço. Quando o último registro é de um dia difícil, o Início oferece o kit junto com os canais de ajuda.

**Diferenças em relação aos apps pesquisados:**
- o Daylio também mede o impacto das atividades no humor, mas para na estatística; o Kit **transforma essa relação em ações pequenas e concretas**, em versões de 5 minutos para um dia de pouca energia;
- o How We Feel sugere estratégias de um catálogo conforme a emoção; aqui, além da técnica escolhida pela emoção registrada (com a fonte), o centro do kit são **as atividades da própria pessoa**;
- o kit **aparece no momento em que pode ajudar** (depois de um dia difícil), sem a pessoa precisar procurar;
- **privacidade por desenho:** tudo é calculado no celular, sem enviar dados a terceiros (regra em `app/src/util/kit.js`).

**Relevância:** em um dia difícil, lembrar do que já funcionou e ter energia para fazer exige o que a pessoa pode não ter. O kit traz essa lembrança pronta, baseada na experiência dela e numa versão que cabe no dia ruim.

**Contribuição da IA Generativa:** usei o assistente Claude (Anthropic) para analisar o enunciado e levantar ideias de tema. Ele sugeriu o diário de emoções com o Kit para dias difíceis e comparou a ideia com apps existentes, apontando que os apps de registro param nas estatísticas e os de apoio usam conteúdos gerais. Avaliei a proposta e conferi os apps citados nas páginas oficiais (tabela acima). Na primeira versão, o kit era montado por uma IA; quando a IA deixou de ser requisito, decidi calcular o kit no próprio aparelho, para ele não depender de serviço externo e não enviar dados de saúde a terceiros, e acrescentei as versões de 5 minutos e a técnica escolhida pela emoção registrada. Também usei o Claude para gerar e revisar partes do código e deste documento; testei o app e revisei o conteúdo antes da entrega.

---

## 10. Divisão do trabalho

Trabalho individual: todas as partes foram feitas pelo autor.

| Membro | Telas | Código do aplicativo (React Native) | Código da API e do banco de dados | Itens do documento |
|---|---|---|---|---|
| Gustavo Pereira Rodrigues | Todas as 13 telas | Todo o app (`app/`) | Toda a API (`api-app/`) e o `banco.sql` | Itens 1 a 10 |
