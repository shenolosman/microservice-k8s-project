import React, { useState } from 'react';

export default function AuthForm({ onSubmit, switchMode, registerMode, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
      >
        {registerMode ? 'Register' : 'Login'}
      </button>
      <div className="text-sm mt-2">
        {registerMode ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={switchMode} className="text-blue-500 underline">
              Login
            </button>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <button type="button" onClick={switchMode} className="text-blue-500 underline">
              Register
            </button>
          </>
        )}
      </div>
    </form>
  );
}

