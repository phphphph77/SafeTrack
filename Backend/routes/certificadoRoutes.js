const express = require('express');
const router = express.Router();
const { listarConformidade, listarPorFuncionario, emitir, cancelar } = require('../controllers/certificadoController');
const { verificarToken, permitirRoles } = require('../middleware/authMiddleware');

router.get('/conformidade', verificarToken, permitirRoles('admin', 'hse'), listarConformidade);
router.get('/funcionario/:funcionario_id', verificarToken, listarPorFuncionario);
router.post('/', verificarToken, permitirRoles('admin', 'hse'), emitir);
router.delete('/:id', verificarToken, permitirRoles('admin', 'hse'), cancelar);

module.exports = router;