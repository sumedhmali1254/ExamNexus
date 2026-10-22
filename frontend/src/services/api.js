import axios from 'axios';

const API_BASE = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const StudentService = {
  getAll: () => api.get('/students'),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  search: (filters) => api.post('/students/search', filters),
};

export const RoomService = {
  getAll: () => api.get('/rooms'),
  getAvailable: () => api.get('/rooms/available'),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

export const TeacherService = {
  getAll: () => api.get('/teachers'),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  search: (filters) => api.post('/teachers/search', filters),
};

export const SettingsService = {
  getDomains: () => api.get('/settings/domains'),
  createDomain: (data) => api.post('/settings/domains', data),
  updateDomain: (id, data) => api.put(`/settings/domains/${id}`, data),
  getPrograms: () => api.get('/settings/programs'),
  createProgram: (data) => api.post('/settings/programs', data),
  updateProgram: (id, data) => api.put(`/settings/programs/${id}`, data),
  getDepartments: () => api.get('/settings/departments'),
  createDepartment: (data) => api.post('/settings/departments', data),
  updateDepartment: (id, data) => api.put(`/settings/departments/${id}`, data),
  getExams: () => api.get('/settings/exams'),
  createExam: (data) => api.post('/settings/exams', data),
  updateExam: (id, data) => api.put(`/settings/exams/${id}`, data),
  deleteDomain: (id) => api.delete(`/settings/domains/${id}`),
  deleteProgram: (id) => api.delete(`/settings/programs/${id}`),
  deleteDepartment: (id) => api.delete(`/settings/departments/${id}`),
  deleteExam: (id) => api.delete(`/settings/exams/${id}`),
};

export const SeatingService = {
  generate: (data) => api.post('/exam-engine/generate-seating', data),
  getSeating: () => api.get('/exam-engine/sessions'),
  getTeacherAllocation: () => api.get('/exam-engine/sessions'),
};

export const SeatingRulesService = {
  get: () => api.get('/seating-rules'),
  update: (data) => api.put('/seating-rules', data),
};

export const ExamEngineService = {
  generate: (data) => api.post('/exam-engine/generate-seating', data),
  checkCapacity: (data) => api.post('/exam-engine/check-capacity', data),
  autoSelectRooms: (data) => api.post('/exam-engine/auto-select-rooms', data),
  getSessions: () => api.get('/exam-engine/sessions'),
  getPreview: (sessionId) => api.get(`/exam-engine/preview/${sessionId}`),
  allocateTeachers: (data) => api.post('/exam-engine/allocate-teachers', data),
  getTeacherAllocation: (sessionId) => api.get(`/exam-engine/teacher-allocation/${sessionId}`),
  deleteSession: (sessionId) => api.delete(`/exam-engine/sessions/${sessionId}`),
  getStats: () => api.get('/exam-engine/stats'),
};

export const DashboardService = {
  getStats: () => api.get('/exam-engine/dashboard-stats'),
};

export default api;
