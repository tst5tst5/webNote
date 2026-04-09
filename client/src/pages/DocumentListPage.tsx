import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../services/api';
import type { Document } from '../types';
import { Plus, FileText, Trash2, Edit3, BookOpen, Upload, X, Check, Clock, AlertCircle } from 'lucide-react';

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const navigate = useNavigate();

  // 加载文档列表
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await documentApi.getList();
      setDocuments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载文档失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.txt')) {
      setError('只支持 .txt 格式文件');
      return;
    }

    setUploadProgress(true);
    setError('');

    try {
      const result = await documentApi.import(file);
      if (result.success) {
        setDocuments([result.document, ...documents]);
        setShowUploadModal(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '导入失败');
    } finally {
      setUploadProgress(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除文档
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇文档吗？')) return;

    try {
      await documentApi.delete(id);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  // 开始编辑标题
  const startEditing = (doc: Document) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
  };

  // 保存编辑
  const saveEditing = async (doc: Document) => {
    if (!editTitle.trim()) return;

    try {
      await documentApi.update(doc.id, { title: editTitle });
      setDocuments(documents.map(d =>
        d.id === doc.id ? { ...d, title: editTitle } : d
      ));
      setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || '更新失败');
    }
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 顶部区域 */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">我的文档</h1>
              <p className="text-primary-100">管理您的阅读笔记和标注</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-all shadow-lg shadow-black/10"
            >
              <Plus className="w-5 h-5" />
              <span>导入文档</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto p-1 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : documents.length === 0 ? (
          /* 空状态 */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-text-primary mb-2">还没有文档</h2>
            <p className="text-text-secondary mb-6">导入一本好书，开始您的阅读之旅吧</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>导入第一篇文档</span>
            </button>
          </div>
        ) : (
          /* 文档列表 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group"
              >
                {/* 文档封面 */}
                <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-50 relative flex items-center justify-center">
                  <div className="w-16 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary-500" />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(doc)}
                      className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 bg-white rounded-lg shadow hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* 文档信息 */}
                <div className="p-5">
                  {editingId === doc.id ? (
                    /* 编辑状态 */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(doc);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEditing(doc)}
                          className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          <span>保存</span>
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-text-primary mb-2 line-clamp-1">{doc.title}</h3>
                      <p className="text-sm text-text-secondary mb-4 line-clamp-2">{doc.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(doc.createdAt)}</span>
                        </div>
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="flex items-center gap-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>阅读</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">导入文档</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-primary-500" />
              </div>
              <p className="text-text-primary font-medium mb-1">点击选择文件</p>
              <p className="text-sm text-text-secondary">支持 .txt 格式文件</p>
            </div>

            {uploadProgress && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <span className="text-primary-600">正在导入...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
