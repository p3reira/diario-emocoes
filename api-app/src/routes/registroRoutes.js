const express = require('express')
const RegistroController = require('../controllers/RegistroController')
const autenticar = require('../middlewares/autenticacao')

const router = express.Router()

// Todas as rotas de registros exigem token.
router.use(autenticar)

router.get('/', RegistroController.listar)              // ?de=AAAA-MM-DD&ate=AAAA-MM-DD
router.post('/', RegistroController.criar)
router.delete('/', RegistroController.excluirTodos)     // "apagar todos os meus registros"
router.get('/mais-antigo', RegistroController.maisAntigo) // antes de /:id, senão vira um id
router.get('/:id', RegistroController.buscar)
router.put('/:id', RegistroController.alterar)
router.delete('/:id', RegistroController.excluir)

module.exports = router
