import React from 'react';
import { Calendar, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { PredictionDetailProps } from '@/types';
import { formatDateTime, formatPercentage, getDirectionColor, cn, getSymbolDisplayName, getFormattedSymbol } from '@/utils';
import { PredictionDetailSkeleton } from './SkeletonLoader';

export const PredictionDetail: React.FC<PredictionDetailProps> = ({
  prediction,
  loading,
}) => {
  if (loading) {
    return <PredictionDetailSkeleton />;
  }

  if (!prediction) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">选择标的查看预测</h3>
          <p className="text-gray-600">请从左侧选择一个标的来查看详细的预测信息</p>
        </div>
      </div>
    );
  }

  const metrics = [
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
      {/* 标的基本信息 */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{getFormattedSymbol(prediction.symbol)}</h2>
              <span className="text-lg font-medium text-gray-700">
                {prediction.display_name || getSymbolDisplayName(prediction.symbol)}
              </span>
            </div>
            <p className="text-gray-600">{prediction.name}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
              <Calendar className="w-4 h-4" />
              <span>更新时间: {formatDateTime(prediction.updated_at_utc)}</span>
            </div>
          </div>

          <div className="flex flex-col-reverse items-stretch gap-4 md:flex-row md:items-center md:space-x-6">
            {/* 预测指标 */}
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center md:w-40">
                    <div className="flex items-center space-x-2 mb-2">
                      <IconComponent className={cn('w-4 h-4', metric.color)} />
                      <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                    </div>
                    <div className={cn('text-xl font-bold', metric.color)}>{metric.value}</div>
                  </div>
                );
              })}
            </div>

            <div className={cn('flex items-center justify-center space-x-2 px-3 py-2 rounded-lg', 
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
        </div>
      </div>
    </div>
  );
};
