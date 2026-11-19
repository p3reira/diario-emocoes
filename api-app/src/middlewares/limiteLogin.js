// Limite de tentativas de login (contra força bruta).
// Conta só as tentativas que ERRARAM a senha, por IP + login digitado.
// Depois de MAX_FALHAS erros em JANELA_MS, o login fica bloqueado até a janela
// passar (429). Acertar a senha zera a contagem.
// Fica na memória do servidor: suficiente para uma API com uma instância só.
// Com várias instâncias, a contagem teria que ir para um armazenamento comum (ex.: Redis).

const MAX_FALHAS = 5
const JANELA_MS = 15 * 60 * 1000 // 15 minutos

const falhas = new Map() // chave -> { quantidade, inicio }

const chaveDe = (req) => {
    const login = typeof req.body?.login === 'string' ? req.body.login.trim().toLowerCase() : ''
    return `${req.ip}|${login}`
}

// Limpa de vez em quando as entradas vencidas, para o Map não crescer sem fim.
setInterval(() => {
    const agora = Date.now()
    for (const [chave, info] of falhas) {
        if (agora - info.inicio > JANELA_MS) falhas.delete(chave)
    }
}, JANELA_MS).unref()

function limiteLogin(req, res, next) {
    const chave = chaveDe(req)
    const agora = Date.now()
    const info = falhas.get(chave)

    if (info && agora - info.inicio > JANELA_MS) falhas.delete(chave)

    const atual = falhas.get(chave)
    if (atual && atual.quantidade >= MAX_FALHAS) {
        const minutos = Math.ceil((JANELA_MS - (agora - atual.inicio)) / 60000)
        res.set('Retry-After', String(minutos * 60))
        return res.status(429).json({
            sucesso: false,
            mensagem: `Muitas tentativas de login. Tente de novo em ${minutos} minuto(s).`,
        })
    }

    // Depois que a resposta sai, conta erro (401) ou zera no acerto (200).
    res.on('finish', () => {
        if (res.statusCode === 401) {
            const registro = falhas.get(chave) ?? { quantidade: 0, inicio: Date.now() }
            registro.quantidade += 1
            falhas.set(chave, registro)
        } else if (res.statusCode === 200) {
            falhas.delete(chave)
        }
    })

    next()
}

module.exports = limiteLogin
