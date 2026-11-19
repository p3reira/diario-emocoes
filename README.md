# Diário de Emoções

App de **diário de emoções e autocuidado** (domínio Saúde Mental), feito em React Native para o Trabalho Final de Desenvolvimento de Aplicações para Dispositivos Móveis, UFPR Palotina.

A pessoa registra como está se sentindo, acompanha a curva do humor ao longo do dia, baixa um relatório em PDF e recebe um **Kit para dias difíceis**: o que funcionou nos próprios dias bons dela, em versões de 5 minutos, com uma técnica de autocuidado escolhida pela emoção do último registro. O app é de apoio e acompanhamento: não faz diagnóstico e não substitui atendimento profissional. Em crise, ligue **188 (CVV)**.

📄 **Documento completo do aplicativo (os 10 itens do trabalho): [DOCUMENTO.md](DOCUMENTO.md)**

## Estrutura

| Pasta | O que é |
|---|---|
| `api-app` | API do app: Node, Express e PostgreSQL (porta 3000) |
| `app` | Aplicativo: React Native com Expo |
| `prints` | Imagens das telas (dados fictícios) |

## Executar rápido

Precisa de: Node.js 20 ou mais novo, PostgreSQL e, no celular, o app Expo Go (opcional).

1. **Variáveis de ambiente:** copie os arquivos `.env` do ZIP da entrega para `api-app/` e `app/`. Cada pasta tem um `.env.exemplo` mostrando o que vai nele.
2. **Banco de dados** (o `banco.sql` é o único script e cria tudo):
   ```
   psql -U postgres -c "CREATE DATABASE app_diario"
   psql -U postgres -d app_diario -f api-app/banco.sql
   ```
3. **API do app:**
   ```
   cd api-app
   npm install
   npm run dev
   ```
4. **App** (em outro terminal):
   ```
   cd app
   npm install
   npx expo start
   ```
   Leia o QR code com o Expo Go, ou aperte `w` para abrir no navegador.

No celular, `EXPO_PUBLIC_API_URL` no `app/.env` precisa ter o **IP do computador** (ex.: `http://192.168.0.10:3000`), não `localhost`.

> HTTP só para desenvolvimento, na rede local. Em produção a API usaria **HTTPS** (detalhes no DOCUMENTO, seção 4.4).

Para gerar o APK e para todos os detalhes, veja o [DOCUMENTO.md](DOCUMENTO.md).

## Autor

Gustavo Pereira Rodrigues  (trabalho individual)
