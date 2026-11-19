const db = require('../config/database')

// to_char devolve a data como 'AAAA-MM-DD'. Sem isso o driver pg converte DATE
// para Date no fuso do servidor, e a data pode "voltar" um dia no app.
const COLUNAS = `id, to_char(data, 'YYYY-MM-DD') AS data, to_char(hora, 'HH24:MI') AS hora,
    humor, emocoes, atividades, nota,
    criado_em, alterado_em`

// REGRA DE SEGURANÇA: toda consulta tem "usuario_id = <id do token>".
// Assim, mesmo que alguém troque o :id na URL, só alcança os próprios registros
// (um registro de outra pessoa simplesmente "não existe" para ele: 404).
class RegistroModel {

    // de/ate são opcionais ('AAAA-MM-DD'), usados no histórico e no relatório PDF.
    static async listar(usuarioId, { de, ate } = {}) {
        const condicoes = ['usuario_id = $1']
        const valores = [usuarioId]

        if (de) {
            valores.push(de)
            condicoes.push(`data >= $${valores.length}`)
        }
        if (ate) {
            valores.push(ate)
            condicoes.push(`data <= $${valores.length}`)
        }

        const result = await db.query(
            `SELECT ${COLUNAS} FROM registros
             WHERE ${condicoes.join(' AND ')}
             ORDER BY data DESC, hora DESC, id DESC`,
            valores
        )
        return result.rows
    }

    static async buscar(usuarioId, id) {
        const result = await db.query(
            `SELECT ${COLUNAS} FROM registros WHERE id = $1 AND usuario_id = $2`,
            [id, usuarioId]
        )
        return result.rows[0] || null
    }

    static async criar(usuarioId, { data, hora, humor, emocoes, atividades, nota }) {
        const result = await db.query(
            `INSERT INTO registros (usuario_id, data, hora, humor, emocoes, atividades, nota)
             VALUES ($1, COALESCE($2::date, CURRENT_DATE), COALESCE($3::time, LOCALTIME), $4, $5, $6, $7)
             RETURNING ${COLUNAS}`,
            [usuarioId, data ?? null, hora ?? null, humor, emocoes ?? [], atividades ?? [], nota ?? null]
        )
        return result.rows[0]
    }

    // Alteração parcial: só muda o que veio. "nota" pode ser apagada mandando null.
    static async atualizar(usuarioId, id, { data, hora, humor, emocoes, atividades, nota }) {
        const mudaNota = nota !== undefined
        const result = await db.query(
            `UPDATE registros
             SET data        = COALESCE($1::date, data),
                 hora        = COALESCE($2::time, hora),
                 humor       = COALESCE($3, humor),
                 emocoes     = COALESCE($4, emocoes),
                 atividades  = COALESCE($5, atividades),
                 nota        = CASE WHEN $6 THEN $7 ELSE nota END,
                 alterado_em = CURRENT_TIMESTAMP
             WHERE id = $8 AND usuario_id = $9
             RETURNING ${COLUNAS}`,
            [data ?? null, hora ?? null, humor ?? null, emocoes ?? null, atividades ?? null,
                mudaNota, mudaNota ? nota : null, id, usuarioId]
        )
        return result.rows[0] || null
    }

    static async excluir(usuarioId, id) {
        const result = await db.query(
            'DELETE FROM registros WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        )
        return result.rowCount > 0
    }

    // "Excluir todos os meus dados" sem excluir a conta.
    static async excluirTodos(usuarioId) {
        const result = await db.query('DELETE FROM registros WHERE usuario_id = $1', [usuarioId])
        return result.rowCount
    }
}

module.exports = RegistroModel
