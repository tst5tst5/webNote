import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentApi, annotationApi } from '../services/api';
import type { Document, Annotation } from '../types';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import {
  ArrowLeft, FileText, Clock, Bookmark, Trash2, X, Edit3,
  MessageSquare, ChevronRight, ChevronLeft, Highlighter, AlignLeft
} from 'lucide-react';

// 高亮样式
const highlightStyle = {
  backgroundColor: '#fef08a',
  borderBottom: '2px solid #eab308',
  padding: '0 2px',
  borderRadius: '2px',
  cursor: 'pointer',
};

export default function DocumentReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);

  // 标注浮动框状态
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [startOffset, setStartOffset] = useState(0);
  const [endOffset, setEndOffset] = useState(0);
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 标注列表折叠状态
  const [isAnnotationListCollapsed, setIsAnnotationListCollapsed] = useState(false);

  // 渲染带高亮的文档内容
  const renderContentWithHighlights = useCallback(() => {
    if (!document) return null;
    
    const content = document.content;
    if (!content) return null;
    
    // 按 offset 排序标注
    const sortedAnnotations = [...annotations].sort((a, b) => a.startOffset - b.startOffset);
    
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    
    sortedAnnotations.forEach((annotation, idx) => {
      const { startOffset: start, endOffset: end, selectedText: text, id } = annotation;
      
      // 添加高亮前的文本
      if (start > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>{content.substring(lastIndex, start)}</span>
        );
      }
      
      // 添加高亮文本
      elements.push(
        <mark 
          key={`highlight-${id}`} 
          style={highlightStyle}
          onClick={() => handleHighlightClick(annotation)}
          title="点击查看/编辑标注"
        >
          {text}
        </mark>
      );
      
      lastIndex = end;
    });
    
    // 添加剩余文本
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">{content.substring(lastIndex)}</span>
      );
    }
    
    return elements;
  }, [document, annotations]);

  // 处理高亮点击
  const handleHighlightClick = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setSelectedText(annotation.selectedText);
    
    // 设置弹窗位置到窗口中间
    setPopupPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    });
    
    setShowPopup(true);
    
    // 初始化 Quill 并填充内容
    setTimeout(() => {
      if (editorRef.current && !quillRef.current) {
        quillRef.current = new Quill(editorRef.current, {
          theme: 'snow',
          placeholder: '写下你的笔记...',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['clean']
            ]
          }
        });
      }
      
      if (quillRef.current && annotation.annotationContent) {
        quillRef.current.root.innerHTML = annotation.annotationContent;
      }
    }, 100);
  };

  // 加载文档和标注
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError('');

        const [docData, annotationData] = await Promise.all([
          documentApi.getOne(Number(id)),
          annotationApi.getByDocument(Number(id))
        ]);

        setDocument(docData);
        setAnnotations(annotationData);
      } catch (err: any) {
        setError(err.response?.data?.error || '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  // 初始化 Quill 编辑器
  useEffect(() => {
    if (editorRef.current && showPopup && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: '写下你的笔记...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      });
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [showPopup]);

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (!text) return;

    // 获取选中文本的位置
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(text);
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });

    // 计算文本偏移量（简化版：基于文档内容的字符位置）
    if (document) {
      const content = document.content;
      const beforeSelection = content.substring(0, content.indexOf(text));
      setStartOffset(beforeSelection.length);
      setEndOffset(beforeSelection.length + text.length);
    }

    // 清除编辑状态
    setEditingAnnotation(null);
    setShowPopup(true);
  }, [document]);

  // 保存标注
  const handleSaveAnnotation = async () => {
    if (!document || !quillRef.current) return;

    const annotationContent = quillRef.current.root.innerHTML;

    try {
      // 如果是编辑已有标注
      if (editingAnnotation) {
        const result = await annotationApi.update(editingAnnotation.id, {
          annotationContent
        });
        
        if (result.success) {
          setAnnotations(annotations.map(a => 
            a.id === editingAnnotation.id 
              ? { ...a, annotationContent }
              : a
          ));
          closePopup();
        }
      } else {
        // 新建标注
        const result = await annotationApi.create({
          documentId: document.id,
          selectedText,
          annotationContent,
          startOffset,
          endOffset
        });

        if (result.success) {
          setAnnotations([...annotations, result.annotation]);
          closePopup();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败');
    }
  };

  // 关闭弹窗
  const closePopup = () => {
    setShowPopup(false);
    setSelectedText('');
    setEditingAnnotation(null);
    if (quillRef.current) {
      quillRef.current.root.innerHTML = '';
    }
  };

  // 删除标注
  const handleDeleteAnnotation = async (annotationId: number) => {
    if (!confirm('确定要删除这条标注吗？')) return;

    try {
      await annotationApi.delete(annotationId);
      setAnnotations(annotations.filter(a => a.id !== annotationId));
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  // 跳转到标注位置
  const scrollToAnnotation = (annotation: Annotation) => {
    // 查找对应的高亮元素并滚动到视图
    const contentEl = contentRef.current;
    if (contentEl) {
      const highlights = contentEl.querySelectorAll('mark');
      highlights.forEach((el) => {
        if (el.textContent === annotation.selectedText) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 添加短暂的高亮闪烁效果
          (el as HTMLElement).style.backgroundColor = '#fde047';
          setTimeout(() => {
            (el as HTMLElement).style.backgroundColor = '#fef08a';
          }, 500);
        }
      });
    }
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-text-secondary mb-4">文档不存在</p>
        <button
          onClick={() => navigate('/documents')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          返回文档列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* 主阅读区域 */}
      <div
        className="flex-1 overflow-y-auto bg-white"
        onMouseUp={handleTextSelection}
      >
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2 text-text-secondary hover:text-primary-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回文档列表</span>
          </button>

          {/* 文档标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-4">{document.title}</h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(document.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bookmark className="w-4 h-4" />
                <span>{annotations.length} 条标注</span>
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full mb-8"></div>

          {/* 文档内容 - 带高亮 */}
          <div className="prose prose-lg max-w-none">
            <div 
              ref={contentRef}
              className="whitespace-pre-wrap text-text-primary leading-relaxed text-lg select-text"
            >
              {annotations.length > 0 ? renderContentWithHighlights() : document.content}
            </div>
          </div>
        </div>
      </div>

      {/* 标注列表侧边栏 */}
      <div
        className={`${
          isAnnotationListCollapsed ? 'w-0' : 'w-80'
        } bg-gray-50 border-l border-gray-100 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* 折叠按钮 */}
        <button
          onClick={() => setIsAnnotationListCollapsed(!isAnnotationListCollapsed)}
          className="absolute right-80 top-1/2 -translate-y-1/2 w-6 h-12 bg-gray-50 border border-gray-100 rounded-l-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
          style={{ right: isAnnotationListCollapsed ? '0' : '320px' }}
        >
          {isAnnotationListCollapsed ? (
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          )}
        </button>

        {!isAnnotationListCollapsed && (
          <>
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">我的标注</h3>
                  <p className="text-xs text-text-secondary">{annotations.length} 条笔记</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {annotations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Highlighter className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-text-secondary">还没有标注</p>
                  <p className="text-xs text-text-secondary mt-1">选中文本即可添加标注</p>
                </div>
              ) : (
                annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:border-primary-100 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => scrollToAnnotation(annotation)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        摘录
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnotation(annotation.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <p className="text-sm text-text-primary italic mb-3 line-clamp-3 border-l-2 border-primary-200 pl-3">
                      "{annotation.selectedText}"
                    </p>
                    {annotation.annotationContent && annotation.annotationContent !== '<p><br></p>' && (
                      <div
                        className="text-sm text-text-secondary prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: annotation.annotationContent }}
                      />
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(annotation.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* 标注浮动框 */}
      {showPopup && (
        <>
          {/* 背景遮罩（点击关闭） */}
          <div
            className="fixed inset-0 z-40"
            onClick={closePopup}
          />

          {/* 浮动框 */}
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-96 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{
              left: Math.min(Math.max(popupPosition.x - 192, 16), window.innerWidth - 416),
              top: Math.max(popupPosition.y - 400, 16),
            }}
          >
            {/* 头部 */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-400 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Highlighter className="w-4 h-4" />
                <span className="font-medium">
                  {editingAnnotation ? '编辑标注' : '添加标注'}
                </span>
              </div>
              <button
                onClick={closePopup}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 选中文本预览 */}
            <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
              <p className="text-sm text-primary-700 italic line-clamp-2">
                "{selectedText}"
              </p>
            </div>

            {/* 笔记输入 */}
            <div className="p-4">
              <p className="text-xs text-text-secondary mb-2 flex items-center gap-1">
                <AlignLeft className="w-3 h-3" />
                <span>写下你的笔记</span>
              </p>
              <div ref={editorRef} className="bg-gray-50 rounded-lg" />
            </div>

            {/* 操作按钮 */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={closePopup}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveAnnotation}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                保存标注
              </button>
            </div>
          </div>
        </>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 shadow-lg">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
