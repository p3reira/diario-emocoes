const express = require('express')
const UsuarioController = require('../controllers/UsuarioController')
const autenticar = require('../middlewares/autenticacao')
const limiteLogin = require('../middlewares/limiteLogin')

const router = express.Router()

// Rotas abertas
router.post('/', UsuarioController.cadastrar)
router.post('/login', limiteLogin, UsuarioController.login) // no máximo 5 erros a cada 15 min

// Rotas fechadas: "/eu" é sempre o dono do token. Não existe rota com o id
// de outra pessoa, então ninguém consulta, altera ou exclui a conta alheia.
router.get('/eu', autenticar, UsuarioController.verMeuPerfil)
router.put('/eu', autenticar, UsuarioController.alterarMeuPerfil)
router.delete('/eu', autenticar, UsuarioController.excluirMinhaConta)

router.post('/eu/consentimento', autenticar, UsuarioController.consentir)
router.put('/eu/preferencias', autenticar, UsuarioController.salvarPreferencias)
router.get('/eu/exportar', autenticar, UsuarioController.exportarMeusDados)

module.exports = router
