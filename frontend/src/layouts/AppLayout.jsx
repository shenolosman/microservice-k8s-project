import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AppLayout({ token, username, role, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <nav className="bg-blue-500 text-white p-4 flex justify-between">
        <div className="font-bold"><Link to="/">Microshop</Link></div>
        <div>
          <Link className="mx-2 hover:underline" to="/">Products</Link>
          {token && (
            <Link className="mx-2 hover:underline" to="/orders">My Orders</Link>
          )}
          {token && role === 'admin' && (
            <Link className="mx-2 hover:underline" to="/users">Users</Link>
          )}
          {token ? (
            <>
              <span className="mx-2 italic">{username}</span>
              <button className="mx-2 hover:underline" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <Link className="mx-2 hover:underline" to="/auth">Login</Link>
          )}
        </div>
      </nav>
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}

