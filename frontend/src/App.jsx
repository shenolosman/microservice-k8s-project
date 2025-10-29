import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginRequest, registerRequest } from './api/auth.js';
import AuthPage from './pages/AuthPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import UsersPage from './pages/UsersPage.jsx';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");
  const [authError, setAuthError] = useState("");
  const [registerMode, setRegisterMode] = useState(false);

  const login = async (user, pass) => {
    setAuthError("");
    try {
      const data = await loginRequest(user, pass);
      setToken(data.token);
      setUsername(user);
      setRole(data.role || "");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", user);
      if (data.role) localStorage.setItem("role", data.role);
    } catch (err) {
      setAuthError(err.message || "Login error");
    }
  };

  const register = async (user, pass) => {
    setAuthError("");
    try {
      await registerRequest(user, pass);
      // automatically login after registration
      await login(user, pass);
    } catch (err) {
      setAuthError(err.message || "Registration error");
    }
  };

  const logout = () => {
    setToken("");
    setUsername("");
    setRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  };

  function AppShell() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleAuthSubmit = async (usernameInput, passwordInput) => {
      const isRegister = registerMode;
      if (isRegister) {
        await register(usernameInput, passwordInput);
      } else {
        await login(usernameInput, passwordInput);
      }
      if (localStorage.getItem('token')) {
        const dest = (location.state && location.state.from) || '/';
        navigate(dest, { replace: true });
      }
    };

    return (
      <Routes>
        <Route element={<AppLayout token={token} username={username} role={role} onLogout={logout} /> }>
          <Route index element={
            <ProductsPage token={token} />
          } />
          <Route path="auth" element={
            <AuthPage
              onSubmit={handleAuthSubmit}
              switchMode={() => setRegisterMode(!registerMode)}
              registerMode={registerMode}
              error={authError}
            />
          } />
          <Route path="orders" element={
            <ProtectedRoute token={token} role={role}>
              <OrdersPage token={token} />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute token={token} role={role} requireRole="admin">
              <UsersPage token={token} />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
