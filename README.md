# 🛡️ SafeTrack — Portal de Gestão HSE

Sistema web para gestão de segurança do trabalho, desenvolvido para centralizar o controle de treinamentos, certificados e permissões de trabalho, garantindo conformidade com as Normas Regulamentadoras do Ministério do Trabalho.

---

## 📋 Funcionalidades

- **Autenticação segura** com JWT e controle de acesso por perfil
- **Gestão de usuários** — cadastro, ativação e desativação de funcionários
- **Catálogo de treinamentos** — NR-35, NR-10, NR-33 e outros, com link para plataforma de curso
- **Emissão de certificados** — com data de validade e código único por certificado
- **Permissão de Trabalho (PT)** — bloqueio automático para certificados vencidos ou inexistentes
- **Alertas automáticos** por e-mail 30, 15 e 7 dias antes do vencimento (via n8n)
- **Dashboard** com resumo de conformidade para Admin/HSE e painel individual para funcionários
- **Acessibilidade** — modo daltônico, ajuste de fonte e integração com VLibras (Libras)

---

## 👥 Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **Admin** | Acesso total — usuários, treinamentos, certificados e PTs |
| **HSE** | Treinamentos, certificados, emissão e gestão de PTs |
| **Funcionário** | Visualização dos próprios certificados, PTs e treinamentos disponíveis |

---

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- MySQL (mysql2)
- JWT (jsonwebtoken)
- bcryptjs
- node-cron
- Nodemailer
- Axios (integração n8n)

### Frontend
- React + Vite
- React Router DOM
- Tailwind CSS
- Lucide React
- Axios

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- Node.js v18+
- MySQL 8+
- npm

### 1. Clone o repositório

```bash
git clone https://github.com/phphphph77/SafeTrack.git
cd SafeTrack
```

### 2. Configure o banco de dados

Abra o MySQL Workbench (ou terminal) e execute:

```bash
mysql -u root -p < database.sql
```

### 3. Configure as variáveis de ambiente

Crie o arquivo `.env` dentro da pasta `Backend/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=safetrack
DB_PORT=3306

JWT_SECRET=safetrack_chave_secreta
JWT_EXPIRES_IN=8h

PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:5173

N8N_WEBHOOK_URL=
```

### 4. Instale as dependências

**Backend:**
```bash
cd Backend
npm install
```

**Frontend:**
```bash
cd Frontend
npm install
```

### 5. Inicie o projeto

**Terminal 1 — Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
```

Acesse **http://localhost:5173**

---

## 🔑 Usuários padrão

| Perfil | E-mail | Senha |
|---|---|---|
| Admin | admin@safetrack.com | Admin@123 |
| HSE | hse@safetrack.com | Admin@123 |
| Funcionário | joao@safetrack.com | Admin@123 |

---

## 📁 Estrutura do Projeto

```
SafeTrack/
├── Backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usuarioController.js
│   │   ├── treinamentoController.js
│   │   ├── certificadoController.js
│   │   └── ptController.js
│   ├── jobs/
│   │   └── cronJob.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── usuarioRoutes.js
│   │   ├── treinamentoRoutes.js
│   │   ├── certificadoRoutes.js
│   │   └── ptRoutes.js
│   ├── .env
│   ├── .env.example
│   └── server.js
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── PainelAcessibilidade.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── contexts/
│   │   │   └── AcessibilidadeContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Usuarios.jsx
│   │   │   ├── Treinamentos.jsx
│   │   │   ├── Certificados.jsx
│   │   │   └── PermissaoTrabalho.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
└── database.sql
```

---

## ♿ Acessibilidade

O sistema foi desenvolvido com foco em inclusão:

- **Modo daltônico** — reestiliza toda a interface via CSS custom properties
- **Ajuste de fonte** — escalonamento proporcional via unidade `rem`
- **VLibras** — plugin oficial do Governo Federal para tradução em Língua Brasileira de Sinais
- Navegação por teclado e foco visível em todos os elementos interativos
- Conformidade com as diretrizes **WCAG 2.1**

---

## 📄 Licença

Projeto acadêmico desenvolvido para o curso de Farmácia — uso educacional.

---

Desenvolvido por **Phelipe Almeida**
