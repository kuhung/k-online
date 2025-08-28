import React, { useState } from 'react';
import { BarChart3, AlertCircle, Maximize2 } from 'lucide-react';
import { ChartDisplayProps } from '@/types';
import { formatImageDataUrl, isValidBase64Image } from '@/utils';

export const ChartDisplay: React.FC<ChartDisplayProps> = ({
  chartImageBase64,
  symbol,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!chartImageBase64 || !isValidBase64Image(chartImageBase64)) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">预测图表</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p>暂无图表数据</p>
        </div>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">预测图表</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-red-500">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p>图表加载失败</p>
        </div>
      </div>
    );
  }

  const imageUrl = formatImageDataUrl(chartImageBase64);

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">预测图表</h3>
            <span className="text-sm text-gray-500">({symbol})</span>
          </div>
          <button
            onClick={handleFullscreen}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="全屏查看"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={`${symbol} 预测图表`}
            className="w-full h-auto max-h-96 object-contain"
            onError={handleImageError}
          />
        </div>
        
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>* 图表显示了股票价格的历史数据和预测趋势</p>
        </div>
      </div>

      {/* 全屏模态框 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={handleFullscreen}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              title="关闭全屏"
            >
              <Maximize2 className="w-6 h-6" />
            </button>
            <img
              src={imageUrl}
              alt={`${symbol} 预测图表`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={handleImageError}
            />
          </div>
        </div>
      )}
    </>
  );
};
