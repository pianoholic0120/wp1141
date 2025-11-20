'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TableSkeleton } from '../components/SkeletonLoader';
import { useToast, ToastContainer } from '../components/Toast';

type ConversationItem = {
  _id: string;
  userId: string;
  lastMessageAt: string;
  messageCount: number;
  status: string;
  startedAt: string;
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export default function ConversationsPage() {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'archived'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [sortBy, setSortBy] = useState<'lastMessageAt' | 'startedAt' | 'messageCount' | 'userId'>('lastMessageAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [lastUpdate, setLastUpdate] = useState<string>('尚未更新');
  const [newConversationsCount, setNewConversationsCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const load = useCallback(async (pageNum: number = pagination.page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (messageSearch) params.append('messageSearch', messageSearch);
      params.append('page', pageNum.toString());
      params.append('limit', pagination.limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const res = await fetch(`/api/admin/conversations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.items || [];
        
        // 檢測新對話
        if (items.length > 0 && pageNum === pagination.page) {
          const newCount = newItems.filter(
            (newItem: ConversationItem) =>
              !items.some((oldItem) => oldItem._id === newItem._id) ||
              new Date(newItem.lastMessageAt) > new Date(
                items.find((oldItem) => oldItem._id === newItem._id)?.lastMessageAt || ''
              )
          ).length;
          setNewConversationsCount(newCount);
        }
        
        setItems(newItems);
        setPagination({
          page: data.page || pageNum,
          limit: data.limit || pagination.limit,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
          hasNextPage: data.hasNextPage || false,
          hasPrevPage: data.hasPrevPage || false,
        });
        setLastUpdate(new Date().toLocaleTimeString('zh-TW'));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, dateFrom, dateTo, messageSearch, sortBy, sortOrder, pagination.page, pagination.limit, items]);

  // 只在篩選條件變化時重新載入（但不包括 page）
  useEffect(() => {
    load(1); // 重置到第一頁
    const timer = setInterval(() => load(pagination.page), 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, dateFrom, dateTo, messageSearch, sortBy, sortOrder]);

  // 頁面變化時重新載入
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  // 檢查是否有篩選條件
  const hasActiveFilters = useMemo(() => {
    return (
      search.trim() !== '' ||
      statusFilter !== 'all' ||
      dateFrom !== '' ||
      dateTo !== '' ||
      messageSearch.trim() !== ''
    );
  }, [search, statusFilter, dateFrom, dateTo, messageSearch]);

  // 清除所有篩選條件
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setMessageSearch('');
    setSelectedIds(new Set());
  };

  // 批次刪除對話
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`確定要刪除 ${selectedIds.size} 個對話嗎？此操作無法復原。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/conversations/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedIds(new Set());
        load(pagination.page);
        showToast(data.message || `成功刪除 ${selectedIds.size} 個對話`, 'success');
      } else {
        const data = await res.json();
        showToast(data.error || '刪除失敗：未知錯誤', 'error');
      }
    } catch (error) {
      console.error('Batch delete error:', error);
      showToast('刪除時發生錯誤，請稍後再試', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 批次更新狀態
  const handleBatchUpdateStatus = async (newStatus: 'active' | 'resolved' | 'archived') => {
    if (selectedIds.size === 0) return;
    
    const statusNames = {
      active: '進行中',
      resolved: '已結束',
      archived: '封存',
    };
    
    if (!confirm(`確定要將 ${selectedIds.size} 個對話更新為「${statusNames[newStatus]}」狀態嗎？`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/conversations/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedIds(new Set());
        load(pagination.page);
        showToast(data.message || `成功更新 ${selectedIds.size} 個對話狀態`, 'success');
      } else {
        const data = await res.json();
        showToast(data.error || '更新失敗：未知錯誤', 'error');
      }
    } catch (error) {
      console.error('Batch update error:', error);
      showToast('更新時發生錯誤，請稍後再試', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // 切換選中狀態
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item._id)));
    }
  };

  // 切換排序
  const handleSort = (field: 'lastMessageAt' | 'startedAt' | 'messageCount' | 'userId') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="relative">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">對話列表</h2>
            <p className="text-gray-600 text-sm">管理所有使用者對話記錄（每 5 秒自動更新）</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="搜尋使用者 ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <input
              type="text"
              placeholder="搜尋訊息內容..."
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="all">全部狀態</option>
              <option value="active">進行中</option>
              <option value="resolved">已結束</option>
              <option value="archived">封存</option>
            </select>
            <input
              type="date"
              placeholder="開始日期"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <input
              type="date"
              placeholder="結束日期"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <select
              value={pagination.limit}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value={10}>每頁 10 筆</option>
              <option value={20}>每頁 20 筆</option>
              <option value={50}>每頁 50 筆</option>
              <option value={100}>每頁 100 筆</option>
            </select>
          </div>
          
          {/* Filter Actions */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                總計: {pagination.total} 個對話 | 最後更新: {lastUpdate}
                {newConversationsCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    新訊息: {newConversationsCount}
                  </span>
                )}
              </span>
            </div>
            {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                >
                  清除所有篩選
                </button>
              )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">已應用的篩選條件：</span>
                {search && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    使用者 ID: {search}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    狀態: {statusFilter === 'active' ? '進行中' : statusFilter === 'resolved' ? '已結束' : '封存'}
                  </span>
                )}
                {dateFrom && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    開始: {dateFrom}
                  </span>
                )}
                {dateTo && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    結束: {dateTo}
                  </span>
                )}
                {messageSearch && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    訊息內容: {messageSearch}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 批次操作工具列 */}
      {selectedIds.size > 0 && (
        <div className="card mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm font-medium text-yellow-900">
              已選中 {selectedIds.size} 個對話
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {(isUpdating || isDeleting) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>{isDeleting ? '刪除中...' : '更新中...'}</span>
                </div>
              )}
              <button
                onClick={() => handleBatchUpdateStatus('active')}
                disabled={isUpdating || isDeleting}
                className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                設為進行中
              </button>
              <button
                onClick={() => handleBatchUpdateStatus('resolved')}
                disabled={isUpdating || isDeleting}
                className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                設為已結束
              </button>
              <button
                onClick={() => handleBatchUpdateStatus('archived')}
                disabled={isUpdating || isDeleting}
                className="px-3 py-1 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                設為封存
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                disabled={isUpdating || isDeleting}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消選擇
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={isDeleting || isUpdating}
                className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {isDeleting ? '刪除中...' : `刪除 ${selectedIds.size} 個對話`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                      checked={selectedIds.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
                    <span className="text-xs font-medium text-gray-700 uppercase">
                      {selectedIds.size === items.length ? '取消全選' : '全選'}
              </span>
            </label>
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('userId')}
                    className="text-xs font-medium text-gray-700 uppercase hover:text-gray-900 flex items-center gap-1"
                  >
                    使用者 ID {getSortIcon('userId')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('startedAt')}
                    className="text-xs font-medium text-gray-700 uppercase hover:text-gray-900 flex items-center gap-1"
                  >
                    開始時間 {getSortIcon('startedAt')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('lastMessageAt')}
                    className="text-xs font-medium text-gray-700 uppercase hover:text-gray-900 flex items-center gap-1"
                  >
                    最後訊息 {getSortIcon('lastMessageAt')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('messageCount')}
                    className="text-xs font-medium text-gray-700 uppercase hover:text-gray-900 flex items-center gap-1"
                  >
                    訊息數 {getSortIcon('messageCount')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-gray-700 uppercase">狀態</span>
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-gray-700 uppercase">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <p className="text-lg">目前沒有符合條件的對話</p>
                    <p className="text-sm mt-2">請調整搜尋條件或篩選器</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
          const isSelected = selectedIds.has(item._id);
          return (
                    <tr
              key={item._id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-primary-50' : ''
              }`}
            >
                      <td className="px-4 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(item._id)}
                  onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                <Link
                  href={`/admin/conversations/${item._id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {item.userId}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item.startedAt).toLocaleString('zh-TW')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item.lastMessageAt).toLocaleString('zh-TW')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.messageCount}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                      <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'resolved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status === 'active'
                          ? '進行中'
                          : item.status === 'resolved'
                            ? '已結束'
                            : '封存'}
                      </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/conversations/${item._id}`}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                        >
                          查看詳情 →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
                    </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              顯示第 {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} 筆，共{' '}
              {pagination.total} 筆
                  </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrevPage || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading && pagination.page > 1 && <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>}
                上一頁
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                      disabled={loading}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        pagination.page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNextPage || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                下一頁
                {loading && pagination.hasNextPage && <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
