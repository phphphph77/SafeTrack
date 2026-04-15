const pool = require('../config/db');

const listarConformidade = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id AS funcionario_id,
        u.nome AS funcionario_nome,
        u.email,
        u.matricula,
        t.id AS treinamento_id,
        t.nome AS treinamento_nome,
        t.validade_meses,
        c.id AS certificado_id,
        c.data_emissao,
        c.data_validade,
        c.status AS cert_status,
        DATEDIFF(c.data_validade, CURDATE()) AS dias_restantes,
        CASE
          WHEN c.id IS NULL THEN 'sem_certificado'
          WHEN c.status = 'cancelado' THEN 'sem_certificado'
          WHEN c.data_validade <= CURDATE() THEN 'vencido'
          WHEN DATEDIFF(c.data_validade, CURDATE()) <= 30 THEN 'vencendo'
          ELSE 'valido'
        END AS situacao
      FROM usuarios u
      CROSS JOIN treinamentos t
      LEFT JOIN certificados c
        ON c.usuario_id = u.id
        AND c.treinamento_id = t.id
        AND c.status = 'ativo'
        AND c.data_validade = (
          SELECT MAX(c2.data_validade)
          FROM certificados c2
          WHERE c2.usuario_id = u.id
            AND c2.treinamento_id = t.id
            AND c2.status = 'ativo'
        )
      WHERE u.ativo = 1
        AND u.role = 'funcionario'
        AND t.ativo = 1
        AND t.obrigatorio = 1
      ORDER BY u.nome, t.nome
    `);
    return res.json({ conformidade: rows });
  } catch (err) {
    console.error('[CERT] Erro ao listar conformidade:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const listarPorFuncionario = async (req, res) => {
  const { funcionario_id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT c.*, t.nome AS treinamento_nome, t.validade_meses,
             u.nome AS emitido_por_nome
      FROM certificados c
      INNER JOIN treinamentos t ON c.treinamento_id = t.id
      LEFT JOIN usuarios u ON c.emitido_por = u.id
      WHERE c.usuario_id = ?
      ORDER BY c.data_validade DESC
    `, [funcionario_id]);
    return res.json({ certificados: rows });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const emitir = async (req, res) => {
  const { usuario_id, treinamento_id, data_emissao, observacoes } = req.body;
  if (!usuario_id || !treinamento_id || !data_emissao) {
    return res.status(400).json({ erro: 'Funcionário, treinamento e data de emissão são obrigatórios.' });
  }
  try {
    const [treinamento] = await pool.query(
      'SELECT id, validade_meses FROM treinamentos WHERE id = ? AND ativo = 1 LIMIT 1',
      [treinamento_id]
    );
    if (treinamento.length === 0) {
      return res.status(404).json({ erro: 'Treinamento não encontrado.' });
    }
    const { validade_meses } = treinamento[0];
    const dataEmissao = new Date(data_emissao);
    const dataValidade = new Date(dataEmissao);
    dataValidade.setMonth(dataValidade.getMonth() + validade_meses);
    const dataValStr = dataValidade.toISOString().split('T')[0];
    const codigo = `CERT-${Date.now()}-${usuario_id}-${treinamento_id}`;
    const [resultado] = await pool.query(
      `INSERT INTO certificados
         (usuario_id, treinamento_id, data_emissao, data_validade, codigo, status, emitido_por, observacoes)
       VALUES (?, ?, ?, ?, ?, 'ativo', ?, ?)`,
      [usuario_id, treinamento_id, data_emissao, dataValStr, codigo, req.usuario.id, observacoes || null]
    );
    return res.status(201).json({
      mensagem: 'Certificado emitido com sucesso.',
      id: resultado.insertId,
      data_validade: dataValStr,
      codigo,
    });
  } catch (err) {
    console.error('[CERT] Erro ao emitir:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const cancelar = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id FROM certificados WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Certificado não encontrado.' });
    }
    await pool.query(
      "UPDATE certificados SET status = 'cancelado' WHERE id = ?",
      [id]
    );
    return res.json({ mensagem: 'Certificado cancelado com sucesso.' });
  } catch (err) {
    console.error('[CERT] Erro ao cancelar:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

module.exports = { listarConformidade, listarPorFuncionario, emitir, cancelar };