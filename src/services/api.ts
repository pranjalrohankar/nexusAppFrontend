import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

export function getApiBaseUrl() {
  const isBrowser = typeof window !== "undefined" && Boolean(window.location?.hostname);
  const isLocalhost = isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // 1. Runtime override via URL query param (?apiUrl=...) or localStorage
  if (isBrowser) {
    try {
      if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const qApi = params.get("apiUrl") || params.get("api");
        if (qApi) {
          const clean = qApi.replace(/\/$/, "");
          localStorage.setItem("nexus_api_url", clean);
          return clean;
        }
      }
      const savedApi = localStorage.getItem("nexus_api_url");
      if (savedApi) {
        return savedApi.replace(/\/$/, "");
      }
    } catch {}
  }

  // 2. Production API URL configured via EXPO_PUBLIC_API_URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
    // If we are running on a remote web domain (e.g. Vercel) but env was hardcoded to localhost, skip localhost
    if (isBrowser && !isLocalhost && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1") || envUrl.includes("10.0.2.2"))) {
      // Fall through to remote default below
    } else {
      return envUrl;
    }
  }

  const extra = (Constants.expoConfig?.extra ?? {}) as {
    apiUrl?: string;
    apiUrlWeb?: string;
    apiBaseUrl?: string;
    apiPort?: number | string;
  };

  const configuredUrl = extra.apiUrl || extra.apiBaseUrl;
  if (configuredUrl) {
    if (isBrowser && !isLocalhost && (configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1"))) {
      // Fall through
    } else {
      return configuredUrl.replace(/\/$/, "");
    }
  }

  if (Platform.OS === "web") {
    if (isBrowser && !isLocalhost) {
      // On live deployed web (e.g., Vercel), default directly to the production Render backend
      return "https://nexusappbackend-zibq.onrender.com/api";
    }
    return "http://localhost:8080/api";
  }

  const hostUri =
    Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  const port = extra.apiPort ?? 8080;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:${port}/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api";
  }

  return "https://nexusappbackend-zibq.onrender.com/api";
}

export function resolveDynamicFileUrl(urlOrPath: string): string {
  if (!urlOrPath) return '';
  const activeApiBase = getApiBaseUrl().replace('/api', '');
  let url = String(urlOrPath).trim();

  // If URL matches any domain/IP like http://192.168.x.x:8080/uploads/ or http://localhost:8080/uploads/
  if (/^https?:\/\/[^\/]+(?::\d+)?\/uploads\//i.test(url)) {
    return url.replace(/^https?:\/\/[^\/]+(?::\d+)?/i, activeApiBase);
  }

  // If URL matches streaming endpoint like http://localhost:8080/api/recordings/stream/1
  if (/^https?:\/\/[^\/]+(?::\d+)?\/api\/recordings\/stream\//i.test(url)) {
    return url.replace(/^https?:\/\/[^\/]+(?::\d+)?/i, activeApiBase);
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
      .replace(/http:\/\/localhost:8080/g, activeApiBase)
      .replace(/http:\/\/10\.0\.2\.2:8080/g, activeApiBase);
  }

  const normalized = url.replace(/\\/g, '/');
  if (normalized.includes('uploads/materials/')) {
    const filename = normalized.split('uploads/materials/').pop();
    return `${activeApiBase}/uploads/materials/${filename}`;
  }
  if (normalized.includes('uploads/recordings/')) {
    const filename = normalized.split('uploads/recordings/').pop();
    return `${activeApiBase}/uploads/recordings/${filename}`;
  }

  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${activeApiBase}${cleanPath}`;
}

let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
  try {
    if (Platform.OS === "web") {
      localStorage.setItem("auth_token", token);
    } else {
      AsyncStorage.setItem("auth_token", token);
    }
  } catch {}
}

export function getToken(): string | null {
  if (_token) return _token;
  try {
    if (Platform.OS === "web") {
      _token = localStorage.getItem("auth_token");
    } else {
      AsyncStorage.getItem("auth_token").then((val) => {
        if (val) _token = val;
      });
    }
  } catch {}
  return _token;
}

export const loadToken = getToken;

export function clearToken() {
  _token = null;
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem("auth_token");
    } else {
      AsyncStorage.removeItem("auth_token");
    }
  } catch {}
}

function buildHeaders(contentType?: string, skipAuth = false) {
  const token = getToken();
  const h: Record<string, string> = {};
  if (contentType) {
    h["Content-Type"] = contentType;
  }
  if (!skipAuth && token) {
    h["Authorization"] = `Bearer ${token}`;
    const safeToken = token.substring(0, 20).replace(/[\r\n]/g, "");
    console.log("Sending request with token:", safeToken + "...");
  } else if (!skipAuth) {
    console.warn("No authentication token found!");
  }
  return h;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    if (res.status === 403) {
      console.error(
        "403 Forbidden - Token may be invalid or missing admin role",
      );
    }
    const text = await res.text();
    console.error("API Error:", res.status, text);
    try {
      const json = JSON.parse(text);
      if (json && json.message) {
        return { success: false, message: json.message, status: res.status };
      }
    } catch {}
    return { success: false, message: text || `HTTP ${res.status}`, status: res.status };
  }
  if (res.status === 204)
    return { success: true, message: "Operation successful" };
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return { success: true, message: "Operation successful" };
}

// ── In-Memory Fast Cache for Instant Screen Loads ──
const _apiCache = new Map<string, { data: any; expiresAt: number }>();
const DEFAULT_CACHE_TTL = 30 * 1000; // 30 seconds

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    _apiCache.clear();
  } else {
    for (const key of _apiCache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        _apiCache.delete(key);
      }
    }
  }
}

async function get(path: string, bypassCache = false) {
  const token = getToken();
  const cacheKey = `auth:${token ? token.substring(0, 15) : 'anon'}:${path}`;
  
  if (!bypassCache) {
    const cached = _apiCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, { headers: buildHeaders() });
  const data = await handleResponse(res);
  
  if (data && data.success !== false) {
    _apiCache.set(cacheKey, { data, expiresAt: Date.now() + DEFAULT_CACHE_TTL });
  }
  return data;
}

async function getPublic(path: string, bypassCache = false) {
  const cacheKey = `pub:${path}`;
  if (!bypassCache) {
    const cached = _apiCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`);
  const data = await handleResponse(res);
  
  if (data && data.success !== false) {
    _apiCache.set(cacheKey, { data, expiresAt: Date.now() + DEFAULT_CACHE_TTL });
  }
  return data;
}

async function post(
  path: string,
  body: object,
  contentType = "application/json",
  skipAuth = false,
) {
  clearApiCache();
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: buildHeaders(contentType, skipAuth),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function postFormData(path: string, body: FormData) {
  clearApiCache();
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body,
  });
  return handleResponse(res);
}

async function put(path: string, body: object) {
  clearApiCache();
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "PUT",
    headers: buildHeaders("application/json"),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function del(path: string) {
  clearApiCache();
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("DELETE Error:", res.status, text);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return { success: true };
}

async function patch(path: string) {
  clearApiCache();
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "PATCH",
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

export const api = {
  login: (
    email: string,
    password: string,
    role?: string,
    deviceFingerprint?: string,
  ) => post("/auth/login", { email, password, role, deviceFingerprint }, "application/json", true),

  createUser: (data: object) => post("/admin/users", data),

  getStudents: () => get("/admin/students"),
  getTeachers: () => get("/teachers/all"),
  getTeacher: (id: number | string) => get(`/teachers/${id}`),
  updateStudent: (id: number | string, data: object) =>
    put(`/admin/students/${id}`, data),
  enrollStudent: (id: number | string, data: object) =>
    post(`/admin/students/${id}/enroll`, data),
  deleteStudent: (id: number | string) => del(`/admin/students/${id}`),
  updateTeacher: (id: number | string, data: object) =>
    put(`/teachers/${id}`, data),
  deleteTeacher: (id: number | string) => del(`/teachers/${id}`),
  assignCourse: (teacherId: number | string, courseId: number | string) =>
    post(`/teachers/${teacherId}/courses/${courseId}`, {}),
  unassignCourse: (teacherId: number | string, courseId: number | string) =>
    del(`/teachers/${teacherId}/courses/${courseId}`),

  getDashboard: () => get("/admin/dashboard"),
  getAdminProfile: () => get("/admin/profile"),
  getAllCourses: () => getPublic("/courses/all"),
  getActiveCourses: () => getPublic("/courses/active"),
  createCourse: (data: object) => post("/courses", data),
  updateCourse: (id: number | string, data: object) =>
    put(`/courses/${id}`, data),
  deleteCourse: (id: number | string) => del(`/courses/${id}`),

  getBatches: () => get("/batches"),
  createBatch: (data: object) => post("/batches", data),
  updateBatch: (id: number | string, data: object) =>
    put(`/batches/${id}`, data),
  deleteBatch: (id: number | string) => del(`/batches/${id}`),
  getBatchStudents: (batchId: number | string) =>
    get(`/batches/${batchId}/students`),

  getEnrollmentsByCourse: (courseTitle: string) =>
    get(`/enrollments/course?courseTitle=${encodeURIComponent(courseTitle)}`),
  getEnrollmentCount: (courseTitle: string) =>
    get(
      `/enrollments/count/course?courseTitle=${encodeURIComponent(courseTitle.trim())}`,
    ),

  getEnquiries: () => get("/enquiries"),
  markEnquiryRead: (id: number | string) => patch(`/enquiries/${id}/read`),
  submitEnquiry: (data: object) => post("/enquiries", data),

  getTeacherProfile: () => get("/teachers/profile"),
  updateTeacherProfile: (data: object) => put("/teachers/profile", data),
  getMyBatches: (status?: string) =>
    get(
      `/teachers/my-batches${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
  getMyCoursesBatches: (course?: string) =>
    get(
      `/teachers/my-courses-batches${course ? `?course=${encodeURIComponent(course)}` : ""}`,
    ),

  updateCourseMeetLink: (id: number | string, googleMeetLink: string) =>
    put(`/courses/${id}/meet-link`, { googleMeetLink }),

  getStudyMaterials: async () => {
    const res = await get("/materials");
    const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
    return list.map((item: any) => ({
      ...item,
      fileUrl: resolveDynamicFileUrl(item.fileUrl || item.url || item.filePath),
    }));
  },
  getStudyMaterialsByCourse: async (course: string) => {
    const res = await get(`/materials/by-course?course=${encodeURIComponent(course)}`);
    const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
    return list.map((item: any) => ({
      ...item,
      fileUrl: resolveDynamicFileUrl(item.fileUrl || item.url || item.filePath),
    }));
  },
  uploadStudyMaterial: (data: FormData) =>
    postFormData("/materials/upload", data),
  deleteStudyMaterial: (id: number | string) => del(`/materials/${id}`),

  getClassRecordings: async () => {
    const res = await get("/recordings");
    const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
    return list.map((item: any) => ({
      ...item,
      videoUrl: resolveDynamicFileUrl(item.fileUrl || item.videoUrl || item.url || item.filePath || (item.id ? `/api/recordings/stream/${item.id}` : '')),
    }));
  },
  uploadClassRecording: (data: FormData) =>
    postFormData("/recordings/upload", data),
  getRecordingStreamUrl: (id: number | string) => `${getApiBaseUrl()}/recordings/stream/${id}`,
  deleteClassRecording: (id: number | string) => del(`/recordings/${id}`),

  getLoginHistory: (userId: number | string) =>
    get(`/auth/login-history?userId=${userId}`),
  getSecuritySettings: (userId: number | string) =>
    get(`/auth/security-settings?userId=${userId}`),
  updateSecuritySettings: (data: object) =>
    put("/auth/security-settings", data),

  // Student-specific endpoints
  getStudentProfile: () => get('/student/profile'),
  updateStudentProfile: (data: object) => put('/student/profile', data),
  sendStudentSupportMessage: (data: object) => post('/student/support-message', data),
  getStudentEnrollments: async () => {
    const res = await get('/student/enrollments');
    return Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
  },
  getStudentMaterials: async () => {
    const res = await get('/student/materials');
    const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
    return list.map((item: any) => ({
      ...item,
      fileUrl: resolveDynamicFileUrl(item.fileUrl || item.url || item.filePath),
    }));
  },
  getStudentRecordings: async () => {
    const res = await get('/student/recordings');
    const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
    return list.map((item: any) => ({
      ...item,
      videoUrl: resolveDynamicFileUrl(item.fileUrl || item.videoUrl || item.url || item.filePath || (item.id ? `/api/recordings/stream/${item.id}` : '')),
    }));
  },
  getStudentUpcomingClasses: () => get('/student/upcoming-classes'),
  getStudentNotifications: () => get('/notifications/student'),
  markAllStudentNotificationsRead: () => patch('/notifications/student/mark-all-read'),
  getStudentMarks: (studentId: string | number) => get(`/test-attempts/student/${studentId}`),
  getStudentsByCourse: (course: string) => get(`/admin/students?course=${encodeURIComponent(course)}`),
  getMaterialDownloadUrl: (id: number | string) => `${getApiBaseUrl()}/materials/download/${id}`,
  setActivityStatus: (online: boolean) => put('/student/activity-status', { online }),
  getPrivacySettings: () => get('/student/privacy-settings'),
  updatePrivacySettings: (data: object) => put('/student/privacy-settings', data),

  // Teacher notification endpoints
  getTeacherNotifications: () => get('/notifications/teacher'),
  markNotificationRead: (id: number | string) => patch(`/notifications/${id}/read`),
  markAllNotificationsRead: (role: string) => patch(`/notifications/mark-all-read?role=${role}`),

  // User Profile & Session Persistence
  getMe: () => get('/users/me'),
  updateUserProfile: (data: object) => put('/users/profile', data),
  changePassword: (data: object) => put('/users/change-password', data),
  getAllUsers: () => get('/users/all'),
  toggleUserStatus: (id: number | string, active?: boolean) => put(`/users/${id}/status`, { active }),

  // Tests & Assessments endpoints
  getAllTests: async () => {
    const res = await get('/tests/all');
    return Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
  },
  getTestsByCourse: async (courseTitle: string) => {
    const res = await get(`/tests/course/${encodeURIComponent(courseTitle)}`);
    return Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
  },
  getTestById: (id: number | string) => get(`/tests/${id}`),
  createTest: (data: object) => post('/tests', data),
  deleteTest: (id: number | string) => del(`/tests/${id}`),

  // Test Attempt & Submissions
  submitTestAttempt: (data: object) => post('/tests/submit', data),
  getTestSubmissions: async (status?: string) => {
    const path = status ? `/tests/submissions?status=${encodeURIComponent(status)}` : '/tests/submissions';
    const res = await get(path);
    return Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
  },
  getMyTestSubmissions: async () => {
    const res = await get('/tests/submissions/my');
    return Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
  },
  gradeTestSubmission: (id: number | string, data: object) => put(`/tests/submissions/${id}/grade`, data),
};
