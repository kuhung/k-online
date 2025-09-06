import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ChartDisplayProps } from '@/types';
import { CandlestickChart } from './CandlestickChart';

export const ChartDisplay: React.FC<ChartDisplayProps> = ({
  symbol,
  chartData,
  showVolume = true,
  onChartReady
}) => {
  // 如果有结构化数据，直接使用K线图组件
  if (chartData) {
    return (
      <CandlestickChart 
        chartData={chartData} 
        symbol={symbol}
        showVolume={showVolume}
        onChartReady={onChartReady}
      />
    );
  }

  // 如果没有结构化数据，显示空状态
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p>暂无图表数据</p>
        <p className="text-sm mt-2">请确保后端已生成新格式的预测数据</p>
      </div>
    </div>
  );
};
