const BASE = ''; // same-origin in prod; proxied in dev via vite.config.js

async function request(path, options) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export const api = {
  checkHealth: () => request('/reconcile/report'),
  generateData: (clean, split, merged, broken) =>
    request(`/data/generate?clean=${clean}&split=${split}&merged=${merged}&broken=${broken}`, { method: 'POST' }),
  runReconcile: () => request('/reconcile/run', { method: 'POST' }),
  getReport: () => request('/reconcile/report'),
  getMatches: () => request('/matches'),
  getExceptions: () => request('/reconcile/exceptions'),
  getAuditTrail: (recordId) => request(`/audit/${encodeURIComponent(recordId)}`),
};
