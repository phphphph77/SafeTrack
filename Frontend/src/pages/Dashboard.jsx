import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  Users, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Award, BookOpen, ExternalLink, Clock, Calendar, ClipboardList
} from 'lucide-react';
import api from '../services/api';


function calcularStatusPT(pt) {
  if (pt.status === 'cancelada')   return 'cancelada';
  if (pt.status === 'concluida')   return 'concluida';
  if (pt.status === 'em_execucao') return 'em_execucao';
  const dataRef = pt.data_fim || pt.data_inicio;
  if (dataRef && new Date(dataRef) < new Date()) return 'vencida';
  return pt.status;
}

const STATUS_MAP = {
  aprovada:    { label: 'Aprovada',     cls: 'bg-green-100 text-green-700'   },
  pendente:    { label: 'Pendente',     cls: 'bg-gray-100 text-gray-600'     },
  em_execucao: { label: 'Em Execução',  cls: 'bg-blue-100 text-blue-700'     },
  concluida:   { label: 'Concluída',    cls: 'bg-teal-100 text-teal-700'     },
  cancelada:   { label: 'Cancelada',    cls: 'bg-red-100 text-red-600'       },
  vencida:     { label: 'Vencida',      cls: 'bg-orange-100 text-orange-700' },
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

function StatusBadgeLocal({ situacao }) {
  const map = {
    valido:          { label: 'Válido',          cls: 'bg-green-100 text-green-700'  },
    vencendo:        { label: 'Vencendo',         cls: 'bg-yellow-100 text-yellow-700'},
    vencido:         { label: 'Vencido',          cls: 'bg-red-100 text-red-600'     },
    sem_certificado: { label: 'Sem Certificado',  cls: 'bg-gray-100 text-gray-500'   },
    cancelada:       { label: 'Cancelado',        cls: 'bg-red-100 text-red-600'     },
  };
  const { label, cls } = map[situacao] || { label: situacao, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Dashboard do FUNCIONÁRIO ────────────────────────────────
function DashboardFuncionario({ usuario }) {
  const [certificados, setCertificados] = useState([]);
  const [treinamentos, setTreinamentos] = useState([]);
  const [pts, setPts] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/certificados/funcionario/${usuario.id}`),
      api.get('/treinamentos'),
      api.get('/pt'),
    ]).then(([certRes, treinRes, ptRes]) => {
      setCertificados(certRes.data.certificados || []);
      setTreinamentos(treinRes.data.treinamentos || []);
      setPts(ptRes.data.permissoes || []);
    }).finally(() => setCarregando(false));
  }, []);

  const stats = useMemo(() => {
    const ativos   = certificados.filter(c => c.status !== 'cancelado');
    const hoje     = new Date(); hoje.setHours(0,0,0,0);
    const validos  = ativos.filter(c => new Date(c.data_validade) >= hoje).length;
    const vencidos = ativos.filter(c => new Date(c.data_validade) < hoje).length;
    return { total: ativos.length, validos, vencidos };
  }, [certificados]);

  if (carregando) {
    return (
      <Layout>
        <div className="text-center py-20 text-sm text-gray-500">Carregando seus dados...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Boas-vindas */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {usuario.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold">Olá, {usuario.nome.split(' ')[0]}!</h1>
              <p className="text-teal-100 text-sm mt-0.5">Portal HSE — Seus treinamentos e certificações</p>
            </div>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Certificados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.validos}</p>
            <p className="text-xs text-gray-500 mt-1">Válidos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
            <p className="text-xs text-gray-500 mt-1">Vencidos</p>
          </div>
        </div>

        {/* Meus Certificados */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Award size={16} className="text-teal-700" />
            <h2 className="text-sm font-semibold text-gray-900">Meus Certificados</h2>
          </div>

          {certificados.filter(c => c.status !== 'cancelado').length === 0 ? (
            <div className="p-10 text-center">
              <Award size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500">Você ainda não possui certificados.</p>
              <p className="text-xs text-gray-400 mt-1">Entre em contato com o setor HSE.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Treinamento</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Emissão</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Vencimento</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {certificados
                    .filter(c => c.status !== 'cancelado')
                    .map(cert => {
                      const hoje = new Date(); hoje.setHours(0,0,0,0);
                      const validade = new Date(cert.data_validade); validade.setHours(0,0,0,0);
                      const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
                      const vencido = diasRestantes < 0;
                      const situacao = vencido ? 'vencido' : diasRestantes === 0 ? 'vencido' : diasRestantes <= 30 ? 'vencendo' : 'valido';
                      return (
                        <tr
                          key={cert.id}
                          className={`transition-colors ${
                            vencido || diasRestantes === 0 ? 'bg-red-50'    :
                            diasRestantes <= 30            ? 'bg-yellow-50' :
                            'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-3 font-medium text-gray-900">{cert.treinamento_nome}</td>
                          <td className="px-6 py-3 text-gray-600 tabular-nums">
                            {new Date(cert.data_emissao).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-3 tabular-nums">
                            <span className={
                              vencido || diasRestantes === 0 ? 'text-red-600 font-semibold'    :
                              diasRestantes <= 30            ? 'text-yellow-600 font-semibold' :
                              'text-gray-600'
                            }>
                              {new Date(cert.data_validade).toLocaleDateString('pt-BR')}
                            </span>
                            {!vencido && diasRestantes > 0 && diasRestantes <= 30 && (
                              <span className="ml-2 text-xs text-yellow-600">({diasRestantes}d)</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <StatusBadgeLocal situacao={situacao} />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Minhas Permissões de Trabalho */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <ClipboardList size={16} className="text-teal-700" />
            <h2 className="text-sm font-semibold text-gray-900">
              Minhas Permissões de Trabalho
              <span className="ml-2 text-xs font-normal text-gray-400">({pts.length})</span>
            </h2>
          </div>

          {pts.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500">Nenhuma permissão emitida ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Nº PT</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Atividade</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Local</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Início</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pts.map(pt => (
                    <tr key={pt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">{pt.numero_pt}</td>
                      <td className="px-6 py-3 text-gray-700 max-w-xs truncate">{pt.atividade}</td>
                      <td className="px-6 py-3 text-gray-600">{pt.local_trabalho}</td>
                      <td className="px-6 py-3 text-gray-600 tabular-nums">
                        {new Date(pt.data_inicio).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-3">
                        <StatusPT pt={pt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Treinamentos disponíveis */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <BookOpen size={16} className="text-teal-700" />
            <h2 className="text-sm font-semibold text-gray-900">Treinamentos Disponíveis</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {treinamentos.map(t => {
              const hoje = new Date(); hoje.setHours(0,0,0,0);
              const meuCert = certificados.find(
                c =>
                  c.treinamento_id === t.id &&
                  c.status === 'ativo' &&
                  new Date(c.data_validade) >= hoje
              );
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${meuCert ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <BookOpen size={14} className={meuCert ? 'text-green-600' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.nome}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={11} /> {t.carga_horaria}h</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {t.validade_meses} meses</span>
                        {t.obrigatorio
                          ? <span className="text-red-500 font-medium">Obrigatório</span>
                          : <span className="text-gray-400">Opcional</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {meuCert ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle size={13} /> Certificado válido
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Sem certificado</span>
                    )}
                    {t.link_curso && (
                      <a
                        href={t.link_curso}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors"
                      >
                        <ExternalLink size={12} /> Acessar Curso
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
}

// ─── Dashboard ADMIN / HSE ────────────────────────────────────
function DashboardAdmin() {
  const [conformidade, setConformidade] = useState([]);
  const [carregando, setCarregando]     = useState(true);
  const [filtro, setFiltro]             = useState('todos');
  const [busca, setBusca]               = useState('');

  const carregarConformidade = async () => {
    setCarregando(true);
    try {
      const { data } = await api.get('/certificados/conformidade');
      setConformidade(data.conformidade);
    } catch (err) {
      console.error('Erro ao carregar conformidade:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarConformidade(); }, []);

  const stats = useMemo(() => ({
    total:    conformidade.length,
    validos:  conformidade.filter(c => c.situacao === 'valido').length,
    vencidos: conformidade.filter(c => c.situacao === 'vencido').length,
    vencendo: conformidade.filter(c => c.situacao === 'vencendo').length,
    semCert:  conformidade.filter(c => c.situacao === 'sem_certificado').length,
  }), [conformidade]);

  const dadosFiltrados = useMemo(() => {
    return conformidade.filter(c => {
      const passaFiltro = filtro === 'todos' || c.situacao === filtro;
      const passaBusca  = !busca ||
        c.funcionario_nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.treinamento_nome.toLowerCase().includes(busca.toLowerCase());
      return passaFiltro && passaBusca;
    });
  }, [conformidade, filtro, busca]);

  const statCards = [
    { label: 'Total',           value: stats.total,    icon: Users,         cor: 'text-gray-600',   bg: 'bg-gray-100'   },
    { label: 'Válidos',         value: stats.validos,  icon: CheckCircle,   cor: 'text-green-600',  bg: 'bg-green-100'  },
    { label: 'Vencidos',        value: stats.vencidos, icon: XCircle,       cor: 'text-red-600',    bg: 'bg-red-100'    },
    { label: 'Vencendo em 30d', value: stats.vencendo, icon: AlertTriangle, cor: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard de Conformidade</h1>
            <p className="text-sm text-gray-500 mt-1">Situação dos treinamentos obrigatórios por funcionário</p>
          </div>
          <button
            onClick={carregarConformidade}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, cor, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-3`}>
                <Icon size={20} className={cor} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 flex-1">Conformidade por Funcionário</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
              />
              <select
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="todos">Todos</option>
                <option value="valido">Válidos</option>
                <option value="vencendo">Vencendo</option>
                <option value="vencido">Vencidos</option>
                <option value="sem_certificado">Sem Certificado</option>
              </select>
            </div>
          </div>

          {carregando ? (
            <div className="p-12 text-center text-gray-500 text-sm">Carregando dados...</div>
          ) : dadosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">Nenhum registro encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Funcionário</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Treinamento</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Vencimento</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Dias Restantes</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dadosFiltrados.map((row, idx) => {
                    const dataVenc = row.data_validade
                      ? new Date(row.data_validade).toLocaleDateString('pt-BR')
                      : '—';
                    const dias = row.dias_restantes;
                    const rowCor =
                      row.situacao === 'vencido' || row.situacao === 'sem_certificado' ? 'bg-red-50'    :
                      row.situacao === 'vencendo'                                      ? 'bg-yellow-50' : '';
                    return (
                      <tr key={idx} className={`hover:bg-gray-50 transition-colors ${rowCor}`}>
                        <td className="px-6 py-3 font-medium text-gray-900">{row.funcionario_nome}</td>
                        <td className="px-6 py-3 text-gray-600">{row.treinamento_nome}</td>
                        <td className="px-6 py-3 text-gray-600 tabular-nums">{dataVenc}</td>
                        <td className="px-6 py-3 tabular-nums">
                          {dias !== null && dias !== undefined ? (
                            <span className={
                              dias < 0  ? 'text-red-600 font-semibold'    :
                              dias === 0 ? 'text-red-600 font-semibold'   :
                              dias <= 30 ? 'text-yellow-600 font-semibold' :
                              'text-gray-600'
                            }>
                              {dias < 0
                                ? `Vencido há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}`
                                : dias === 0
                                ? 'Vence hoje'
                                : `${dias} dias`}
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadgeLocal situacao={row.situacao} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem('hse_usuario') || '{}');
  if (usuario.role === 'funcionario') return <DashboardFuncionario usuario={usuario} />;
  return <DashboardAdmin />;
}