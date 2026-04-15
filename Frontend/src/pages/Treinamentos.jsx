import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BookOpen, Clock, Calendar, ExternalLink, LinkIcon, X, Pencil } from 'lucide-react';
import api from '../services/api';

export default function Treinamentos() {
  const [treinamentos, setTreinamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalLink, setModalLink] = useState(null); // treinamento sendo editado
  const [novoLink, setNovoLink] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucessoLink, setSucessoLink] = useState('');

  const usuario = JSON.parse(localStorage.getItem('hse_usuario') || '{}');
  const podeEditar = usuario.role === 'admin' || usuario.role === 'hse';

  const carregarTreinamentos = () => {
    setCarregando(true);
    api.get('/treinamentos')
      .then(r => setTreinamentos(r.data.treinamentos || []))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { carregarTreinamentos(); }, []);

  const abrirModalLink = (treinamento) => {
    setModalLink(treinamento);
    setNovoLink(treinamento.link_curso || '');
    setSucessoLink('');
  };

  const salvarLink = async () => {
    if (!modalLink) return;
    setSalvando(true);
    setSucessoLink('');
    try {
      await api.patch(`/treinamentos/${modalLink.id}/link`, { link_curso: novoLink });
      setSucessoLink('✅ Link salvo com sucesso!');
      carregarTreinamentos();
      setTimeout(() => setModalLink(null), 1200);
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao salvar link.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catálogo de Treinamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Treinamentos HSE cadastrados no sistema</p>
        </div>

        {carregando ? (
          <div className="text-center py-12 text-sm text-gray-500">Carregando...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {treinamentos.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
                {/* Header do card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-teal-50">
                    <BookOpen size={18} className="text-teal-700" />
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    t.obrigatorio ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t.obrigatorio ? 'Obrigatório' : 'Opcional'}
                  </span>
                </div>

                {/* Nome e descrição */}
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{t.nome}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">
                  {t.descricao || 'Sem descrição.'}
                </p>

                {/* Carga e validade */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {t.carga_horaria}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Validade: {t.validade_meses} meses
                  </span>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 mt-auto">
                  {/* Botão acessar curso */}
                  {t.link_curso ? (
                    <a
                      href={t.link_curso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors"
                    >
                      <ExternalLink size={13} />
                      Acessar Curso
                    </a>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 text-gray-400 text-xs cursor-not-allowed">
                      <LinkIcon size={13} />
                      Sem link cadastrado
                    </div>
                  )}

                  {/* Botão editar link (apenas admin/hse) */}
                  {podeEditar && (
                    <button
                      onClick={() => abrirModalLink(t)}
                      title="Editar link do curso"
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-teal-700 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal editar link */}
      {modalLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Editar Link do Curso</h2>
                <p className="text-xs text-gray-500 mt-0.5">{modalLink.nome}</p>
              </div>
              <button onClick={() => setModalLink(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {sucessoLink && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                  {sucessoLink}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da plataforma do curso
                </label>
                <input
                  type="url"
                  value={novoLink}
                  onChange={e => setNovoLink(e.target.value)}
                  placeholder="https://plataforma.com/curso-nr35"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Cole a URL completa incluindo https://
                </p>
              </div>

              {/* Preview do link */}
              {novoLink && (
                <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <ExternalLink size={14} className="text-teal-600 shrink-0" />
                  <a
                    href={novoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-700 hover:underline truncate"
                  >
                    {novoLink}
                  </a>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalLink(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarLink}
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors"
                >
                  {salvando ? 'Salvando...' : 'Salvar Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}