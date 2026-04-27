const express = require('express');
const router  = express.Router();
const {
  listarFuncionarios,
  buscarFuncionario,
  desativarFuncionario,
  toggleStatusUsuario,
  criarUsuario,
} = require('../controllers/usuarioController');
const { verificarToken, permitirRoles } = require('../middleware/authMiddleware');

router.get('/',             verificarToken, permitirRoles('admin', 'hse'), listarFuncionarios);
router.get('/:id',          verificarToken, permitirRoles('admin', 'hse'), buscarFuncionario);
router.post('/',            verificarToken, permitirRoles('admin'),        criarUsuario);    
router.delete('/:id',       verificarToken, permitirRoles('admin'),        desativarFuncionario);
router.patch('/:id/status', verificarToken, permitirRoles('admin'),        toggleStatusUsuario);

module.exports = router;