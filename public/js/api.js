// public/js/api.js — Fetch wrapper for backend API
const API = {
    async request(method, path, data) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        };
        if (data) opts.body = JSON.stringify(data);
        const res = await fetch(path, opts);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Request failed');
        return json;
    },
    get: (path) => API.request('GET', path),
    post: (path, data) => API.request('POST', path, data),
    put: (path, data) => API.request('PUT', path, data),
    delete: (path) => API.request('DELETE', path),
};
