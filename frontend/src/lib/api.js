const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
    get: (path) => fetch(`${API_BASE}${path}`).then(r => r.json()),
    post: (path, body) => fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(r => r.json()),
    put: (path, body) => fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(r => r.json()),
    delete: (path) => fetch(`${API_BASE}${path}`, { method: 'DELETE' }).then(r => r.json()),
};
