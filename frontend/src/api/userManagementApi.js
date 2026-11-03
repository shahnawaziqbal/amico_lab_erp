import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : window.location.origin)
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

function requireToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error(
      'A verified backend session is required for User Management.'
    );
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export const userManagementApi = {
  async list(token, { page = 1, limit = 25 } = {}) {
    const response = await api.get('/auth/users', {
      ...requireToken(token),
      params: { page, limit },
    });

    return response.data;
  },

  async create(token, employee) {
    const response = await api.post(
      '/auth/users',
      employee,
      requireToken(token),
    );

    return response.data;
  },

  async updateProfile(token, userId, fields) {
    const response = await api.patch(
      `/auth/users/${encodeURIComponent(userId)}`,
      fields,
      requireToken(token),
    );

    return response.data;
  },

  async updateStatus(token, userId, status) {
    const response = await api.patch(
      `/auth/users/${encodeURIComponent(userId)}/status`,
      { status },
      requireToken(token),
    );

    return response.data;
  },

  async assignRoles(token, userId, roleCodes) {
    const response = await api.put(
      `/auth/users/${encodeURIComponent(userId)}/roles`,
      { roleCodes },
      requireToken(token),
    );

    return response.data;
  },

  async resetPassword(token, userId, newPassword) {
    const response = await api.post(
      `/auth/users/${encodeURIComponent(userId)}/reset-password`,
      { newPassword },
      requireToken(token),
    );

    return response.data;
  },
};

export function getUserManagementError(error) {
  if (error?.response?.status === 401) {
    return 'Your backend session is invalid or expired. Please sign in again.';
  }

  if (error?.response?.status === 403) {
    return 'You do not have permission to perform this operation.';
  }

  if (error?.response?.status === 409) {
    return 'The requested change conflicts with an existing employee record.';
  }

  if (error?.response?.data?.message) {
    const message = error.response.data.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot connect to the ERP backend.';
  }

  return 'The requested operation could not be completed.';
}
