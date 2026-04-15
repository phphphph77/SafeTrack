import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Treinamentos from './pages/Treinamentos';
import Certificados from './pages/Certificados';
import PermissaoTrabalho from './pages/PermissaoTrabalho';
import ProtectedRoute from './components/ProtectedRoute';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route
  path="/usuarios"
  element={
    <ProtectedRoute roles={['admin']}>
      <Usuarios />
    </ProtectedRoute>
  }
/>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treinamentos"
          element={
            <ProtectedRoute roles={['admin', 'hse']}>
              <Treinamentos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificados"
          element={
            <ProtectedRoute roles={['admin', 'hse']}>
              <Certificados />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pt"
          element={
            <ProtectedRoute roles={['admin', 'hse']}>
              <PermissaoTrabalho />
            </ProtectedRoute>
            
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    
  );
}