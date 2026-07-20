import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

export function getApiBaseUrl() {
  if (Platform.OS === "web") {
    return "http://localhost:8080/api";
  }

  const extra = (Constants.expoConfig?.extra ?? {}) as {
    apiUrl?: string;
    apiUrlWeb?: string;
    apiBaseUrl?: string;
    apiPort?: number | string;
  };

  const configuredUrl = extra.apiUrl || extra.apiBaseUrl;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
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

  return "http://localhost:8080/api";
}

const BASE_URL = getApiBaseUrl();

let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
  try {
    if (Platform.OS === "web") {
      // amazonq-ignore-next-line
      // amazonq-ignore-next-line
      localStorage.setItem("auth_token", token);
    } else {
      AsyncStorage.setItem("auth_token", token);
    }
  } catch {}
}

export async function loadToken(): Promise<void> {
  if (_token) return;
  try {
    if (Platform.OS === "web") {
      _token = localStorage.getItem("auth_token");
    } else {
      _token = await AsyncStorage.getItem("auth_token");
    }
  } catch {}
}

export function getToken(): string | null {
  if (_token) return _token;
  try {
    if (Platform.OS === "web") {
      _token = localStorage.getItem("auth_token");
    }
  } catch {}
  return _token;
}

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

async function post(
  path: string,
  body: object,
  contentType = "application/json",
  skipAuth = false,
) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(contentType, skipAuth),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function postFormData(path: string, body: FormData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body,
  });
  return handleResponse(res);
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders() });
  return handleResponse(res);
}

async function getPublic(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  return handleResponse(res);
}

async function put(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders("application/json"),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function del(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
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
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

export const api = {
  login: (
    email: string,
    password: string,
    role: string,
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
  getMyBatches: () => get("/teachers/my-batches"),
  getMyCoursesBatches: (course?: string) =>
    get(
      `/teachers/my-courses-batches${course ? `?course=${encodeURIComponent(course)}` : ""}`,
    ),

  getStudyMaterials: () => get("/materials"),
  getStudyMaterialsByCourse: (course: string) =>
    get(`/materials/by-course?course=${encodeURIComponent(course)}`),
  uploadStudyMaterial: (data: FormData) =>
    postFormData("/materials/upload", data),
  deleteStudyMaterial: (id: number | string) => del(`/materials/${id}`),

  getClassRecordings: () => get("/recordings"),
  uploadClassRecording: (data: FormData) =>
    postFormData("/recordings/upload", data),
  getRecordingStreamUrl: (id: number) => `${BASE_URL}/recordings/stream/${id}`,
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
  getStudentEnrollments: () => get('/student/enrollments'),
  getStudentMaterials: () => get('/student/materials'),
  getStudentRecordings: () => get('/student/recordings'),
  getStudentUpcomingClasses: () => get('/student/upcoming-classes'),
  getStudentNotifications: () => get('/notifications/student'),
  markAllStudentNotificationsRead: () => patch('/notifications/student/mark-all-read'),
  getMaterialDownloadUrl: (id: number | string) => `${getApiBaseUrl()}/materials/download/${id}`,
  setActivityStatus: (online: boolean) => put('/student/activity-status', { online }),
  getPrivacySettings: () => get('/student/privacy-settings'),
  updatePrivacySettings: (data: object) => put('/student/privacy-settings', data),

  // Teacher notification endpoints
  getTeacherNotifications: () => get('/notifications/teacher'),
  markNotificationRead: (id: number | string) => patch(`/notifications/${id}/read`),
  markAllNotificationsRead: (role: string) => patch(`/notifications/mark-all-read?role=${role}`),
};
