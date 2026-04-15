import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import PainelAcessibilidade from './PainelAcessibilidade';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('hse_usuario') || '{}');

  const navItems = useMemo(() => {
    const itens = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'hse', 'funcionario'],
      },
      {
        path: '/usuarios',
        label: 'Usuários',
        icon: Users,
        roles: ['admin'],
      },
      {
        path: '/treinamentos',
        label: 'Treinamentos',
        icon: BookOpen,
        roles: ['admin', 'hse'],
      },
      {
        path: '/certificados',
        label: 'Certificados',
        icon: Award,
        roles: ['admin', 'hse'],
      },
      {
        path: '/pt',
        label: 'Permissões de Trab.',
        icon: ClipboardList,
        roles: ['admin', 'hse'],
      },
    ];

    return itens.filter(item => item.roles.includes(usuario.role));
  }, [usuario.role]);

  const handleLogout = () => {
    localStorage.removeItem('hse_token');
    localStorage.removeItem('hse_usuario');
    navigate('/login');
  };

  const nomeCurto = usuario?.nome
    ? usuario.nome.length > 22
      ? `${usuario.nome.slice(0, 22)}...`
      : usuario.nome
    : 'Usuário';

  const iniciais = usuario?.nome
    ? usuario.nome
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0]?.toUpperCase())
        .join('')
    : 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Botão mobile */}
      <button
        onClick={() => setSidebarAberta(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarAberta(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200
          flex flex-col transition-transform duration-300
          ${sidebarAberta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        role="region"
        aria-label="Menu lateral"
        tabIndex={0}
      >
        {/* Topo */}
        <div className="h-20 px-5 border-b border-gray-200 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Portal HSE</p>
              <p className="text-xs text-gray-500">Treinamentos</p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarAberta(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const ativo = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarAberta(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${
                    ativo
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {iniciais}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{nomeCurto}</p>
              <p className="text-xs text-gray-500 capitalize">{usuario?.role || 'usuário'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 min-w-0">
        <div className="p-4 pt-20 lg:pt-6 lg:p-6">
          {children}
        </div>
      </main>

      <PainelAcessibilidade />
    </div>
  );
}