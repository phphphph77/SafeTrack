const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
require('dotenv').config();

const login = async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha, role, ativo FROM usuarios WHERE email = ? LIMIT 1',
      // ↑ era 'senha_hash', agora 'senha'
      [email.toLowerCase().trim()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    const usuario = rows[0];
    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Conta desativada. Contate o administrador.' });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    // ↑ era 'usuario.senha_hash', agora 'usuario.senha'
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
    await pool.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?', [usuario.id]);
    return res.json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    });
  } catch (err) {
    console.error('[AUTH] Erro no login:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const registrar = async (req, res) => {
  const { nome, email, senha, role = 'funcionario', matricula } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const rolesValidas = ['admin', 'hse', 'funcionario'];
  if (!rolesValidas.includes(role)) {
    return res.status(400).json({ erro: `Role inválida. Use: ${rolesValidas.join(', ')}.` });
  }

  if ((role === 'admin' || role === 'hse') && req.usuario?.role !== 'admin') {
    return res.status(403).json({ erro: 'Apenas admins podem criar usuários com perfil elevado.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 12);
    const emailNormalizado = email.toLowerCase().trim();

    const [existente] = await pool.query(
      'SELECT id, ativo FROM usuarios WHERE email = ? LIMIT 1',
      [emailNormalizado]
    );

    if (existente.length > 0) {
      const usuarioExistente = existente[0];

      if (usuarioExistente.ativo === 1) {
        return res.status(409).json({ erro: 'E-mail já cadastrado.' });
      }

      // Reativa usuário inativo com novos dados
      await pool.query(
        `UPDATE usuarios
         SET nome = ?, senha = ?, role = ?, matricula = ?, ativo = 1, criado_em = NOW()
         WHERE id = ?`,
        [nome.trim(), senhaHash, role, matricula || null, usuarioExistente.id]
      );

      return res.status(201).json({
        mensagem: 'Usuário reativado com sucesso.',
        id: usuarioExistente.id,
      });
    }

    // Usuário novo
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, role, matricula, ativo, criado_em) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [nome.trim(), emailNormalizado, senhaHash, role, matricula || null]
    );

    return res.status(201).json({
      mensagem: 'Usuário criado com sucesso.',
      id: resultado.insertId,
    });

  } catch (err) {
    console.error('[AUTH] Erro ao registrar:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const perfil = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, role, matricula, criado_em, ultimo_acesso FROM usuarios WHERE id = ? AND ativo = 1',
      [req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json({ usuario: rows[0] });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

module.exports = { login, registrar, perfil };