// 用户类型
export interface User {
  id: number;
  phone: string;
  email: string;
  created_at?: string;
}

// 文档类型
export interface Document {
  id: number;
  userId: number;
  title: string;
  content: string;
  summary: string;
  fileType: string;
  createdAt: string;
  updatedAt?: string;
}

// 标注类型
export interface Annotation {
  id: number;
  documentId: number;
  userId: number;
  selectedText: string;
  annotationContent: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
}

// 登录请求
export interface LoginRequest {
  account: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

// API 错误
export interface ApiError {
  error: string;
}
