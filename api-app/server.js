const express = require('express')
const cors = require('cors')
require('dotenv').config()

// Sem a chave secreta não dá para gerar nem conferir tokens: melhor nem subir.
if (!process.env.JWT_SECRET) {
    console.error('ERRO: a variável JWT_SECRET não está definida no arquivo .env')
    process.exit(1)
}

const usuariosRoutes = require('./src/routes/usuarioRoutes')
const registrosRoutes = require('./src/routes/registroRoutes')
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

app.get('/saude', (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString()
    })
})

app.get('/', (req, res) => {
    res.json({
        mensagem: "API do app Diário de Emoções funcionando!",
        versao: '2.3.3',
        endpoints: {
            cadastrar: 'POST /api/usuarios',
            login: 'POST /api/usuarios/login',
            meuPerfil: 'GET | PUT | DELETE /api/usuarios/eu (token)',
            consentimento: 'POST /api/usuarios/eu/consentimento (token)',
            preferencias: 'PUT /api/usuarios/eu/preferencias (token)',
            exportar: 'GET /api/usuarios/eu/exportar (token)',
            registros: 'GET | POST | DELETE /api/registros (token)',
            registro: 'GET | PUT | DELETE /api/registros/:id (token)'
        }
    })
})

app.use('/api/usuarios', usuariosRoutes)
app.use('/api/registros', registrosRoutes)


app.use((req, res) => {
    res.status(404).json({
        sucesso: false,
        mensagem: 'Endpoint não encontrado',
        rota: req.url
    })
})

app.use((err, req, res, next) => {
    // JSON mal formado no corpo do pedido é erro de quem enviou, não do servidor
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'JSON inválido no corpo da requisição'
        })
    }

    console.error('Erro interno do servidor:', err)
    res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor',
        erro: process.env.NODE_ENV === 'development' ? err.message : 'Por favor, tente novamente mais tarde.'
    })
})

// 0.0.0.0: aceita conexões da rede local, para o celular (Expo Go ou APK)
// conseguir chegar na API pelo IP do computador.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
        - Servidor rodando na porta ${PORT}
        - API do app Diário de Emoções
        - http://localhost:${PORT}
        `)
})

process.on('unhandledRejection', (err) => {
    console.error('Rejeição não tratada:', err)
    process.exit(1)
})