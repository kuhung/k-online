import React from 'react';
import { Calendar, TrendingUp, TrendingDown, RefreshCw, HelpCircle } from 'lucide-react';
import { PredictionDetailProps } from '@/types';
import { formatDateTime, formatPercentage, getDirectionColor, cn, getSymbolDisplayName, getFormattedSymbol } from '@/utils';
import { PredictionDetailSkeleton } from './SkeletonLoader';
import { Tooltip, MetricExplanations } from './Tooltip';

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
      label: '上涨预测',
      value: formatPercentage(prediction.upside_probability),
      icon: TrendingUp,
      color: 'text-red-600',
      explanationKey: 'upside_probability' as keyof typeof MetricExplanations,
    },
    {
      label: '波动放大',
      value: formatPercentage(prediction.volatility_amplification_probability),
      icon: RefreshCw,
      color: 'text-yellow-600',
      explanationKey: 'volatility_amplification' as keyof typeof MetricExplanations,
    },
    ...(prediction.mode === 'backtest' && prediction.backtest_accuracy ? [{
      label: '准确',
      value: formatPercentage(prediction.backtest_accuracy) === '100.0%' ? 'True' : 'False',
      icon: RefreshCw,
      color: 'text-blue-600',
      explanationKey: 'backtest_accuracy' as keyof typeof MetricExplanations,
    }] : []),
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
            {/* 回测指标 */}
            <div className="flex gap-2">
              {metrics.map((metric, index) => {
                const IconComponent = metric.icon;
                const explanation = MetricExplanations[metric.explanationKey];
                return (
                  <div key={index} className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center min-w-[100px] relative">
                    <div className="flex items-center space-x-1 mb-1">
                      <IconComponent className={cn('w-3 h-3', metric.color)} />
                      <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                      <Tooltip
                        content={explanation.description}
                        position="auto"
                      >
                        <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <div className={cn('text-lg font-bold', metric.color)}>{metric.value}</div>
                  </div>
                );
              })}
            </div>

            <div className={cn('flex items-center justify-center space-x-2 px-3 py-2 rounded-lg', 
              prediction.direction === 'Up' ? 'bg-red-100' : 'bg-green-100'
            )}>
              {prediction.direction === 'Up' ? (
                <TrendingUp className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-600" />
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
