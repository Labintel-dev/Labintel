const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (payload && typeof payload === 'object' && payload.error) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function getServerHealth() {
  return request('/health');
}

export async function getServerProfile(token) {
  return request('/api/auth/profile', { token });
}

export async function upsertServerProfile(token, profile) {
  return request('/api/auth/profile', {
    method: 'PUT',
    token,
    body: profile,
  });
}
