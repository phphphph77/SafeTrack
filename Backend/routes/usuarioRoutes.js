const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const {
  listarFuncionarios,
  buscarFuncionario,
  desativarFuncionario,
  toggleStatusUsuario,
  criarUsuario,
  uploadFoto,
} = require('../controllers/usuarioController');
const { verificarToken, permitirRoles } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/fotos/'),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    cb(null, `usuario-${req.params.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const permitidos = /jpeg|jpg|png|webp/;
    permitidos.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error('Apenas imagens são permitidas.'));
  },
});

router.get('/',              verificarToken, permitirRoles('admin', 'hse'), listarFuncionarios);
router.get('/:id',           verificarToken, permitirRoles('admin', 'hse'), buscarFuncionario);
router.post('/',             verificarToken, permitirRoles('admin'),        criarUsuario);
router.delete('/:id',        verificarToken, permitirRoles('admin'),        desativarFuncionario);
router.patch('/:id/status',  verificarToken, permitirRoles('admin'),        toggleStatusUsuario);
router.patch('/:id/foto',    verificarToken, upload.single('foto'),         uploadFoto);

module.exports = router;