import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DocumentListPage from './pages/DocumentListPage';
import DocumentReaderPage from './pages/DocumentReaderPage';
import { BookOpen, FileText, Settings, LogOut } from 'lucide-react';

// 加载动画组件
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-text-secondary">加载中...</p>
      </div>
    </div>
  );
}

// 顶部导航栏
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-text-primary">读书笔记</span>
        </div>

        {/* 导航菜单 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              location.pathname === '/documents'
                ? 'bg-primary-50 text-primary-600'
                : 'text-text-secondary hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>文档管理</span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-text-secondary hover:bg-gray-50 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </button>
        </div>

        {/* 用户信息 */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {user?.phone || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// 受保护的路由包装器
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </>
  );
}

// 公开路由包装器（已登录则跳转到文档列表）
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/documents" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <DocumentReaderPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="*" element={<Navigate to="/documents" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
