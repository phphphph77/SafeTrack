const express = require('express');
const router = express.Router();
const { emitirPT, listarPTs, atualizarStatusPT, cancelarPT } = require('../controllers/ptController');
const { verificarToken, permitirRoles } = require('../middleware/authMiddleware');

router.get('/',               verificarToken, listarPTs);
router.post('/',              verificarToken, permitirRoles('admin', 'hse'), emitirPT);
router.patch('/:id/status',   verificarToken, permitirRoles('admin', 'hse'), atualizarStatusPT); // ← /status aqui
router.delete('/:id',         verificarToken, permitirRoles('admin', 'hse'), cancelarPT);

module.exports = router;