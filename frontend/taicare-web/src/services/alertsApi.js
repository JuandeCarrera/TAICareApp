const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchJSON(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let errText = '';
    try { const j = await res.json(); errText = j.error || JSON.stringify(j); } catch {}
    throw new Error(errText || `HTTP ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/* ---------------- System settings ---------------- */
export const SettingsAPI = {
  async getSystem() {
    // devuelve { alerts_enabled, quiet_hours: {start,end}, ... }
    return fetchJSON('/settings');
  },
  async updateSystem(payload) {
    // payload: { alerts_enabled?: bool, quiet_hours?: {start,end}, ... }
    return fetchJSON('/settings', { method: 'PUT', body: payload });
  },
  // helpers simples por clave (opcionales)
  async getFlag(key) {
    return fetchJSON(`/settings/${encodeURIComponent(key)}`);
  },
  async setFlag(key, value) {
    return fetchJSON(`/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: { value } });
  },
};

/* ---------------- Notification preferences ---------------- */
export const NotifPrefsAPI = {
  async getMine() {
    // devuelve { channels: { email:boolean, push:boolean }, min_severity:'LOW'|'MEDIUM'|'HIGH' }
    return fetchJSON('/notification-prefs/me');
  },
  async upsertMine(payload) {
    // payload: { channels?: {email, push}, min_severity?: 'LOW'|'MEDIUM'|'HIGH' }
    return fetchJSON('/notification-prefs/me', { method: 'PUT', body: payload });
  },
};

/* ---------------- Rules (alert rules) ---------------- */
export const RulesAPI = {
  async list() {
    return fetchJSON('/alert-rules');
  },
  async create(rule) {
    return fetchJSON('/alert-rules', { method: 'POST', body: rule });
  },
  async update(id, patch) {
    return fetchJSON(`/alert-rules/${id}`, { method: 'PUT', body: patch });
  },
  async remove(id) {
    return fetchJSON(`/alert-rules/${id}`, { method: 'DELETE' });
  },
};

/* ---------------- Jobs (herramientas dev) ---------------- */
export const JobsAPI = {
  async runRoutineCheck() {
    return fetchJSON('/jobs/routine-checker-tick', { method: 'POST' });
  },
};

export const DevAPI = {
  async insertData(reading) {
    // reading: { device_id, user_id, time, power, status, synthetic }
    return fetchJSON('/data', { method: 'POST', body: reading });
  },
};
