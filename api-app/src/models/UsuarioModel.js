const db = require('../config/database')

// Todas as colunas, menos a senha. É isso que sai nas respostas da API.
const COLUNAS_PUBLICAS = `id, nome, sobrenome, email, usuario, ativo, consentimento_em,
    tema, escala_fonte::float AS escala_fonte, lembrete_hora, lembrete_personalizado, criado_em, alterado_em`

// Mantém o código do erro do PostgreSQL (ex.: 23505 = valor repetido)
// para o controlador conseguir tratar e-mail/usuário duplicado.
const relancar = (mensagem, error) => {
    const erro = new Error(`${mensagem}: ${error.message}`)
    erro.code = error.code
    erro.constraint = error.constraint
    return erro
}

// Não existe "listar todos os usuários": pela LGPD, cada pessoa só enxerga
// a própria conta. Todo método recebe o id que vem do token.
class UsuarioModel {

    static async buscarPorId(id) {
        try {
            const result = await db.query(`SELECT ${COLUNAS_PUBLICAS} FROM usuarios WHERE id = $1`, [id])
            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao buscar usuário', error)
        }
    }

    // Único método que devolve a senha (o hash), porque o login precisa conferir.
    // O controlador remove a senha antes de responder.
    // Só o hash da senha, para a reautenticação (utils/reautenticacao.js).
    static async buscarHashSenha(id) {
        try {
            const result = await db.query('SELECT senha FROM usuarios WHERE id = $1', [id])
            return result.rows[0]?.senha || null
        } catch (error) {
            throw relancar('Erro ao conferir a senha', error)
        }
    }

    static async buscarParaLogin(login) {
        try {
            const result = await db.query(
                'SELECT * FROM usuarios WHERE email = $1 OR usuario = $1 LIMIT 1',
                [login]
            )
            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao buscar usuário para login', error)
        }
    }

    static async criar({ nome, sobrenome, email, usuario, senha }) {
        try {
            const result = await db.query(
                `INSERT INTO usuarios (nome, sobrenome, email, usuario, senha)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING ${COLUNAS_PUBLICAS}`,
                [nome, sobrenome, email, usuario, senha]
            )
            return result.rows[0]
        } catch (error) {
            throw relancar('Erro ao criar usuário', error)
        }
    }

    // Campos não enviados chegam como undefined, viram NULL
    // e o COALESCE mantém o valor que já estava no banco.
    static async atualizar(id, { nome, sobrenome, email, usuario, senha }) {
        try {
            const result = await db.query(
                `UPDATE usuarios
                 SET nome        = COALESCE($1, nome),
                     sobrenome   = COALESCE($2, sobrenome),
                     email       = COALESCE($3, email),
                     usuario     = COALESCE($4, usuario),
                     senha       = COALESCE($5, senha),
                     alterado_em = CURRENT_TIMESTAMP
                 WHERE id = $6
                 RETURNING ${COLUNAS_PUBLICAS}`,
                [nome, sobrenome, email, usuario, senha, id]
            )
            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao atualizar usuário', error)
        }
    }

    // Grava a data do aceite só na primeira vez (o aceite original não é sobrescrito).
    static async registrarConsentimento(id) {
        try {
            const result = await db.query(
                `UPDATE usuarios
                 SET consentimento_em = COALESCE(consentimento_em, CURRENT_TIMESTAMP)
                 WHERE id = $1
                 RETURNING ${COLUNAS_PUBLICAS}`,
                [id]
            )
            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao registrar consentimento', error)
        }
    }

    // lembrete_hora aceita null de propósito (desligar o lembrete), por isso
    // usa um indicador separado em vez de COALESCE.
    static async atualizarPreferencias(id, { tema, escala_fonte, lembrete_hora, lembrete_personalizado }) {
        try {
            const mudaLembrete = lembrete_hora !== undefined
            const mudaPersonalizado = lembrete_personalizado !== undefined
            const result = await db.query(
                `UPDATE usuarios
                 SET tema          = COALESCE($1, tema),
                     escala_fonte  = COALESCE($2, escala_fonte),
                     lembrete_hora = CASE WHEN $3 THEN $4 ELSE lembrete_hora END,
                     lembrete_personalizado = CASE WHEN $5 THEN $6 ELSE lembrete_personalizado END,
                     alterado_em   = CURRENT_TIMESTAMP
                 WHERE id = $7
                 RETURNING ${COLUNAS_PUBLICAS}`,
                [tema, escala_fonte, mudaLembrete, mudaLembrete ? lembrete_hora : null,
                    mudaPersonalizado, mudaPersonalizado ? lembrete_personalizado : null, id]
            )
            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao salvar preferências', error)
        }
    }

    // Os registros somem junto (ON DELETE CASCADE no banco.sql).
    static async deletar(id) {
        try {
            const result = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id])
            return result.rowCount > 0
        } catch (error) {
            throw relancar('Erro ao excluir usuário', error)
        }
    }
}

module.exports = UsuarioModel
