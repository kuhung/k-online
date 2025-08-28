import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Database, RefreshCw } from 'lucide-react';
import { PredictionDetailProps } from '@/types';
import { formatDateTime, formatCurrency, formatPercentage, getDirectionColor, cn } from '@/utils';
import { LoadingSpinner } from './LoadingSpinner';

export const PredictionDetail: React.FC<PredictionDetailProps> = ({
  prediction,
  loading,
}) => {
  if (loading) {
    return (
      <div className="card">
        <LoadingSpinner text="加载预测数据中..." />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">选择股票查看预测</h3>
          <p className="text-gray-600">请从左侧选择一只股票来查看详细的预测信息</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: '预测收盘价',
      value: formatCurrency(prediction.predicted_close),
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: '实际收盘价',
      value: formatCurrency(prediction.actual_close),
      icon: Database,
      color: 'text-gray-600',
    },
    {
      label: '上涨概率',
      value: formatPercentage(prediction.upside_probability),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: '波动放大概率',
      value: formatPercentage(prediction.volatility_amplification_probability),
      icon: RefreshCw,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 股票基本信息 */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{prediction.symbol}</h2>
            <p className="text-gray-600">{prediction.name}</p>
          </div>
          <div className={cn('flex items-center space-x-2 px-3 py-1 rounded-full', 
            prediction.direction === 'Up' ? 'bg-green-100' : 'bg-red-100'
          )}>
            {prediction.direction === 'Up' ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={cn('font-semibold', getDirectionColor(prediction.direction))}>
              {prediction.direction === 'Up' ? '看涨' : '看跌'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Calendar className="w-4 h-4" />
          <span>更新时间: {formatDateTime(prediction.updated_at_utc)}</span>
        </div>

        {/* 预测指标 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div key={index} className="metric-card">
                <div className="flex items-center space-x-3 mb-2">
                  <IconComponent className={cn('w-5 h-5', metric.color)} />
                  <span className="metric-label">{metric.label}</span>
                </div>
                <div className={cn('metric-value', metric.color)}>{metric.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 数据源信息 */}
      <div className="card bg-gray-50 border-gray-200">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">数据源:</span>
          <span className="text-sm text-gray-600">{prediction.data_source}</span>
        </div>
      </div>
    </div>
  );
};
