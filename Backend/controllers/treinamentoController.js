const pool = require('../config/db');

const listar = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM treinamentos WHERE ativo = 1 ORDER BY nome ASC'
    );
    return res.json({ treinamentos: rows });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM treinamentos WHERE id = ? AND ativo = 1 LIMIT 1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Treinamento não encontrado.' });
    return res.json({ treinamento: rows[0] });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const criar = async (req, res) => {
  const { nome, descricao, link_curso, carga_horaria, validade_meses, obrigatorio } = req.body;
  if (!nome || !carga_horaria || !validade_meses) {
    return res.status(400).json({ erro: 'Nome, carga horária e validade são obrigatórios.' });
  }
  try {
    const [resultado] = await pool.query(
      'INSERT INTO treinamentos (nome, descricao, link_curso, carga_horaria, validade_meses, obrigatorio) VALUES (?, ?, ?, ?, ?, ?)',
      [nome.trim(), descricao || null, link_curso || null, carga_horaria, validade_meses, obrigatorio ? 1 : 0]
    );
    return res.status(201).json({ mensagem: 'Treinamento criado.', id: resultado.insertId });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const atualizar = async (req, res) => {
  const { nome, descricao, link_curso, carga_horaria, validade_meses, obrigatorio, ativo } = req.body;
  try {
    await pool.query(
      'UPDATE treinamentos SET nome=?, descricao=?, link_curso=?, carga_horaria=?, validade_meses=?, obrigatorio=?, ativo=? WHERE id=?',
      [nome, descricao, link_curso || null, carga_horaria, validade_meses, obrigatorio ? 1 : 0, ativo ? 1 : 0, req.params.id]
    );
    return res.json({ mensagem: 'Treinamento atualizado.' });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const atualizarLink = async (req, res) => {
  const { link_curso } = req.body;
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE treinamentos SET link_curso = ? WHERE id = ?',
      [link_curso || null, id]
    );
    return res.json({ mensagem: 'Link atualizado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, atualizarLink };