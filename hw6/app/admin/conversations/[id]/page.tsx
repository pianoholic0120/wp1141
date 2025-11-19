'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { MessageSkeleton, CardSkeleton } from '../../components/SkeletonLoader';
import { useToast, ToastContainer } from '../../components/Toast';

type Message = {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    messageType?: string;
    llmProvider?: string;
    error?: string;
    latency?: number;
  };
};

type Conversation = {
  _id: string;
  userId: string;
  platform: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  status: string;
  metadata?: {
    locale?: string;
    state?: string;
  };
};

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = 新到舊, asc = 舊到新
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/conversations/${conversationId}?sortOrder=${sortOrder}`);
        if (res.ok) {
          const data = await res.json();
          setConversation(data.conversation);
          setMessages(data.messages || []);
          setLastUpdate(new Date());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
    timer = setInterval(load, 5000); // 每 5 秒更新
    return () => clearInterval(timer);
  }, [conversationId, sortOrder]);

  // 更新對話狀態
  const handleUpdateStatus = async (newStatus: 'active' | 'resolved' | 'archived') => {
    if (!conversation) return;
    
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversation((prev) => prev ? { ...prev, status: newStatus } : null);
        showToast(data.message || '狀態更新成功！', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || '更新失敗：未知錯誤', 'error');
      }
    } catch (error) {
      console.error('Update status error:', error);
      showToast('更新時發生錯誤，請稍後再試', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <CardSkeleton />
        </div>
        <MessageSkeleton count={5} />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">找不到對話</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link
              href="/admin/conversations"
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              ← 返回列表
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">對話詳情</h2>
              <p className="text-gray-600 text-sm">
                使用者 ID: {conversation.userId} | 最後更新: {lastUpdate.toLocaleTimeString('zh-TW')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <select
                value={conversation.status}
                onChange={(e) => handleUpdateStatus(e.target.value as any)}
                disabled={updatingStatus}
                className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-primary-500 outline-none transition-all flex items-center gap-2 ${
                  conversation.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : conversation.status === 'resolved'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="active">進行中</option>
                <option value="resolved">已結束</option>
                <option value="archived">封存</option>
              </select>
              {updatingStatus && (
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>
        </div>
        
        {/* Conversation Info */}
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">開始時間</div>
              <div className="font-medium">
                {new Date(conversation.startedAt).toLocaleString('zh-TW')}
              </div>
            </div>
            <div>
              <div className="text-gray-600">最後訊息</div>
              <div className="font-medium">
                {new Date(conversation.lastMessageAt).toLocaleString('zh-TW')}
              </div>
            </div>
            <div>
              <div className="text-gray-600">訊息數</div>
              <div className="font-medium">{conversation.messageCount}</div>
            </div>
            <div>
              <div className="text-gray-600">語言</div>
              <div className="font-medium">
                {conversation.metadata?.locale || 'zh-TW'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            訊息記錄（{messages.length} 則）
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 font-medium">排序方式:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="desc">新到舊（最新的在上面）</option>
                <option value="asc">舊到新（最早的在上面）</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              最後更新: {lastUpdate.toLocaleTimeString('zh-TW')}
            </div>
          </div>
        </div>
        
        {messages.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">
            <p>目前沒有訊息記錄</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`card ${
                message.role === 'user'
                  ? 'bg-blue-50 border-blue-200'
                  : message.role === 'assistant'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      message.role === 'user'
                        ? 'bg-blue-200 text-blue-800'
                        : message.role === 'assistant'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.role === 'user'
                      ? '使用者'
                      : message.role === 'assistant'
                        ? '助手'
                        : '系統'}
                  </span>
                  {message.metadata?.llmProvider && (
                    <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                      {message.metadata.llmProvider}
                    </span>
                  )}
                  {message.metadata?.latency && (
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                      {message.metadata.latency}ms
                    </span>
                  )}
                  {message.metadata?.error && (
                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                      錯誤
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(message.timestamp).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
              <div className="text-gray-900 whitespace-pre-wrap break-words max-w-full overflow-x-auto">
                {message.content}
              </div>
              {message.metadata?.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <strong>錯誤:</strong> {message.metadata.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

