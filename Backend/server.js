const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes    = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const treinamentoRoutes      = require('./routes/treinamentoRoutes');
const certificadoRoutes      = require('./routes/certificadoRoutes');
const ptRoutes               = require('./routes/ptRoutes');
const { iniciarCronJob }     = require('./jobs/cronJob');
const { dispararAlertasN8n } = require('./jobs/cronJob');
const app  = express();
const PORT = process.env.PORT || 3001;
const path = require('path');

// ── Middlewares globais ─────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// ── Rotas ───────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.use('/api/treinamentos', treinamentoRoutes);
app.use('/api/certificados', certificadoRoutes);
app.use('/api/pt',           ptRoutes);

app.post('/api/testar-alertas', async (req, res) => {
await dispararAlertasN8n();
res.json({ mensagem: 'Alertas disparados para o n8n!' });
});

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ── Error handler global ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[SERVER] Erro não tratado:', err.message);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// ── Inicialização ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 HSE Portal Backend rodando na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV}`);
  console.log(`   URL: http://localhost:${PORT}/api/health\n`);

iniciarCronJob();
});