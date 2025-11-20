'use client';

import { useEffect, useState } from 'react';

type ConfigStatus = {
  llmProvider: string;
  hasLineChannelToken: boolean;
  hasLineChannelSecret: boolean;
  hasOpenAIApiKey: boolean;
  hasGoogleApiKey: boolean;
  hasMongoDBUri: boolean;
  dbStatus: string;
  dbName: string;
};

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">系統設定</h2>
            <p className="text-gray-600 text-sm">系統配置與環境狀態</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">載入配置資訊中...</span>
          </div>
        </div>
      ) : config ? (
        <>
      <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">系統配置狀態</h3>
            <div className="space-y-4">
          <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">LLM 設定</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">當前 LLM Provider</span>
                    <span className="text-sm font-medium text-gray-900">{config.llmProvider || '未設定'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">OpenAI API Key</span>
                    <span className={`text-sm font-medium ${config.hasOpenAIApiKey ? 'text-green-600' : 'text-red-600'}`}>
                      {config.hasOpenAIApiKey ? '✓ 已設定' : '✗ 未設定'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Google API Key</span>
                    <span className={`text-sm font-medium ${config.hasGoogleApiKey ? 'text-green-600' : 'text-red-600'}`}>
                      {config.hasGoogleApiKey ? '✓ 已設定' : '✗ 未設定'}
                    </span>
                  </div>
            </div>
          </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">資料庫狀態</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">MongoDB 連接狀態</span>
                    <span className={`text-sm font-medium ${
                      config.dbStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {config.dbStatus === 'connected' ? '✓ 已連接' : '✗ 未連接'}
                    </span>
                  </div>
                  {config.dbName && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">資料庫名稱</span>
                      <span className="text-sm font-medium text-gray-900">{config.dbName}</span>
                    </div>
                  )}
            </div>
          </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">LINE Bot 設定</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Channel Access Token</span>
                    <span className={`text-sm font-medium ${config.hasLineChannelToken ? 'text-green-600' : 'text-red-600'}`}>
                      {config.hasLineChannelToken ? '✓ 已設定' : '✗ 未設定'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Channel Secret</span>
                    <span className={`text-sm font-medium ${config.hasLineChannelSecret ? 'text-green-600' : 'text-red-600'}`}>
                      {config.hasLineChannelSecret ? '✓ 已設定' : '✗ 未設定'}
                    </span>
                  </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">環境變數說明</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">LINE Messaging API</h4>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>LINE_CHANNEL_ACCESS_TOKEN</li>
                  <li>LINE_CHANNEL_SECRET</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">LLM Providers</h4>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>OPENAI_API_KEY (OpenAI GPT)</li>
                  <li>GOOGLE_API_KEY (Google Gemini)</li>
                  <li>LLM_PROVIDER (預設 provider，可選: openai, gemini)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Database</h4>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>MONGODB_URI (MongoDB 連線字串)</li>
        </ul>
              </div>
            </div>
      </div>

          <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <svg
                className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-2">配置說明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 環境變數應儲存在 <code className="bg-blue-100 px-1 rounded text-xs">.env.local</code> 檔案中</li>
              <li>• 請勿將敏感資訊提交到版本控制系統</li>
                  <li>• 生產環境建議使用環境變數管理服務</li>
                  <li>• 修改環境變數後需要重新部署才能生效</li>
            </ul>
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="card">
          <div className="text-center py-12 text-gray-500">
            <p>無法載入配置資訊</p>
          </div>
        </div>
      )}
    </div>
  );
}
