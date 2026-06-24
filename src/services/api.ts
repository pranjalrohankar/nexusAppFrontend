import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8080/api'
  : 'http://localhost:8080/api';

let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_token', token);
    } else {
      AsyncStorage.setItem('auth_token', token);
    }
  } catch {}
}

export async function loadToken(): Promise<void> {
  if (_token) return;
  try {
    if (Platform.OS === 'web') {
      _token = localStorage.getItem('auth_token');
    } else {
      _token = await AsyncStorage.getItem('auth_token');
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
    } else {
      AsyncStorage.removeItem('auth_token');
    }
  } catch {}
}

function buildHeaders() {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function post(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders() });
  return handleResponse(res);
}

async function put(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function del(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

export const api = {
  login: (email: string, password: string, role: string) =>
    post('/auth/login', { email, password, role }),

  createUser: (data: object) => post('/admin/users', data),

  getStudents: () => get('/admin/students'),
  getTeachers: () => get('/admin/teachers'),

  getCourses: () => get('/courses?size=100'),
  getActiveCourses: () => get('/courses/active'),
  createCourse: (data: object) => post('/courses', data),
  updateCourse: (id: number | string, data: object) => put(`/courses/${id}`, data),
  deleteCourse: (id: number | string) => del(`/courses/${id}`),
};
