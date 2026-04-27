const pool = require('../config/db');

const emitirPT = async (req, res) => {
  const {
    funcionario_id,
    treinamento_id,
    atividade,
    local_trabalho,
    data_inicio,
    data_fim,
    observacoes,
  } = req.body;

  if (!funcionario_id || !treinamento_id || !atividade || !local_trabalho || !data_inicio || !data_fim) {
    return res.status(400).json({
      erro: 'Todos os campos obrigatórios devem ser preenchidos.',
    });
  }

  if (new Date(data_fim) <= new Date(data_inicio)) {
    return res.status(400).json({
      erro: 'A data/hora de fim deve ser posterior à data/hora de início.',
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [funcionario] = await connection.query(
      `SELECT id, nome, email, ativo
       FROM usuarios
       WHERE id = ? AND role = 'funcionario'
       LIMIT 1`,
      [funcionario_id]
    );

    if (funcionario.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    if (!funcionario[0].ativo) {
      await connection.rollback();
      return res.status(422).json({
        erro: `⛔ Emissão de PT BLOQUEADA: O funcionário "${funcionario[0].nome}" está inativo (demitido). Não é possível emitir PT para funcionários inativos.`,
        codigo: 'FUNCIONARIO_INATIVO',
        funcionario: funcionario[0].nome,
      });
    }

    const [treinamento] = await connection.query(
      'SELECT id, nome FROM treinamentos WHERE id = ? AND ativo = 1 LIMIT 1',
      [treinamento_id]
    );
    if (treinamento.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Treinamento não encontrado.' });
    }

    const [certRows] = await connection.query(
      `SELECT id, data_validade, codigo
       FROM certificados
       WHERE usuario_id = ?
         AND treinamento_id = ?
         AND status = 'ativo'
         AND data_validade >= CURDATE()
       ORDER BY data_validade DESC
       LIMIT 1`,
      [funcionario_id, treinamento_id]
    );

    if (certRows.length === 0) {
      const [certVencido] = await connection.query(
        `SELECT id, data_validade
         FROM certificados
         WHERE usuario_id = ?
           AND treinamento_id = ?
         ORDER BY data_validade DESC
         LIMIT 1`,
        [funcionario_id, treinamento_id]
      );

      await connection.rollback();

      if (certVencido.length > 0) {
        const dataVenc = new Date(certVencido[0].data_validade).toLocaleDateString('pt-BR');
        return res.status(422).json({
          erro: `⛔ Emissão de PT BLOQUEADA: O certificado de "${treinamento[0].nome}" do funcionário "${funcionario[0].nome}" venceu em ${dataVenc}. Renove o treinamento para prosseguir.`,
          codigo: 'CERTIFICADO_VENCIDO',
          funcionario: funcionario[0].nome,
          treinamento: treinamento[0].nome,
          data_vencimento: certVencido[0].data_validade,
        });
      }

      return res.status(422).json({
        erro: `⛔ Emissão de PT BLOQUEADA: O funcionário "${funcionario[0].nome}" não possui o treinamento "${treinamento[0].nome}" exigido para esta atividade.`,
        codigo: 'SEM_CERTIFICADO',
        funcionario: funcionario[0].nome,
        treinamento: treinamento[0].nome,
      });
    }

    const certificadoValido = certRows[0];

    const numeroPT = `PT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const [resultado] = await connection.query(
      `INSERT INTO permissoes_trabalho
         (numero_pt, funcionario_id, treinamento_id, certificado_id, atividade,
          local_trabalho, data_inicio, data_fim, status, emitida_por, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aprovada', ?, ?)`,
      [
        numeroPT,
        funcionario_id,
        treinamento_id,
        certificadoValido.id,
        atividade.trim(),
        local_trabalho.trim(),
        data_inicio,
        data_fim,
        req.usuario.id,
        observacoes || null,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      mensagem: '✅ Permissão de Trabalho emitida com sucesso.',
      pt: {
        id: resultado.insertId,
        numero_pt: numeroPT,
        funcionario: funcionario[0].nome,
        treinamento: treinamento[0].nome,
        certificado_codigo: certificadoValido.codigo,
        certificado_validade: certificadoValido.data_validade,
        status: 'aprovada',
      },
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[PT] Erro ao emitir PT:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  } finally {
    if (connection) connection.release();
  }
};

const listarPTs = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.usuario.role === 'funcionario') {
      query = `
        SELECT pt.*,
               u.nome  AS funcionario_nome,
               u.ativo AS funcionario_ativo,
               t.nome  AS treinamento_nome,
               e.nome  AS emitida_por_nome
        FROM permissoes_trabalho pt
        INNER JOIN usuarios u   ON pt.funcionario_id = u.id
        INNER JOIN treinamentos t ON pt.treinamento_id = t.id
        INNER JOIN usuarios e   ON pt.emitida_por = e.id
        WHERE pt.funcionario_id = ?
        ORDER BY pt.criado_em DESC
      `;
      params = [req.usuario.id];
    } else {
      query = `
        SELECT pt.*,
               u.nome  AS funcionario_nome,
               u.ativo AS funcionario_ativo,
               t.nome  AS treinamento_nome,
               e.nome  AS emitida_por_nome
        FROM permissoes_trabalho pt
        INNER JOIN usuarios u   ON pt.funcionario_id = u.id
        INNER JOIN treinamentos t ON pt.treinamento_id = t.id
        INNER JOIN usuarios e   ON pt.emitida_por = e.id
        ORDER BY pt.criado_em DESC
        LIMIT 100
      `;
    }

    const [rows] = await pool.query(query, params);
    return res.json({ permissoes: rows });
  } catch (err) {
    console.error('[PT] Erro ao listar:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

const atualizarStatusPT = async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['pendente', 'aprovada', 'em_execucao', 'concluida', 'cancelada'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({
      erro: `Status inválido. Use: ${statusValidos.join(', ')}.`,
    });
  }

  try {
    await pool.query(
      'UPDATE permissoes_trabalho SET status = ?, atualizado_em = NOW() WHERE id = ?',
      [status, req.params.id]
    );
    return res.json({ mensagem: 'Status da PT atualizado.' });
  } catch (err) {
    console.error('[PT] Erro ao atualizar status:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};
const cancelarPT = async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query(
        'SELECT id FROM permissoes_trabalho WHERE id = ? LIMIT 1', [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ erro: 'PT não encontrada.' });
      }
      await pool.query(
        "UPDATE permissoes_trabalho SET status = 'cancelada', atualizado_em = NOW() WHERE id = ?",
        [id]
      );
      return res.json({ mensagem: 'PT cancelada com sucesso.' });
    } catch (err) {
      console.error('[PT] Erro ao cancelar:', err.message);
      return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
  };

module.exports = { emitirPT, listarPTs, atualizarStatusPT, cancelarPT };