const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function fetchUsers() {
  const res = await fetch(`${API}/users`)
  if (!res.ok) throw new Error('Error al cargar usuarios')
  return res.json()
}

export async function createUser(data) {
  const res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.json().error)
  return res.json()
}