const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizar, atualizarLink } = require('../controllers/treinamentoController');
const { verificarToken, permitirRoles } = require('../middleware/authMiddleware');

router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, buscarPorId);
router.post('/', verificarToken, permitirRoles('admin', 'hse'), criar);
router.put('/:id', verificarToken, permitirRoles('admin', 'hse'), atualizar);
router.patch('/:id/link', verificarToken, permitirRoles('admin', 'hse'), atualizarLink);

module.exports = router;