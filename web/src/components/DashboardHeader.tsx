import React from 'react';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  loading,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">K线预测仪表板</h1>
        <p className="text-gray-600">基于机器学习的K线预测分析（仅供学习交流，不构成投资建议。投资有风险，入市需谨慎）</p>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="btn btn-secondary flex items-center space-x-2 disabled:opacity-50 self-start sm:self-auto"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span>刷新数据</span>
      </button>
    </div>
  );
};
