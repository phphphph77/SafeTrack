import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Award, Plus, X, Trash2, AlertTriangle, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function Certificados() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [treinamentos, setTreinamentos] = useState([]);
  const [certificados, setCertificados] = useState([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoCerts, setCarregandoCerts] = useState(false);
  const [carregandoExcluir, setCarregandoExcluir] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    usuario_id: '', treinamento_id: '', data_emissao: '', observacoes: '',
  });

  useEffect(() => {
    api.get('/usuarios').then(r => setFuncionarios(r.data.funcionarios || []));
    api.get('/treinamentos').then(r => setTreinamentos(r.data.treinamentos || []));
  }, []);

  // Carrega certificados quando seleciona funcionário
  useEffect(() => {
    if (!funcionarioSelecionado) {
      setCertificados([]);
      return;
    }
    setCarregandoCerts(true);
    api.get(`/certificados/funcionario/${funcionarioSelecionado}`)
      .then(r => setCertificados(r.data.certificados || []))
      .finally(() => setCarregandoCerts(false));
  }, [funcionarioSelecionado]);

  const handleChange = e => {
    setErro(''); setSucesso('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro(''); setSucesso(''); setCarregando(true);
    try {
      const { data } = await api.post('/certificados', form);
      setSucesso(`✅ Certificado emitido! Vencimento: ${new Date(data.data_validade).toLocaleDateString('pt-BR')} — Código: ${data.codigo}`);
      setForm({ usuario_id: '', treinamento_id: '', data_emissao: '', observacoes: '' });
      // Recarrega lista se o funcionário emitido estiver selecionado
      if (funcionarioSelecionado === form.usuario_id) {
        api.get(`/certificados/funcionario/${funcionarioSelecionado}`)
          .then(r => setCertificados(r.data.certificados || []));
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao emitir certificado.');
    } finally {
      setCarregando(false);
    }
  };

  const handleExcluir = async () => {
    if (!modalExcluir) return;
    setCarregandoExcluir(true);
    try {
      await api.delete(`/certificados/${modalExcluir.id}`);
      setModalExcluir(null);
      // Recarrega a lista
      api.get(`/certificados/funcionario/${funcionarioSelecionado}`)
        .then(r => setCertificados(r.data.certificados || []));
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao remover certificado.');
    } finally {
      setCarregandoExcluir(false);
    }
  };

  const nomeFuncionario = funcionarios.find(f => String(f.id) === String(funcionarioSelecionado))?.nome;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificados</h1>
            <p className="text-sm text-gray-500 mt-1">Emita e gerencie certificados de treinamento</p>
          </div>
          <button
            onClick={() => { setModalAberto(true); setErro(''); setSucesso(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors"
          >
            <Plus size={16} /> Novo Certificado
          </button>
        </div>

        {/* Filtro por funcionário */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search size={14} className="inline mr-1.5 text-gray-400" />
            Consultar certificados de um funcionário
          </label>
          <select
            value={funcionarioSelecionado}
            onChange={e => setFuncionarioSelecionado(e.target.value)}
            className="w-full sm:w-80 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Selecione um funcionário...</option>
            {funcionarios.map(f => (
              <option key={f.id} value={f.id}>{f.nome} ({f.role})</option>
            ))}
          </select>
        </div>

        {/* Lista de certificados do funcionário selecionado */}
        {funcionarioSelecionado && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Certificados de <span className="text-teal-700">{nomeFuncionario}</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{certificados.length} certificado(s) encontrado(s)</p>
              </div>
            </div>

            {carregandoCerts ? (
              <div className="p-10 text-center text-sm text-gray-500">Carregando...</div>
            ) : certificados.length === 0 ? (
              <div className="p-10 text-center">
                <Award size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">Nenhum certificado encontrado para este funcionário.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Treinamento</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Emissão</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Vencimento</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Código</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {certificados.map(cert => {
                      const situacao = cert.status === 'cancelado'
                        ? 'cancelada'
                        : new Date(cert.data_validade) < new Date()
                        ? 'vencido'
                        : 'valido';
                      return (
                        <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">{cert.treinamento_nome}</td>
                          <td className="px-6 py-3 text-gray-600 tabular-nums">
                            {new Date(cert.data_emissao).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-3 tabular-nums">
                            <span className={new Date(cert.data_validade) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {new Date(cert.data_validade).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-gray-500 max-w-xs truncate">
                            {cert.codigo || '—'}
                          </td>
                          <td className="px-6 py-3">
                            <StatusBadge situacao={situacao} />
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => setModalExcluir(cert)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                            >
                              <Trash2 size={13} />
                              Remover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Estado vazio inicial */}
        {!funcionarioSelecionado && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <Award size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">Selecione um funcionário acima para ver seus certificados.</p>
          </div>
        )}
      </div>

      {/* Modal emissão */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Emitir Certificado</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {sucesso && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{sucesso}</div>}
              {erro    && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{erro}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário *</label>
                <select name="usuario_id" value={form.usuario_id} onChange={handleChange} required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Selecione...</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treinamento *</label>
                <select name="treinamento_id" value={form.treinamento_id} onChange={handleChange} required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Selecione...</option>
                  {treinamentos.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.validade_meses} meses)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão *</label>
                <input type="date" name="data_emissao" value={form.data_emissao} onChange={handleChange} required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={carregando}
                  className="flex-1 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors">
                  {carregando ? 'Emitindo...' : 'Emitir Certificado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmação de remoção */}
      {modalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Remover certificado?</h2>
              <p className="text-sm text-gray-500 mb-1">Treinamento:</p>
              <p className="text-sm font-semibold text-gray-800 mb-1">{modalExcluir.treinamento_nome}</p>
              <p className="text-xs text-gray-500 mb-1">
                Vencimento: {new Date(modalExcluir.data_validade).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs text-red-500 mt-3 mb-6">
                ⚠️ O certificado será cancelado. PTs vinculadas a ele podem ser afetadas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalExcluir(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={carregandoExcluir}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {carregandoExcluir ? 'Removendo...' : 'Sim, remover'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}