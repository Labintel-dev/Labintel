const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

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
  // Health check is at root level, not under /api/v1
  try {
    const response = await fetch('http://localhost:3001/health');
    return response.ok;
  } catch {
    return false;
  }
}

export async function getServerProfile(token) {
  return request('/auth/profile', { token });
}

export async function upsertServerProfile(token, profile) {
  return request('/auth/profile', {
    method: 'PUT',
    token,
    body: profile,
  });
}
