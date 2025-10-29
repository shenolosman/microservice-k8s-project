import React, { useEffect, useState } from 'react';
import { listUsersRequest } from '../api/auth.js';

export default function UsersPage({ token }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await listUsersRequest(token);
        if (!cancelled) setUsers(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Username</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-2 border">{u.username}</td>
                <td className="px-4 py-2 border">{u.role}</td>
                <td className="px-4 py-2 border font-mono text-xs">{u.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


