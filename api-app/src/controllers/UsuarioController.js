const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UsuarioModel = require('../models/UsuarioModel')
const RegistroModel = require('../models/RegistroModel')
const { senhaConfere } = require('../utils/reautenticacao')

const {
    responderRequisicaoInvalida,
    responderNaoAutorizado,
    responderProibido,
    responderNaoEncontrado,
    responderConflito,
    responderErroInterno,
} = require('../utils/respostas')

const CUSTO_BCRYPT = 10        // quanto maior, mais lento (e mais difícil de quebrar)
const VALIDADE_TOKEN = '1h'

const SENHA_MINIMO = 6
const SENHA_MAXIMO_BYTES = 72  // o bcrypt só considera os primeiros 72 bytes

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGEX_USUARIO = /^[a-z0-9._]{3,30}$/

// Nomes das restrições UNIQUE definidas no banco.sql
const MENSAGENS_DUPLICIDADE = {
    usuarios_email_unico: 'Este e-mail já está cadastrado',
    usuarios_usuario_unico: 'Este nome de usuário já está em uso',
}

const ehTextoPreenchido = (valor) => typeof valor === 'string' && valor.trim() !== ''

// Código 23505 do PostgreSQL = tentou gravar um valor que deveria ser único
const tratarDuplicidade = (res, error) => {
    if (error.code !== '23505') return null
    return responderConflito(
        res,
        MENSAGENS_DUPLICIDADE[error.constraint] || 'E-mail ou usuário já cadastrado'
    )
}

// Valida e normaliza os dados do usuário.
// parcial = false (cadastro): todos os campos são obrigatórios.
// parcial = true (alteração): só valida os campos que vieram.
const validarUsuario = (corpo, { parcial = false } = {}) => {
    const dados = {}
    const veio = (campo) => corpo[campo] !== undefined

    for (const campo of ['nome', 'sobrenome']) {
        if (parcial && !veio(campo)) continue
        if (!ehTextoPreenchido(corpo[campo])) {
            return { erro: `O campo "${campo}" é obrigatório e não pode ficar vazio` }
        }
        dados[campo] = corpo[campo].trim()
    }

    if (!parcial || veio('email')) {
        const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : ''
        if (!REGEX_EMAIL.test(email)) {
            return { erro: 'Informe um e-mail válido' }
        }
        dados.email = email
    }

    if (!parcial || veio('usuario')) {
        const usuario = typeof corpo.usuario === 'string' ? corpo.usuario.trim().toLowerCase() : ''
        if (!REGEX_USUARIO.test(usuario)) {
            return { erro: 'O usuário deve ter de 3 a 30 caracteres: letras, números, ponto ou sublinhado' }
        }
        dados.usuario = usuario
    }

    if (!parcial || veio('senha')) {
        const { senha } = corpo
        // O limite máximo é em bytes (não em letras): acentos e emojis ocupam mais de
        // um byte, e o bcrypt ignoraria o que passasse de 72 bytes.
        if (typeof senha !== 'string' || senha.length < SENHA_MINIMO) {
            return { erro: `A senha deve ter pelo menos ${SENHA_MINIMO} caracteres` }
        }
        if (Buffer.byteLength(senha, 'utf8') > SENHA_MAXIMO_BYTES) {
            return { erro: 'A senha é longa demais (máximo de 72 bytes; acentos e emojis contam mais de um)' }
        }
        dados.senha = senha
    }

    return { dados }
}

const TEMAS = ['sistema', 'claro', 'escuro']
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/

const validarPreferencias = (corpo) => {
    const dados = {}

    if (corpo.tema !== undefined) {
        if (!TEMAS.includes(corpo.tema)) {
            return { erro: `O tema deve ser um destes: ${TEMAS.join(', ')}` }
        }
        dados.tema = corpo.tema
    }

    if (corpo.escala_fonte !== undefined) {
        const escala = Number(corpo.escala_fonte)
        if (!Number.isFinite(escala) || escala < 0.8 || escala > 1.6) {
            return { erro: 'O tamanho da fonte deve ficar entre 0.8 e 1.6' }
        }
        dados.escala_fonte = escala
    }

    if (corpo.lembrete_hora !== undefined) {
        if (corpo.lembrete_hora !== null && !REGEX_HORA.test(corpo.lembrete_hora)) {
            return { erro: 'Use o formato 19:30 para o lembrete, com horas de 00 a 23.' }
        }
        dados.lembrete_hora = corpo.lembrete_hora
    }

    if (corpo.lembrete_personalizado !== undefined) {
        if (corpo.lembrete_personalizado !== null && !REGEX_HORA.test(corpo.lembrete_personalizado)) {
            return { erro: 'Use o formato 19:30 para o lembrete, com horas de 00 a 23.' }
        }
        dados.lembrete_personalizado = corpo.lembrete_personalizado
    }

    return { dados }
}

// Todas as rotas de "minha conta" usam req.usuarioLogado.id, que vem do token.
// Não existe rota que receba o id de outro usuário: cada pessoa só alcança a si mesma.
class UsuarioController {

    static async cadastrar(req, res) {
        try {
            // No Express 5, req.body fica undefined quando o pedido vem sem corpo
            const { erro, dados } = validarUsuario(req.body ?? {})

            if (erro) {
                return responderRequisicaoInvalida(res, erro)
            }

            const senhaCriptografada = await bcrypt.hash(dados.senha, CUSTO_BCRYPT)
            const novoUsuario = await UsuarioModel.criar({ ...dados, senha: senhaCriptografada })

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Usuário cadastrado com sucesso',
                dados: novoUsuario,
            })
        } catch (error) {
            return tratarDuplicidade(res, error)
                ?? responderErroInterno(res, 'Erro ao cadastrar usuário', error)
        }
    }

    static async login(req, res) {
        try {
            const { login, senha } = req.body ?? {}

            if (!ehTextoPreenchido(login) || typeof senha !== 'string' || senha === '') {
                return responderRequisicaoInvalida(res, 'Informe o login (e-mail ou usuário) e a senha')
            }

            const usuario = await UsuarioModel.buscarParaLogin(login.trim().toLowerCase())

            const senhaConfere = usuario
                ? await bcrypt.compare(senha, usuario.senha)
                : false

            // Mesma mensagem para "não existe" e "senha errada":
            // assim ninguém descobre quais e-mails estão cadastrados.
            if (!senhaConfere) {
                return responderNaoAutorizado(res, 'Login ou senha inválidos')
            }

            if (!usuario.ativo) {
                return responderProibido(res, 'Usuário inativo')
            }

            const token = jwt.sign(
                { usuario: usuario.usuario },
                process.env.JWT_SECRET,
                {
                    subject: String(usuario.id),
                    expiresIn: VALIDADE_TOKEN,
                    algorithm: 'HS256',
                }
            )

            // Devolve o perfil público (sem a senha), já com consentimento e preferências
            const perfil = await UsuarioModel.buscarPorId(usuario.id)

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso',
                dados: {
                    token,
                    tipo: 'Bearer',
                    expiraEm: VALIDADE_TOKEN,
                    usuario: perfil,
                },
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao fazer login', error)
        }
    }

    static async verMeuPerfil(req, res) {
        try {
            const usuario = await UsuarioModel.buscarPorId(req.usuarioLogado.id)

            if (!usuario) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({ sucesso: true, dados: usuario })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao buscar usuário', error)
        }
    }

    static async alterarMeuPerfil(req, res) {
        try {
            const { erro, dados } = validarUsuario(req.body ?? {}, { parcial: true })

            if (erro) {
                return responderRequisicaoInvalida(res, erro)
            }

            if (Object.keys(dados).length === 0) {
                return responderRequisicaoInvalida(res, 'Informe ao menos um campo para alterar')
            }

            // E-mail, usuário e senha são o acesso à conta: trocar qualquer um exige
            // a senha atual. Nome e sobrenome continuam livres.
            if (dados.email !== undefined || dados.usuario !== undefined || dados.senha !== undefined) {
                if (!(await senhaConfere(req.usuarioLogado.id, req.body?.senhaAtual))) {
                    return responderProibido(res, 'Senha atual incorreta') // 403, não 401: 401 faria o app sair da conta
                }
            }

            if (dados.senha) {
                dados.senha = await bcrypt.hash(dados.senha, CUSTO_BCRYPT)
            }

            const usuarioAlterado = await UsuarioModel.atualizar(req.usuarioLogado.id, dados)

            if (!usuarioAlterado) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Dados alterados com sucesso',
                dados: usuarioAlterado,
            })
        } catch (error) {
            return tratarDuplicidade(res, error)
                ?? responderErroInterno(res, 'Erro ao alterar usuário', error)
        }
    }

    // LGPD: o app só libera o primeiro registro depois desta chamada,
    // feita quando a pessoa toca em "Concordo" na tela de consentimento.
    static async consentir(req, res) {
        try {
            const usuario = await UsuarioModel.registrarConsentimento(req.usuarioLogado.id)

            if (!usuario) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Consentimento registrado',
                dados: usuario,
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao registrar consentimento', error)
        }
    }

    static async salvarPreferencias(req, res) {
        try {
            const { erro, dados } = validarPreferencias(req.body ?? {})

            if (erro) {
                return responderRequisicaoInvalida(res, erro)
            }

            if (Object.keys(dados).length === 0) {
                return responderRequisicaoInvalida(res, 'Informe tema, escala_fonte, lembrete_hora ou lembrete_personalizado')
            }

            const usuario = await UsuarioModel.atualizarPreferencias(req.usuarioLogado.id, dados)

            if (!usuario) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Preferências salvas',
                dados: usuario,
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao salvar preferências', error)
        }
    }

    // LGPD (direito de portabilidade): devolve tudo o que o app guarda sobre a pessoa.
    static async exportarMeusDados(req, res) {
        try {
            const id = req.usuarioLogado.id
            const [usuario, registros] = await Promise.all([
                UsuarioModel.buscarPorId(id),
                RegistroModel.listar(id),
            ])

            if (!usuario) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                dados: {
                    exportadoEm: new Date().toISOString(),
                    usuario,
                    registros,
                },
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao exportar dados', error)
        }
    }

    // Apaga a conta e, pelo ON DELETE CASCADE, todos os registros dela.
    static async excluirMinhaConta(req, res) {
        try {
            // Ação sem volta: confirma que é mesmo o dono da conta.
            if (!(await senhaConfere(req.usuarioLogado.id, req.body?.senha))) {
                return responderProibido(res, 'Senha incorreta. A conta não foi excluída.') // 403: não desloga
            }

            const excluido = await UsuarioModel.deletar(req.usuarioLogado.id)

            if (!excluido) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Conta e todos os dados excluídos',
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao excluir conta', error)
        }
    }
}

module.exports = UsuarioController
