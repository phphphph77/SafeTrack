import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { ClipboardList, Plus, X, AlertCircle, CheckCircle, Trash2, AlertTriangle, Search, Play, CheckSquare } from 'lucide-react';
import api from '../services/api';

function calcularStatusPT(pt) {
  if (pt.status === 'cancelada') return 'cancelada';
  if (pt.status === 'concluida') return 'concluida';

  // ← mova esta checagem para cá (antes do em_execucao)
  const dataRef = pt.data_fim || pt.data_inicio;
  if (dataRef && new Date(dataRef) < new Date()) return 'vencida';

  if (pt.status === 'em_execucao') return 'em_execucao';
  return pt.status;
}

const STATUS_MAP = {
  aprovada:    { label: 'Aprovada',    cls: 'bg-green-100 text-green-700'   },
  pendente:    { label: 'Pendente',    cls: 'bg-gray-100 text-gray-600'     },
  em_execucao: { label: 'Em Execução', cls: 'bg-blue-100 text-blue-700'     },
  concluida:   { label: 'Concluída',   cls: 'bg-teal-100 text-teal-700'     },
  cancelada:   { label: 'Cancelada',   cls: 'bg-red-100 text-red-600'       },
  vencida:     { label: 'Vencida',     cls: 'bg-orange-100 text-orange-700' },
};

function StatusPT({ pt }) {
  const key = calcularStatusPT(pt);
  const { label, cls } = STATUS_MAP[key] || { label: key, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// Ações disponíveis por status
function AcoesPT({ pt, onCancelar, onIniciar, onConcluir }) {
  const status = calcularStatusPT(pt);

  if (status === 'cancelada' || status === 'concluida' || status === 'vencida') {
    return <span className="text-xs text-gray-400 italic">—</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Pendente → pode iniciar ou cancelar */}
      {status === 'pendente' && (
        <>
          <button
            onClick={() => onIniciar(pt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
          >
            <Play size={12} /> Iniciar
          </button>
          <button
            onClick={() => onCancelar(pt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <Trash2 size={12} /> Cancelar
          </button>
        </>
      )}

      {/* Aprovada → pode iniciar ou cancelar */}
      {status === 'aprovada' && (
        <>
          <button
            onClick={() => onIniciar(pt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
          >
            <Play size={12} /> Iniciar
          </button>
          <button
            onClick={() => onCancelar(pt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <Trash2 size={12} /> Cancelar
          </button>
        </>
      )}

      {/* Em Execução → pode concluir ou cancelar */}
      {status === 'em_execucao' && (
        <>
          <button
            onClick={() => onConcluir(pt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-600 hover:bg-teal-50 border border-teal-200 transition-colors"
          >
            <CheckSquare size={12} /> Concluir
          </button>
          <button
            onClick={() => onCancelar(pt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <Trash2 size={12} /> Cancelar
          </button>
        </>
      )}
    </div>
  );
}

export default function PermissaoTrabalho() {
  const [pts, setPts]                   = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [treinamentos, setTreinamentos] = useState([]);
  const [modalAberto, setModalAberto]   = useState(false);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [modalIniciar, setModalIniciar]   = useState(null);
  const [modalConcluir, setModalConcluir] = useState(null);
  const [carregando, setCarregando]     = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [carregandoAcao, setCarregandoAcao]   = useState(false);
  const [sucesso, setSucesso]           = useState(null);
  const [erro, setErro]                 = useState('');
  const [erroDetalhe, setErroDetalhe]   = useState(null);

  const [busca, setBusca]               = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroFunc, setFiltroFunc]     = useState('todos');

  const [form, setForm] = useState({
    funcionario_id: '', treinamento_id: '', atividade: '',
    local_trabalho: '', data_inicio: '', data_fim: '', observacoes: '',
  });

  const usuario = JSON.parse(localStorage.getItem('hse_usuario') || '{}');
  const podeGerenciar = usuario.role === 'admin' || usuario.role === 'hse';

  useEffect(() => {
    carregarPTs();
    api.get('/usuarios').then(r =>
      setFuncionarios((r.data.funcionarios || []).filter(f => f.role === 'funcionario' && f.ativo))
    );
    api.get('/treinamentos').then(r => setTreinamentos(r.data.treinamentos || []));
  }, []);

  const carregarPTs = async () => {
    setCarregandoLista(true);
    try {
      const { data } = await api.get('/pt');
      setPts(data.permissoes || []);
    } catch (err) {
      console.error('Erro ao carregar PTs:', err);
    } finally {
      setCarregandoLista(false);
    }
  };

  const funcionariosNasPTs = useMemo(() => {
    const mapa = {};
    pts.forEach(pt => { mapa[pt.funcionario_id] = pt.funcionario_nome; });
    return Object.entries(mapa).map(([id, nome]) => ({ id, nome }));
  }, [pts]);

  const ptsFiltradas = useMemo(() => {
    return pts.filter(pt => {
      const statusReal = calcularStatusPT(pt);
      const passaStatus = filtroStatus === 'todos' || statusReal === filtroStatus;
      const passaFunc   = filtroFunc === 'todos' || String(pt.funcionario_id) === String(filtroFunc);
      const passaBusca  = !busca ||
        pt.numero_pt.toLowerCase().includes(busca.toLowerCase()) ||
        pt.funcionario_nome.toLowerCase().includes(busca.toLowerCase()) ||
        pt.atividade.toLowerCase().includes(busca.toLowerCase()) ||
        pt.local_trabalho.toLowerCase().includes(busca.toLowerCase());
      return passaStatus && passaFunc && passaBusca;
    });
  }, [pts, filtroStatus, filtroFunc, busca]);

  const handleChange = e => {
    setErro(''); setErroDetalhe(null);
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const abrirModal = () => {
    setModalAberto(true); setErro(''); setErroDetalhe(null); setSucesso(null);
    setForm({ funcionario_id: '', treinamento_id: '', atividade: '', local_trabalho: '', data_inicio: '', data_fim: '', observacoes: '' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro(''); setErroDetalhe(null); setSucesso(null); setCarregando(true);
    try {
      const { data } = await api.post('/pt', form);
      setSucesso(data.pt);
      carregarPTs();
    } catch (err) {
      const resposta = err.response?.data;
      if (['CERTIFICADO_VENCIDO', 'SEM_CERTIFICADO', 'FUNCIONARIO_INATIVO'].includes(resposta?.codigo)) {
        setErroDetalhe(resposta);
      } else {
        setErro(resposta?.erro || 'Erro ao emitir PT. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelar = async () => {
    if (!modalCancelar) return;
    setCarregandoAcao(true);
    try {
      await api.delete(`/pt/${modalCancelar.id}`);
      setModalCancelar(null);
      carregarPTs();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao cancelar PT.');
    } finally {
      setCarregandoAcao(false);
    }
  };

  const handleIniciar = async () => {
    if (!modalIniciar) return;
    setCarregandoAcao(true);
    try {
      await api.patch(`/pt/${modalIniciar.id}/status`, { status: 'em_execucao' });
      setModalIniciar(null);
      carregarPTs();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao iniciar PT.');
    } finally {
      setCarregandoAcao(false);
    }
  };

  const handleConcluir = async () => {
    if (!modalConcluir) return;
    setCarregandoAcao(true);
    try {
      await api.patch(`/pt/${modalConcluir.id}/status`, { status: 'concluida' });
      setModalConcluir(null);
      carregarPTs();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao concluir PT.');
    } finally {
      setCarregandoAcao(false);
    }
  };

  const limparFiltros = () => {
    setBusca(''); setFiltroStatus('todos'); setFiltroFunc('todos');
  };

  const temFiltroAtivo = busca || filtroStatus !== 'todos' || filtroFunc !== 'todos';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Permissões de Trabalho</h1>
            <p className="text-sm text-gray-500 mt-1">Emissão bloqueada automaticamente para treinamentos vencidos</p>
          </div>
          {podeGerenciar && (
            <button onClick={abrirModal}
              className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors">
              <Plus size={16} /> Nova PT
            </button>
          )}
        </div>

        {/* Barra de filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nº PT, funcionário, atividade..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Funcionário</label>
              <select
                value={filtroFunc}
                onChange={e => setFiltroFunc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="todos">Todos</option>
                {funcionariosNasPTs.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
            <div className="min-w-40">
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="todos">Todos</option>
                <option value="aprovada">Aprovada</option>
                <option value="pendente">Pendente</option>
                <option value="em_execucao">Em Execução</option>
                <option value="concluida">Concluída</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            {temFiltroAtivo && (
              <button
                onClick={limparFiltros}
                className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
          {temFiltroAtivo && (
            <p className="text-xs text-gray-500 mt-3">
              Exibindo <span className="font-semibold text-teal-700">{ptsFiltradas.length}</span> de{' '}
              <span className="font-semibold">{pts.length}</span> permissões
            </p>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Histórico de Permissões</h2>
            <span className="text-xs text-gray-400">{ptsFiltradas.length} resultado(s)</span>
          </div>

          {carregandoLista ? (
            <div className="p-12 text-center text-sm text-gray-500">Carregando...</div>
          ) : ptsFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">
                {temFiltroAtivo ? 'Nenhuma PT encontrada com os filtros aplicados.' : 'Nenhuma PT emitida ainda.'}
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
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Nº PT</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Funcionário</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Atividade</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Local</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Início</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                    {podeGerenciar && (
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ptsFiltradas.map(pt => {
                    const inativo = pt.funcionario_ativo === 0;
                    return (
                      <tr key={pt.id}
                        className={`transition-colors ${inativo ? 'bg-red-50 opacity-70' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-3 font-mono text-xs text-gray-600">{pt.numero_pt}</td>
                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-900">{pt.funcionario_nome}</div>
                          {inativo && (
                            <span className="text-xs text-red-500 font-medium">⚠ Funcionário inativo</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{pt.atividade}</td>
                        <td className="px-6 py-3 text-gray-600">{pt.local_trabalho}</td>
                        <td className="px-6 py-3 text-gray-600 tabular-nums">
                          {new Date(pt.data_inicio).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-3"><StatusPT pt={pt} /></td>
                        {podeGerenciar && (
                          <td className="px-6 py-3">
                            <AcoesPT
                              pt={pt}
                              onCancelar={setModalCancelar}
                              onIniciar={setModalIniciar}
                              onConcluir={setModalConcluir}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova PT */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Emitir Permissão de Trabalho</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {sucesso && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">PT emitida com sucesso!</p>
                      <p className="text-xs text-green-700 mt-1">Nº {sucesso.numero_pt} — {sucesso.funcionario}</p>
                      <p className="text-xs text-green-700">
                        Certificado válido até: {new Date(sucesso.certificado_validade).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setModalAberto(false)}
                    className="mt-3 w-full py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                    Fechar
                  </button>
                </div>
              )}
              {erroDetalhe && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-800">⛔ Emissão Bloqueada</p>
                      <p className="text-sm text-red-700 mt-1">{erroDetalhe.erro}</p>
                      {erroDetalhe.data_vencimento && (
                        <p className="text-xs text-red-600 mt-2">
                          Vencimento: {new Date(erroDetalhe.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {erroDetalhe.treinamento && (
                        <p className="text-xs text-red-500 mt-2 font-medium">
                          Renove o certificado de "{erroDetalhe.treinamento}" antes de emitir esta PT.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {erro}
                </div>
              )}
              {!sucesso && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário *</label>
                      <select name="funcionario_id" value={form.funcionario_id} onChange={handleChange} required
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Selecione...</option>
                        {funcionarios.map(f => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Apenas funcionários ativos</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Treinamento Exigido *</label>
                      <select name="treinamento_id" value={form.treinamento_id} onChange={handleChange} required
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Selecione...</option>
                        {treinamentos.map(t => (
                          <option key={t.id} value={t.id}>{t.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Atividade *</label>
                    <input type="text" name="atividade" value={form.atividade} onChange={handleChange} required
                      placeholder="Descreva a atividade a ser realizada"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local de Trabalho *</label>
                    <input type="text" name="local_trabalho" value={form.local_trabalho} onChange={handleChange} required
                      placeholder="Ex: Planta A - Setor 3 - Nível 15"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora Início *</label>
                      <input type="datetime-local" name="data_inicio" value={form.data_inicio} onChange={handleChange} required
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora Fim *</label>
                      <input type="datetime-local" name="data_fim" value={form.data_fim} onChange={handleChange} required
                        min={form.data_inicio}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setModalAberto(false)}
                      className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={carregando}
                      className="flex-1 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors">
                      {carregando ? 'Verificando...' : 'Emitir PT'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {modalCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Cancelar PT?</h2>
              <p className="text-sm font-semibold font-mono text-gray-800 mb-1">{modalCancelar.numero_pt}</p>
              <p className="text-xs text-gray-500 mb-1">Funcionário: {modalCancelar.funcionario_nome}</p>
              <p className="text-xs text-gray-500 mb-5">Atividade: {modalCancelar.atividade}</p>
              <p className="text-xs text-red-500 mb-6">⚠️ A PT será marcada como cancelada permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setModalCancelar(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Voltar
                </button>
                <button onClick={handleCancelar} disabled={carregandoAcao}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                  {carregandoAcao ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Iniciar */}
      {modalIniciar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
                <Play size={28} className="text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Iniciar execução?</h2>
              <p className="text-sm font-semibold font-mono text-gray-800 mb-1">{modalIniciar.numero_pt}</p>
              <p className="text-xs text-gray-500 mb-1">Funcionário: {modalIniciar.funcionario_nome}</p>
              <p className="text-xs text-gray-500 mb-6">Atividade: {modalIniciar.atividade}</p>
              <div className="flex gap-3">
                <button onClick={() => setModalIniciar(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Voltar
                </button>
                <button onClick={handleIniciar} disabled={carregandoAcao}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {carregandoAcao ? 'Iniciando...' : 'Sim, iniciar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Concluir */}
      {modalConcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-100 mb-4">
                <CheckSquare size={28} className="text-teal-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Concluir PT?</h2>
              <p className="text-sm font-semibold font-mono text-gray-800 mb-1">{modalConcluir.numero_pt}</p>
              <p className="text-xs text-gray-500 mb-1">Funcionário: {modalConcluir.funcionario_nome}</p>
              <p className="text-xs text-gray-500 mb-6">Atividade: {modalConcluir.atividade}</p>
              <div className="flex gap-3">
                <button onClick={() => setModalConcluir(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Voltar
                </button>
                <button onClick={handleConcluir} disabled={carregandoAcao}
                  className="flex-1 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors">
                  {carregandoAcao ? 'Concluindo...' : 'Sim, concluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}