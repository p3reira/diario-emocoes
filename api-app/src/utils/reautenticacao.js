const bcrypt = require('bcryptjs')
const UsuarioModel = require('../models/UsuarioModel')

// Reautenticação: antes de uma ação que não tem volta (excluir conta, apagar
// todos os registros) ou que muda o acesso à conta (e-mail, senha), a API pede
// a senha atual de novo. Estar logado não basta: protege contra o celular
// emprestado ou esquecido destravado.
async function senhaConfere(usuarioId, senha) {
    if (typeof senha !== 'string' || senha.length === 0) return false
    const hash = await UsuarioModel.buscarHashSenha(usuarioId)
    if (!hash) return false
    return bcrypt.compare(senha, hash)
}

module.exports = { senhaConfere }
