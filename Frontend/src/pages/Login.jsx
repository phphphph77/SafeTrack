import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarRH, setMostrarRH] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setErro('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('hse_token', data.token);
      localStorage.setItem('hse_usuario', JSON.stringify(data.usuario));
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-teal-700 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-4">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Portal HSE</h1>
            <p className="text-teal-200 text-sm mt-1">Treinamento e Certificações de Segurança</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Entrar na sua conta</h2>

            {erro && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                             transition-colors placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.senha}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-12 rounded-lg border border-gray-300 text-sm
                               focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                               transition-colors placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Esqueceu a senha */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setMostrarRH(v => !v)}
                  className="text-sm text-teal-700 underline hover:text-teal-900 transition-colors bg-transparent border-none cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {mostrarRH && (
                <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">
                  <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                  <span>Para redefinir sua senha, contate sua equipe de RH.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 px-6 rounded-lg bg-teal-700 text-white text-sm font-semibold
                           hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                           disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Portal de Treinamento HSE © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}