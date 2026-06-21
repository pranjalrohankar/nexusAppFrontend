import { Platform } from 'react-native';

const BASE_URL = 'http://localhost:8080/api';

// Simple token store that works on both web and native
let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_token', token);
    }
  } catch {}
}

export function getToken(): string | null {
  if (_token) return _token;
  try {
    if (Platform.OS === 'web') {
      _token = localStorage.getItem('auth_token');
    }
  } catch {}
  return _token;
}

export function clearToken() {
  _token = null;
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('auth_token');
    }
  } catch {}
}

function buildHeaders() {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function post(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders() });
  return res.json();
}

export const api = {
  login: (email: string, password: string, role: string) =>
    post('/auth/login', { email, password, role }),

  createUser: (data: object) => post('/admin/users', data),

  getStudents: () => get('/admin/students'),
  getTeachers: () => get('/admin/teachers'),
};
