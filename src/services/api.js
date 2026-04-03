const API_BASE_URL = 'http://localhost:3002/api';
const ML_BASE_URL = 'http://localhost:8000';

const getAuthToken = () => {
  // Primary: Zustand-persisted auth store
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.token) {
        return parsed.state.token;
      }
    } catch {
      // ignore and fall through
    }
  }

  // Fallback: legacy token storage used by Auth component
  const legacy = localStorage.getItem('auth_token');
  if (legacy) {
    return legacy;
  }

  return null;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Clear tokens on unauthorized
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    
    // Redirect to home/login page
    window.location.href = '/';
    return;
  }
  
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error || body.message || response.statusText || 'Network response was not ok';
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return response.json();
};

export const authAPI = {
  login: (credentials) => fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then(handleResponse),
  
  logout: () => fetch(`${API_BASE_URL}/logout`, { method: 'POST' }).then(handleResponse),
};

export const registrationAPI = {
  request: (data) => fetch(`${API_BASE_URL}/registration/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  
  getAll: (status) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/registration${status ? `?status=${status}` : ''}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  
  approve: (id) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/registration/${id}/approve`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  
  reject: (id, note) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/registration/${id}/reject`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ note }),
    }).then(handleResponse);
  },
};

export const registrationsAPI = registrationAPI;

export const faceAPI = {
  // FastAPI Backend (main.py)
  register: (formData) => fetch(`${ML_BASE_URL}/register`, {
    method: 'POST',
    body: formData, // FormData containing student_id, name, div, file
  }).then(handleResponse),
  
  verify: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${ML_BASE_URL}/verify`, {
      method: 'POST',
      body: formData,
    }).then(handleResponse);
  },
  
  train: () => fetch(`${ML_BASE_URL}/train`, { method: 'POST' }).then(handleResponse),
  storeTemplate: (moodleId, descriptor, photo) => {
    const raw = localStorage.getItem('auth-storage');
    let token;
    try {
      token = raw ? JSON.parse(raw)?.state?.token : undefined;
    } catch (_) {
      token = undefined;
    }
    return fetch(`${API_BASE_URL}/face/${moodleId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ descriptor, photo }),
    }).then(handleResponse);
  },
};

export const vehicleAPI = {
  // FastAPI Backend (main.py)
  register: (formData) => fetch(`${ML_BASE_URL}/register_vehicle`, {
    method: 'POST',
    body: formData, // FormData containing plate_number, vehicle_type, owner_name, file
  }).then(handleResponse),
  
  verify: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${ML_BASE_URL}/verify_vehicle`, {
      method: 'POST',
      body: formData,
    }).then(handleResponse);
  },
};

export const vehiclesAPI = {
  getPending: () => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/vehicles/pending`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  getAll: () => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/vehicles`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  approve: (plate, note) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/vehicles/${encodeURIComponent(plate)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ note }),
    }).then(handleResponse);
  },
  deny: (plate, note) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/vehicles/${encodeURIComponent(plate)}/deny`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ note }),
    }).then(handleResponse);
  },
  getMy: () => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/vehicles/my`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  register: ({ plate, note }) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/vehicles/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ plate, note }),
    }).then(handleResponse);
  },
};

export const logsAPI = {
  getAll: (params = {}) => {
    const token = getAuthToken();
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const qs = query.toString();
    return fetch(`${API_BASE_URL}/logs${qs ? `?${qs}` : ''}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  getRecent: ({ limit = 10 } = {}) => {
    const token = getAuthToken();
    const query = new URLSearchParams({ limit: String(limit) });
    return fetch(`${API_BASE_URL}/logs/recent?${query.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  getMy: ({ limit = 20, offset = 0 } = {}) => {
    const token = getAuthToken();
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return fetch(`${API_BASE_URL}/logs/my?${query.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  create: (data) => fetch(`${API_BASE_URL}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
};

export const statsAPI = {
  getToday: () => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/stats/today`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  getDashboard: () => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/stats/dashboard`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  getInside: () => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/stats/inside`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
};

export const usersAPI = {
  getByMoodleId: (moodleId) => fetch(`${API_BASE_URL}/users/${moodleId}`).then(handleResponse),
  getMe: () => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  getAll: (params = {}) => {
    const token = getAuthToken();
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const qs = query.toString();
    return fetch(`${API_BASE_URL}/users${qs ? `?${qs}` : ''}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
  updateUser: (moodleId, data) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/users/${encodeURIComponent(moodleId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    }).then(handleResponse);
  },
  deleteUser: (moodleId) => {
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/users/${encodeURIComponent(moodleId)}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(handleResponse);
  },
};

export const gateAPI = {
  validateQR: (moodleId) => fetch(`${API_BASE_URL}/gate/validate-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moodle_id: moodleId }),
  }).then(handleResponse),
  processFace: (moodleId, descriptor) => fetch(`${API_BASE_URL}/gate/process-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moodle_id: moodleId, descriptor }),
  }).then(handleResponse),
  processPlate: (moodleId, plate, confidence = 0) => fetch(`${API_BASE_URL}/gate/process-plate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moodle_id: moodleId, plate, confidence }),
  }).then(handleResponse),
  updateEntry: (payload) => fetch(`${API_BASE_URL}/gate/update-entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse),
  updateExit: (payload) => fetch(`${API_BASE_URL}/gate/update-exit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse),
};
