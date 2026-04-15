import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('hse_token');
  const usuarioRaw = localStorage.getItem('hse_usuario');

  if (!token || !usuarioRaw) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const usuario = JSON.parse(usuarioRaw);
    if (!roles.includes(usuario.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}