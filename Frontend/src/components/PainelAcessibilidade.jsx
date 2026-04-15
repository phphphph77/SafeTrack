import { useState } from 'react';
import { Accessibility, X, Eye, Type } from 'lucide-react';
import { useAcessibilidade } from '../contexts/AcessibilidadeContext';


export default function PainelAcessibilidade() {
  const [aberto, setAberto] = useState(false);
  const { tema, setTema, fonteGrande, setFonteGrande } = useAcessibilidade();


  const temas = [
    { id: 'normal',         label: 'Padrão',        icon: '🎨', desc: 'Visual original do sistema' },
    { id: 'alto-contraste', label: 'Alto Contraste', icon: '⚫', desc: 'Fundo escuro, texto nítido'  },
  ];

  const tiposDaltonismo = [
    { id: '',                       label: 'Sem ajuste'                                },
    { id: 'daltonico-deuteranopia', label: 'Deuteranopia (dificuldade com verde)'      },
    { id: 'daltonico-protanopia',   label: 'Protanopia (dificuldade com vermelho)'     },
    { id: 'daltonico-tritanopia',   label: 'Tritanopia (dificuldade com azul/amarelo)' },
    { id: 'daltonico-acromato',     label: 'Acromatopsia (sem cores)'                  },
  ];

  const daltonicoSelecionado = tema.startsWith('daltonico-') ? tema : '';


  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(true)}
        title="Opções de Acessibilidade"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-teal-700 text-white shadow-lg hover:bg-teal-800 transition-all flex items-center justify-center"
        aria-label="Abrir painel de acessibilidade"
      >
        <Accessibility size={22} />
      </button>


      {/* Painel lateral */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex justify-end">

          {/* Overlay */}
          <div
            className="flex-1 bg-black/30"
            onClick={() => setAberto(false)}
          />

          {/* Painel */}
          <div className="w-80 bg-white h-full shadow-2xl flex flex-col">

            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Accessibility size={18} className="text-teal-700" />
                <h2 className="text-sm font-semibold text-gray-900">Acessibilidade</h2>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Tema Visual */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={15} className="text-gray-500" />
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Tema Visual
                  </h3>
                </div>
                <div className="space-y-2">
                  {temas.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTema(t.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        tema === t.id
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${tema === t.id ? 'text-teal-700' : 'text-gray-800'}`}>
                          {t.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      </div>
                      {tema === t.id && (
                        <div className="w-4 h-4 rounded-full bg-teal-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo Daltônico */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={15} className="text-gray-500" />
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Modo Daltônico
                  </h3>
                </div>
                <select
                  value={daltonicoSelecionado}
                  onChange={(e) => setTema(e.target.value || 'normal')}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-teal-500 transition-colors"
                >
                  {tiposDaltonismo.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2 pl-1">
                  Adapta as cores do sistema para cada tipo de daltonismo.
                </p>
              </div>

              {/* Tamanho de fonte */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type size={15} className="text-gray-500" />
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Tamanho de Fonte
                  </h3>
                </div>
                <button
                  onClick={() => setFonteGrande(!fonteGrande)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                    fonteGrande
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔤</span>
                    <div>
                      <p className={`text-sm font-medium ${fonteGrande ? 'text-teal-700' : 'text-gray-800'}`}>
                        Fonte Aumentada
                      </p>
                      <p className="text-xs text-gray-500">Aumenta o texto em 10%</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${fonteGrande ? 'bg-teal-600' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full mt-1 shadow transition-transform ${fonteGrande ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </button>
              </div>

              {/* Dica */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-700">
                  💡 As preferências são salvas automaticamente e aplicadas ao reabrir o sistema.
                </p>
              </div>

            </div>

            {/* Rodapé — resetar */}
            <div className="px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => { setTema('normal'); setFonteGrande(false); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Restaurar padrão
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}