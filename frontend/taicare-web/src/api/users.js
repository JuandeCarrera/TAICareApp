const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request(path, { method = 'GET', body, headers, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...headers,
    },
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

  if (!res.ok) {
    const msg = (isJson && (data?.message || data?.error)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return isJson ? data : { ok: true, data };
}

export function fetchUsers({ token } = {}) {
  return request('/users', { token });
}

export function createUser(payload, { token } = {}) {
  return request('/users', { method: 'POST', body: payload, token });
}