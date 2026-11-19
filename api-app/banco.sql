-- Estrutura completa do banco do app Diário de Emoções (versão 2.3.3).
-- 1) Crie o banco:   CREATE DATABASE app_diario;
-- 2) Conecte nele e rode este script inteiro.
-- É o único script necessário: já cria tudo, inclusive a hora dos registros.
-- Pode ser rodado de novo sem apagar dados (IF NOT EXISTS).

-- Usuários --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id               SERIAL PRIMARY KEY,
    nome             VARCHAR(100) NOT NULL,
    sobrenome        VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    usuario          VARCHAR(30)  NOT NULL,
    senha            VARCHAR(255) NOT NULL,   -- hash do bcrypt, nunca a senha em texto
    ativo            BOOLEAN      NOT NULL DEFAULT TRUE,

    -- LGPD: momento em que o usuário aceitou o registro de dados sensíveis.
    -- NULL = ainda não aceitou, e a API recusa criar registros.
    consentimento_em TIMESTAMP    NULL,

    -- Personalização salva no servidor: vale em qualquer aparelho.
    tema             VARCHAR(10)  NOT NULL DEFAULT 'sistema'
                     CHECK (tema IN ('sistema', 'claro', 'escuro')),
    escala_fonte     NUMERIC(3,2) NOT NULL DEFAULT 1.00
                     CHECK (escala_fonte BETWEEN 0.80 AND 1.60),
    lembrete_hora    VARCHAR(5)   NULL,       -- 'HH:MM' ou NULL (sem lembrete)
    lembrete_personalizado VARCHAR(5) NULL,   -- horário criado pela pessoa, fica na lista mesmo sem estar ativo

    criado_em        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alterado_em      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Os nomes destas restrições são usados no controlador
    -- para devolver uma mensagem clara quando há repetição.
    CONSTRAINT usuarios_email_unico   UNIQUE (email),
    CONSTRAINT usuarios_usuario_unico UNIQUE (usuario)
);

-- Para quem já tinha o banco criado por uma versão anterior deste script:
-- acrescenta a coluna nova sem apagar nada (num banco vazio não faz nada).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lembrete_personalizado VARCHAR(5) NULL;

-- Registros do diário (entidade do domínio) ------------------------------
CREATE TABLE IF NOT EXISTS registros (
    id           SERIAL PRIMARY KEY,

    -- ON DELETE CASCADE: excluir a conta apaga todos os registros dela (LGPD).
    usuario_id   INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    data         DATE         NOT NULL DEFAULT CURRENT_DATE,
    hora         TIME         NOT NULL DEFAULT LOCALTIME,      -- hora do momento registrado (curva do dia)
    humor        SMALLINT     NOT NULL CHECK (humor BETWEEN 1 AND 5),  -- 1 muito mal ... 5 muito bem
    emocoes      TEXT[]       NOT NULL DEFAULT '{}',   -- ex.: {calma, ansiedade}
    atividades   TEXT[]       NOT NULL DEFAULT '{}',   -- ex.: {caminhada, música}
    nota         VARCHAR(2000) NULL,                   -- anotação pessoal, só a dona do registro vê

    criado_em    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alterado_em  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Todas as consultas filtram por usuário e ordenam por data.
CREATE INDEX IF NOT EXISTS registros_usuario_data ON registros (usuario_id, data DESC, hora DESC);
