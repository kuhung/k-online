import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { PredictionsData } from '@/types';

interface StatsPanelProps {
  predictions: PredictionsData;
  symbolList: string[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  predictions,
  symbolList,
}) => {
  if (symbolList.length === 0) {
    return null;
  }

  const upCount = symbolList.filter(symbol => predictions[symbol].direction === 'Up').length;
  const downCount = symbolList.filter(symbol => predictions[symbol].direction === 'Down').length;
  const totalCount = symbolList.length;

  const stats = [
    {
      label: '总数',
      value: totalCount,
      icon: BarChart3,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      label: '看涨',
      value: upCount,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: '看跌',
      value: downCount,
      icon: TrendingDown,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">预测统计</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`p-4 rounded-lg ${stat.bgColor}`}>
              <div className="flex items-center justify-center mb-3">
                <div className={`p-2 rounded-full bg-white`}>
                  <IconComponent className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
