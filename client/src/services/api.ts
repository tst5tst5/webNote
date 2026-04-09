import axios from 'axios';
import type { User, Document, Annotation, LoginRequest, LoginResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// 文档 API
export const documentApi = {
  getList: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents');
    return response.data;
  },

  getOne: async (id: number): Promise<Document> => {
    const response = await api.get<Document>(`/documents/${id}`);
    return response.data;
  },

  import: async (file: File): Promise<{ success: boolean; document: Document }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, data: Partial<Document>): Promise<{ success: boolean }> => {
    const response = await api.put<{ success: boolean }>(`/documents/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/documents/${id}`);
    return response.data;
  },
};

// 标注 API
export const annotationApi = {
  getByDocument: async (docId: number): Promise<Annotation[]> => {
    const response = await api.get<Annotation[]>(`/annotations/document/${docId}`);
    return response.data;
  },

  create: async (data: Partial<Annotation>): Promise<{ success: boolean; annotation: Annotation }> => {
    const response = await api.post<{ success: boolean; annotation: Annotation }>('/annotations', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Annotation>): Promise<{ success: boolean }> => {
    const response = await api.put<{ success: boolean }>(`/annotations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/annotations/${id}`);
    return response.data;
  },
};

export default api;
