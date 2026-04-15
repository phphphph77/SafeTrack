const cron = require('node-cron');
const axios = require('axios');
const pool  = require('../config/db');


const dispararAlertasN8n = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id              AS funcionario_id,
        u.nome            AS funcionario_nome,
        u.email           AS funcionario_email,
        t.nome            AS treinamento_nome,
        c.data_validade,
        DATEDIFF(c.data_validade, CURDATE()) AS dias_restantes
      FROM certificados c
      INNER JOIN usuarios     u ON c.usuario_id     = u.id
      INNER JOIN treinamentos t ON c.treinamento_id = t.id
      WHERE c.status = 'ativo'
        AND u.ativo  = 1
        AND u.email  IS NOT NULL
        -- AND DATEDIFF(c.data_validade, CURDATE()) IN (30, 15, 7, 2, 1, 0)
      ORDER BY dias_restantes ASC
    `);


    if (rows.length === 0) {
      console.log('[N8N] Nenhum alerta de vencimento hoje.');
      return;
    }


    await axios.post(process.env.N8N_WEBHOOK_URL, {
      alertas:   rows,
      total:     rows.length,
      gerado_em: new Date().toISOString(),
    }, {
      validateStatus: () => true  // ← não lança erro mesmo com status 500
    });


    console.log(`[N8N] ${rows.length} alerta(s) enviado(s) com sucesso.`);
  } catch (err) {
    console.error('[N8N] Erro ao disparar webhook:', err.message);
  }
};


const iniciarCronJob = () => {
  cron.schedule('0 7 * * *', async () => {
    console.log('[CRON] Verificando certificados vencendo...');
    await dispararAlertasN8n();
  }, { timezone: 'America/Sao_Paulo' });


  console.log('[CRON] Job de certificados agendado para 07:00 (Brasília).');
};


module.exports = { iniciarCronJob, dispararAlertasN8n };