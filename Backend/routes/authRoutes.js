const express = require('express');
const router = express.Router();
const { login, registrar, perfil } = require('../controllers/authController');
const { verificarToken, permitirRoles } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/registrar', verificarToken, permitirRoles('admin'), registrar);
router.get('/perfil', verificarToken, perfil);

module.exports = router;