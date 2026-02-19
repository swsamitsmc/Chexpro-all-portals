import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  User,
  CandidateProfile,
  Order,
  Check,
  Document,
  Notification,
  CandidateInvitation,
  InvitationValidation,
  LoginCredentials,
  RegisterData,
  RefreshTokenResponse,
  ApiResponse,
  WizardStepData,
  CheckTimeline,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3004/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<RefreshTokenResponse>(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3004/api/v1'}/auth/refresh-token`,
          { refreshToken }
        );

        useAuthStore.getState().updateAccessToken(data.accessToken);
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  validateInvitation: (token: string) =>
    api.get<ApiResponse<InvitationValidation>>(`/auth/invitation/${token}`),

  register: (data: RegisterData) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data),

  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', credentials),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<null>>('/auth/reset-password', { token, password }),

  getMe: () => api.get<ApiResponse<User>>('/auth/me'),

  refreshToken: (refreshToken: string) =>
    api.post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken }),
};

export const wizardApi = {
  getStatus: (orderId: string) =>
    api.get<ApiResponse<{ currentStep: number; completed: boolean; orderId: string }>>(`/wizard/status/${orderId}`),

  getWizardData: (orderId: string) =>
    api.get<ApiResponse<CandidateProfile>>(`/wizard/data/${orderId}`),

  saveStep: (orderId: string, step: number, data: WizardStepData['data']) =>
    api.post<ApiResponse<CandidateProfile>>(`/wizard/step/${orderId}`, { step, data }),

  submitWizard: (orderId: string) =>
    api.post<ApiResponse<{ orderId: string; wizardCompleted: boolean }>>(`/wizard/submit/${orderId}`),
};

export const checksApi = {
  list: (orderId?: string) =>
    api.get<ApiResponse<Order[]>>('/checks', { params: { orderId } }),

  getDetail: (orderId: string) =>
    api.get<ApiResponse<Order & { checks: Check[] }>>(`/checks/${orderId}`),

  getTimeline: (orderId: string) =>
    api.get<ApiResponse<CheckTimeline[]>>(`/checks/${orderId}/timeline`),

  getReport: (orderId: string) =>
    api.get<ApiResponse<{ reportUrl: string }>>(`/checks/${orderId}/report`),
};

export const documentsApi = {
  list: (orderId: string) =>
    api.get<ApiResponse<Document[]>>('/documents', { params: { orderId } }),

  upload: (formData: FormData) =>
    api.post<ApiResponse<Document>>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (documentId: string) =>
    api.delete<ApiResponse<null>>(`/documents/${documentId}`),
};

export const profileApi = {
  get: () => api.get<ApiResponse<CandidateProfile>>('/profile'),

  update: (data: Partial<CandidateProfile>) =>
    api.put<ApiResponse<CandidateProfile>>('/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<null>>('/profile/change-password', { currentPassword, newPassword }),

  deleteAccount: (password: string) =>
    api.post<ApiResponse<null>>('/profile/delete', { password }),
};

export const notificationsApi = {
  list: () => api.get<ApiResponse<Notification[]>>('/notifications'),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<ApiResponse<{ count: number }>>('/notifications/read-all'),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`),
};

export const statusApi = {
  get: (orderId: string) =>
    api.get<ApiResponse<{ status: string; orderId: string }>>(`/status/${orderId}`),
};

export default api;
