import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  Users, UserPlus, Search, X, Eye, EyeOff,
  AlertTriangle, CheckCircle, AlertCircle, UserCheck, UserX
} from 'lucide-react';
import api from '../services/api';

const ROLE_MAP = {
  admin:       { label: 'Admin',       cls: 'bg-purple-100 text-purple-700' },
  hse:         { label: 'HSE',         cls: 'bg-blue-100 text-blue-700'     },
  funcionario: { label: 'Funcionário', cls: 'bg-gray-100 text-gray-600'     },
};

function RoleBadge({ role }) {
  const { label, cls } = ROLE_MAP[role] || { label: role, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function Usuarios() {
  const [usuarios, setUsuarios]     = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalToggle, setModalToggle] = useState(null); // usuário a ativar/desativar
  const [salvando, setSalvando]     = useState(false);
  const [sucesso, setSucesso]       = useState('');
  const [erro, setErro]             = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  // Filtros
  const [busca, setBusca]           = useState('');
  const [filtroStatus, setFiltroStatus] = useState('ativos'); // 'ativos' | 'inativos' | 'todos'
  const [filtroRole, setFiltroRole] = useState('todos');

  const [form, setForm] = useState({
    nome: '', email: '', senha: '', role: 'funcionario',
  });

  useEffect(() => { carregarUsuarios(); }, []);

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const { data } = await // Usuarios.jsx — chama com ?todos=true para gestão completa
      api.get('/usuarios?todos=true');
      setUsuarios(data.funcionarios || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setCarregando(false);
    }
  };

  // Stats gerais
  const stats = useMemo(() => ({
    total:    usuarios.length,
    ativos:   usuarios.filter(u => u.ativo).length,
    inativos: usuarios.filter(u => !u.ativo).length,
    admins:   usuarios.filter(u => u.role === 'admin' && u.ativo).length,
    hse:      usuarios.filter(u => u.role === 'hse' && u.ativo).length,
  }), [usuarios]);

  // Aplica filtros
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const passaStatus =
        filtroStatus === 'todos'   ? true :
        filtroStatus === 'ativos'  ? u.ativo :
        filtroStatus === 'inativos'? !u.ativo : true;

      const passaRole = filtroRole === 'todos' || u.role === filtroRole;

      const passaBusca = !busca ||
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase());

      return passaStatus && passaRole && passaBusca;
    });
  }, [usuarios, filtroStatus, filtroRole, busca]);

  const handleChange = e => {
    setErro('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const abrirModal = () => {
    setModalAberto(true);
    setErro(''); setSucesso('');
    setForm({ nome: '', email: '', senha: '', role: 'funcionario' });
    setSenhaVisivel(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro(''); setSucesso(''); setSalvando(true);
    try {
      await api.post('/usuarios', form);
      setSucesso(`Usuário "${form.nome}" criado com sucesso!`);
      carregarUsuarios();
      setForm({ nome: '', email: '', senha: '', role: 'funcionario' });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async () => {
    if (!modalToggle) return;
    setSalvando(true);
    try {
      await api.patch(`/usuarios/${modalToggle.id}/status`, {
        ativo: !modalToggle.ativo,
      });
      setModalToggle(null);
      carregarUsuarios();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao alterar status do usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const limparFiltros = () => {
    setBusca(''); setFiltroStatus('ativos'); setFiltroRole('todos');
  };

  const temFiltroAtivo = busca || filtroStatus !== 'ativos' || filtroRole !== 'todos';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500 mt-1">Controle de todos os usuários do sistema</p>
          </div>
          <button onClick={abrirModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors">
            <UserPlus size={16} /> Novo Usuário
          </button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total',      value: stats.total,    icon: Users,     cor: 'text-gray-600',   bg: 'bg-gray-100',   filtro: 'todos'    },
            { label: 'Ativos',     value: stats.ativos,   icon: UserCheck, cor: 'text-green-600',  bg: 'bg-green-100',  filtro: 'ativos'   },
            { label: 'Inativos',   value: stats.inativos, icon: UserX,     cor: 'text-red-600',    bg: 'bg-red-100',    filtro: 'inativos' },
            { label: 'Admins/HSE', value: stats.admins + stats.hse, icon: Users, cor: 'text-blue-600', bg: 'bg-blue-100', filtro: null },
            { label: 'Funcionários', value: usuarios.filter(u => u.role === 'funcionario').length, icon: Users, cor: 'text-teal-600', bg: 'bg-teal-100', filtro: null },
          ].map(({ label, value, icon: Icon, cor, bg, filtro }) => (
            <button
              key={label}
              onClick={() => filtro && setFiltroStatus(filtro)}
              className={`bg-white rounded-xl border-2 p-4 text-left transition-all ${
                filtro && filtroStatus === filtro
                  ? 'border-teal-500 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              } ${filtro ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
                <Icon size={16} className={cor} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Barra de filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Busca */}
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome ou e-mail..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {busca && (
                  <button onClick={() => setBusca('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filtro status */}
            <div className="min-w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </div>

            {/* Filtro perfil */}
            <div className="min-w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">Perfil</label>
              <select value={filtroRole} onChange={e => setFiltroRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="todos">Todos</option>
                <option value="admin">Admin</option>
                <option value="hse">HSE</option>
                <option value="funcionario">Funcionário</option>
              </select>
            </div>

            {temFiltroAtivo && (
              <button onClick={limparFiltros}
                className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Limpar
              </button>
            )}
          </div>

          {temFiltroAtivo && (
            <p className="text-xs text-gray-500 mt-3">
              Exibindo <span className="font-semibold text-teal-700">{usuariosFiltrados.length}</span> de{' '}
              <span className="font-semibold">{usuarios.length}</span> usuários
            </p>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {filtroStatus === 'ativos'   ? 'Usuários Ativos' :
               filtroStatus === 'inativos' ? 'Usuários Inativos (Histórico)' :
               'Todos os Usuários'}
            </h2>
            <span className="text-xs text-gray-400">{usuariosFiltrados.length} resultado(s)</span>
          </div>

          {carregando ? (
            <div className="p-12 text-center text-sm text-gray-500">Carregando...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">
                {temFiltroAtivo ? 'Nenhum usuário encontrado com os filtros aplicados.' : 'Nenhum usuário cadastrado.'}
              </p>
              {temFiltroAtivo && (
                <button onClick={limparFiltros} className="mt-3 text-xs text-teal-600 hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Usuário</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">E-mail</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Perfil</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Cadastro</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuariosFiltrados.map(u => (
                    <tr key={u.id}
                      className={`transition-colors ${!u.ativo ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${u.ativo ? 'bg-teal-600' : 'bg-gray-400'}`}>
                            {u.nome?.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join('')}
                          </div>
                          <span className={`font-medium ${u.ativo ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                            {u.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{u.email}</td>
                      <td className="px-6 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-6 py-3">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 tabular-nums text-xs">
                        {u.criado_em
                          ? new Date(u.criado_em).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setModalToggle(u)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            u.ativo
                              ? 'text-red-600 border-red-200 hover:bg-red-50'
                              : 'text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          {u.ativo ? <><UserX size={13} /> Desativar</> : <><UserCheck size={13} /> Reativar</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Novo Usuário</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {sucesso && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{sucesso}</p>
                </div>
              )}
              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input type="text" name="nome" value={form.nome} onChange={handleChange} required
                    placeholder="Ex: João da Silva"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="joao@empresa.com"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                  <div className="relative">
                    <input
                      type={senhaVisivel ? 'text' : 'password'}
                      name="senha" value={form.senha} onChange={handleChange} required
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button type="button"
                      onClick={() => setSenhaVisivel(!senhaVisivel)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {senhaVisivel ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
                  <select name="role" value={form.role} onChange={handleChange} required
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="funcionario">Funcionário</option>
                    <option value="hse">HSE</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalAberto(false)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={salvando}
                    className="flex-1 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors">
                    {salvando ? 'Salvando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ativar/Desativar */}
      {modalToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${
                modalToggle.ativo ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {modalToggle.ativo
                  ? <UserX size={28} className="text-red-600" />
                  : <UserCheck size={28} className="text-green-600" />}
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                {modalToggle.ativo ? 'Desativar usuário?' : 'Reativar usuário?'}
              </h2>
              <p className="text-sm text-gray-500 mb-1">{modalToggle.nome}</p>
              <p className="text-xs text-gray-400 mb-4">{modalToggle.email}</p>

              {modalToggle.ativo ? (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-left">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">
                      O usuário perderá acesso ao sistema imediatamente.
                      PTs futuras para ele serão bloqueadas automaticamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-left">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-600">
                      O usuário voltará a ter acesso ao sistema com o mesmo perfil e histórico.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setModalToggle(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleToggleAtivo} disabled={salvando}
                  className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60 transition-colors ${
                    modalToggle.ativo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}>
                  {salvando ? 'Aguarde...' : modalToggle.ativo ? 'Sim, desativar' : 'Sim, reativar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}