import { calculateStats } from '@/services/analytics.service';

export default async function AnalyticsPage() {
  let stats;
  try {
    stats = await calculateStats();
  } catch (error) {
    console.error('Failed to load stats:', error);
    // 返回默认值以避免页面崩溃
    stats = {
      totalConversations: 0,
      totalMessages: 0,
      activeConversations: 0,
      last24hMessages: 0,
      last24hConversations: 0,
      avgMessagesPerConversation: 0,
    };
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">分析報表</h2>
            <p className="text-gray-600 text-sm">系統統計數據與使用情況分析</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          label="總對話數"
          value={stats.totalConversations}
          iconType="conversation"
          color="blue"
        />
        <StatCard
          label="總訊息數"
          value={stats.totalMessages}
          iconType="message"
          color="green"
        />
        <StatCard
          label="進行中對話"
          value={stats.activeConversations}
          iconType="active"
          color="purple"
        />
        <StatCard
          label="過去 24 小時訊息"
          value={stats.last24hMessages}
          iconType="clock"
          color="orange"
        />
      </div>

      {/* Additional Stats */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">詳細統計</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.avgMessagesPerConversation !== undefined && (
            <div>
              <div className="text-sm text-gray-600 mb-1">平均每對話訊息數</div>
              <div className="text-2xl font-bold text-primary-600">
                {stats.avgMessagesPerConversation}
              </div>
            </div>
          )}
          {stats.last24hConversations !== undefined && (
            <div>
              <div className="text-sm text-gray-600 mb-1">過去 24 小時新對話</div>
              <div className="text-2xl font-bold text-primary-600">
                {stats.last24hConversations}
              </div>
            </div>
          )}
          {stats.avgResponseTime !== undefined && (
            <div>
              <div className="text-sm text-gray-600 mb-1">平均回應時間</div>
              <div className="text-2xl font-bold text-primary-600">
                {stats.avgResponseTime}ms
              </div>
              {stats.totalWithLatency !== undefined && (
                <div className="text-xs text-gray-500 mt-1">
                  基於 {stats.totalWithLatency} 筆記錄
                </div>
              )}
            </div>
          )}
          {stats.errorRate !== undefined && (
            <div>
              <div className="text-sm text-gray-600 mb-1">錯誤率</div>
              <div className={`text-2xl font-bold ${
                stats.errorRate > 5 ? 'text-red-600' : stats.errorRate > 2 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {stats.errorRate}%
              </div>
              {stats.totalErrors !== undefined && (
                <div className="text-xs text-gray-500 mt-1">
                  共 {stats.totalErrors} 個錯誤
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  iconType,
  color = 'blue',
}: {
  label: string;
  value: number;
  iconType?: 'conversation' | 'message' | 'active' | 'clock';
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  const renderIcon = () => {
    const iconClass = `w-6 h-6 ${iconColors[color]}`;
    switch (iconType) {
      case 'conversation':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case 'message':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case 'active':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`card border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium opacity-80">{label}</div>
        {iconType && (
          <div className={`p-2 rounded-lg ${colorClasses[color].split(' ')[0]}`}>
            {renderIcon()}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
