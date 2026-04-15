const pool = require('../config/db');

const listarFuncionarios = async (req, res) => {
  try {
    // query param ?todos=true permite listar inativos (ex: página de Usuários)
    const incluirInativos = req.query.todos === 'true';

    const [rows] = await pool.query(
      `SELECT id, nome, email, role, matricula, ativo, criado_em, ultimo_acesso
       FROM usuarios
       ${incluirInativos ? '' : 'WHERE ativo = 1'}
       ORDER BY ativo DESC, nome ASC`
    );
    return res.json({ funcionarios: rows });
  } catch (err) {
    console.error('[Usuário] Erro ao listar:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const buscarFuncionario = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, role, matricula, ativo, criado_em FROM usuarios WHERE id = ? AND ativo = 1 LIMIT 1',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json({ funcionario: rows[0] });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const desativarFuncionario = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.usuario.id) {
    return res.status(400).json({ erro: 'Você não pode desativar sua própria conta.' });
  }
  try {
    await pool.query('UPDATE usuarios SET ativo = 0 WHERE id = ?', [id]);
    return res.json({ mensagem: 'Usuário desativado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const toggleStatusUsuario = async (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ erro: 'Campo "ativo" deve ser true ou false.' });
  }
  try {
    await pool.query('UPDATE usuarios SET ativo = ? WHERE id = ?', [ativo ? 1 : 0, id]);
    return res.json({ mensagem: `Usuário ${ativo ? 'reativado' : 'desativado'} com sucesso.` });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const criarUsuario = async (req, res) => {
  const { nome, email, senha, role } = req.body;

  if (!nome || !email || !senha || !role) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  const rolesValidos = ['admin', 'hse', 'funcionario'];
  if (!rolesValidos.includes(role)) {
    return res.status(400).json({ erro: 'Perfil inválido.' });
  }

  try {
    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]
    );
    if (existe.length > 0) {
      return res.status(409).json({ erro: 'Já existe um usuário com este e-mail.' });
    }

    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      `INSERT INTO usuarios (nome, email, senha, role, ativo)
       VALUES (?, ?, ?, ?, 1)`,
      [nome.trim(), email.trim().toLowerCase(), senhaHash, role]
    );

    return res.status(201).json({ mensagem: `Usuário "${nome}" criado com sucesso.` });
  } catch (err) {
    console.error('[Usuário] Erro ao criar:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

module.exports = { listarFuncionarios, buscarFuncionario, desativarFuncionario, toggleStatusUsuario, criarUsuario };