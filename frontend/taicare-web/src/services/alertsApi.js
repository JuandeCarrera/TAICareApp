const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AlertsAPI = {
  async list(params = {}) {
    const usp = new URLSearchParams(params);
    const res = await fetch(`${API}/alerts${usp.toString() ? `?${usp}` : ''}`, {
      credentials: 'include'
    });
    if (!res.ok) return [];
    return res.json();
  },

  async create(payload) {
    const res = await fetch(`${API}/alerts`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('No se pudo crear la alerta');
    return res.json();
  },

  async markResolved(id, resolved = true) {
    const res = await fetch(`${API}/alerts/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved })
    });
    if (!res.ok) throw new Error('No se pudo actualizar la alerta');
    return res.json();
  },

  async remove(id) {
    const res = await fetch(`${API}/alerts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('No se pudo eliminar la alerta');
    return true;
  }
};