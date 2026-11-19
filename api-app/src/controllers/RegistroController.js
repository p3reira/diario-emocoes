const RegistroModel = require('../models/RegistroModel')
const UsuarioModel = require('../models/UsuarioModel')

const {
    responderRequisicaoInvalida,
    responderProibido,
    responderNaoEncontrado,
    responderErroInterno,
} = require('../utils/respostas')

const NOTA_MAXIMO = 2000
const ITENS_MAXIMO = 15         // emoções ou atividades por registro
const ITEM_MAXIMO = 40          // caracteres de cada emoção ou atividade

const DIAS_RETROATIVOS = 60    // registros retroativos aceitos
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/

// ID: inteiro positivo que cabe na coluna SERIAL (INTEGER) do PostgreSQL.
const MAIOR_ID = 2147483647
const ehIdValido = (id) => /^\d{1,10}$/.test(id) && Number(id) >= 1 && Number(id) <= MAIOR_ID

// Confere se a data existe de verdade (rejeita 2026-02-31, por exemplo).
const ehDataValida = (texto) => {
    if (typeof texto !== 'string' || !REGEX_DATA.test(texto)) return false
    const data = new Date(`${texto}T00:00:00Z`)
    return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(texto)
}

// Lista de textos curtos, sem repetição e sem itens vazios.
const normalizarLista = (valor, nome) => {
    if (!Array.isArray(valor)) {
        return { erro: `O campo "${nome}" deve ser uma lista de textos` }
    }
    const itens = [...new Set(
        valor
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim().toLowerCase())
            .filter((item) => item !== '')
    )]
    if (itens.length > ITENS_MAXIMO) {
        return { erro: `O campo "${nome}" aceita no máximo ${ITENS_MAXIMO} itens` }
    }
    if (itens.some((item) => item.length > ITEM_MAXIMO)) {
        return { erro: `Cada item de "${nome}" pode ter no máximo ${ITEM_MAXIMO} caracteres` }
    }
    return { itens }
}

// parcial = false (criar): humor é obrigatório.
// parcial = true (alterar): só valida o que veio.
const validarRegistro = (corpo, { parcial = false } = {}) => {
    const dados = {}
    const veio = (campo) => corpo[campo] !== undefined

    if (!parcial || veio('humor')) {
        const humor = Number(corpo.humor)
        if (!Number.isInteger(humor) || humor < 1 || humor > 5) {
            return { erro: 'O campo "humor" é obrigatório e deve ser um número inteiro de 1 a 5' }
        }
        dados.humor = humor
    }

    if (veio('data')) {
        if (!ehDataValida(corpo.data)) {
            return { erro: 'O campo "data" deve estar no formato AAAA-MM-DD' }
        }
        const hoje = new Date().toISOString().slice(0, 10)
        if (corpo.data > hoje) {
            return { erro: 'Aqui a gente guarda o que você já sentiu. Escolha hoje ou um dia que já passou.' }
        }
        // Novo registro: até 60 dias atrás (1 dia a mais de folga por fuso horário).
        // Na edição, a data antiga de um registro existente continua valendo.
        if (!parcial) {
            const limite = new Date(Date.now() - (DIAS_RETROATIVOS + 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            if (corpo.data < limite) {
                return { erro: `Dá para registrar até ${DIAS_RETROATIVOS} dias atrás.` }
            }
        }
        dados.data = corpo.data
    }

    if (veio('hora')) {
        if (typeof corpo.hora !== 'string' || !REGEX_HORA.test(corpo.hora)) {
            return { erro: 'O campo "hora" deve estar no formato HH:MM' }
        }
        dados.hora = corpo.hora
    }

    // Hoje, num horário que ainda não chegou? Usa o relógio do servidor com 5 min
    // de folga (diferença entre o relógio do celular e o do servidor). O app também
    // confere com o relógio do próprio celular antes de enviar.
    if (dados.data && dados.hora) {
        const agora = new Date(Date.now() + 5 * 60 * 1000)
        const doisDigitos = (n) => String(n).padStart(2, '0')
        const hojeLocal = `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`
        const horaLocal = `${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}`
        if (dados.data === hojeLocal && dados.hora > horaLocal) {
            return { erro: 'Aqui a gente guarda o que você já sentiu. Escolha agora ou um horário que já passou.' }
        }
    }

    for (const campo of ['emocoes', 'atividades']) {
        if (!veio(campo)) continue
        const { erro, itens } = normalizarLista(corpo[campo], campo)
        if (erro) return { erro }
        dados[campo] = itens
    }

    if (veio('nota')) {
        if (corpo.nota === null || (typeof corpo.nota === 'string' && corpo.nota.trim() === '')) {
            dados.nota = null
        } else if (typeof corpo.nota !== 'string') {
            return { erro: 'O campo "nota" deve ser um texto' }
        } else if (corpo.nota.length > NOTA_MAXIMO) {
            return { erro: `A nota pode ter no máximo ${NOTA_MAXIMO} caracteres` }
        } else {
            dados.nota = corpo.nota.trim()
        }
    }

    return { dados }
}

// Todas as ações usam req.usuarioLogado.id (do token). O usuário nunca
// informa "de quem" é o registro, então não tem como mexer nos de outra pessoa.
class RegistroController {

    static async listar(req, res) {
        try {
            const { de, ate } = req.query

            for (const [nome, valor] of [['de', de], ['ate', ate]]) {
                if (valor !== undefined && !ehDataValida(valor)) {
                    return responderRequisicaoInvalida(res, `O parâmetro "${nome}" deve estar no formato AAAA-MM-DD`)
                }
            }
            if (de && ate && de > ate) {
                return responderRequisicaoInvalida(res, 'A data inicial não pode ser depois da final')
            }

            const registros = await RegistroModel.listar(req.usuarioLogado.id, { de, ate })

            return res.status(200).json({
                sucesso: true,
                quantidade: registros.length,
                dados: registros,
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao listar registros', error)
        }
    }

    static async buscar(req, res) {
        try {
            const { id } = req.params
            if (!ehIdValido(id)) return responderRequisicaoInvalida(res, 'ID inválido')

            const registro = await RegistroModel.buscar(req.usuarioLogado.id, id)
            if (!registro) return responderNaoEncontrado(res, 'Registro não encontrado')

            return res.status(200).json({ sucesso: true, dados: registro })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao buscar registro', error)
        }
    }

    static async criar(req, res) {
        try {
            // LGPD: sem o consentimento explícito, nenhum dado sensível é gravado.
            const usuario = await UsuarioModel.buscarPorId(req.usuarioLogado.id)
            if (!usuario) return responderNaoEncontrado(res, 'Usuário não encontrado')
            if (!usuario.consentimento_em) {
                return responderProibido(res, 'Aceite o aviso de dados sensíveis antes de fazer o primeiro registro')
            }

            const { erro, dados } = validarRegistro(req.body ?? {})
            if (erro) return responderRequisicaoInvalida(res, erro)

            const registro = await RegistroModel.criar(req.usuarioLogado.id, dados)

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Registro salvo',
                dados: registro,
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao salvar registro', error)
        }
    }

    static async alterar(req, res) {
        try {
            const { id } = req.params
            if (!ehIdValido(id)) return responderRequisicaoInvalida(res, 'ID inválido')

            const { erro, dados } = validarRegistro(req.body ?? {}, { parcial: true })
            if (erro) return responderRequisicaoInvalida(res, erro)
            if (Object.keys(dados).length === 0) {
                return responderRequisicaoInvalida(res, 'Informe ao menos um campo para alterar')
            }

            const registro = await RegistroModel.atualizar(req.usuarioLogado.id, id, dados)
            if (!registro) return responderNaoEncontrado(res, 'Registro não encontrado')

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Registro alterado',
                dados: registro,
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao alterar registro', error)
        }
    }

    static async excluir(req, res) {
        try {
            const { id } = req.params
            if (!ehIdValido(id)) return responderRequisicaoInvalida(res, 'ID inválido')

            const excluido = await RegistroModel.excluir(req.usuarioLogado.id, id)
            if (!excluido) return responderNaoEncontrado(res, 'Registro não encontrado')

            return res.status(200).json({ sucesso: true, mensagem: 'Registro excluído' })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao excluir registro', error)
        }
    }

    static async excluirTodos(req, res) {
        try {
            const quantidade = await RegistroModel.excluirTodos(req.usuarioLogado.id)

            return res.status(200).json({
                sucesso: true,
                mensagem: `${quantidade} registro(s) excluído(s)`,
                dados: { quantidade },
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao excluir registros', error)
        }
    }
}

module.exports = RegistroController
