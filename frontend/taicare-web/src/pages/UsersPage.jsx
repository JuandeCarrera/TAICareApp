import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser } from '../api/users.js';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  & th, & td { padding: 0.5rem; border: 1px solid ${({ theme }) => theme.colors.fg}; }
`;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const name = prompt('Nombre:');
    const email = prompt('Email:');
    if (!name || !email) return;
    try {
      const newUser = await createUser({ name, email, role: 'paciente', household_id: '' });
      setUsers(prev => [...prev, newUser]);
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (error)   return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Usuarios</h2>
      <button onClick={handleAdd}>+ Nuevo Usuario</button>
      <Table>
        <thead>
          <tr><th>Nombre</th><th>Email</th><th>Rol</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}