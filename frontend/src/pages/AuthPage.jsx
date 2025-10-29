import React from 'react';
import AuthForm from '../components/AuthForm.jsx';

export default function AuthPage({ onSubmit, switchMode, registerMode, error }) {
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl mb-4">{registerMode ? 'Register' : 'Login'}</h2>
      {!registerMode && (
        <div className="text-sm text-gray-600 mb-3">Demo credentials: admin / admin123</div>
      )}
      <AuthForm
        onSubmit={onSubmit}
        switchMode={switchMode}
        registerMode={registerMode}
        error={error}
      />
    </div>
  );
}

