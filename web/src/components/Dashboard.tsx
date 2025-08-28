import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { StockSelector } from './StockSelector';
import { PredictionDetail } from './PredictionDetail';
import { ChartDisplay } from './ChartDisplay';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';

export const Dashboard: React.FC = () => {
  const {
    predictions,
    selectedSymbol,
    loading,
    error,
    selectedPrediction,
    symbolList,
    fetchPredictions,
    refreshPredictions,
    selectSymbol,
  } = usePredictions();

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRefresh = () => {
    refreshPredictions();
  };

  if (loading && symbolList.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="正在加载股票预测数据..." />
      </div>
    );
  }

  if (error && symbolList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">股票预测仪表板</h1>
          <p className="text-gray-600 mt-2">基于机器学习的股票价格预测分析</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn btn-secondary flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新数据</span>
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <ErrorMessage message={error} onRetry={handleRefresh} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：股票选择器 */}
        <div className="lg:col-span-1">
          <StockSelector
            predictions={predictions}
            selectedSymbol={selectedSymbol}
            onSymbolSelect={selectSymbol}
          />
        </div>

        {/* 右侧：预测详情和图表 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 预测详情 */}
          <PredictionDetail
            prediction={selectedPrediction}
            loading={loading}
          />

          {/* 图表展示 */}
          {selectedPrediction && (
            <ChartDisplay
              chartImageBase64={selectedPrediction.chart_image_base64}
              symbol={selectedPrediction.symbol}
            />
          )}
        </div>
      </div>

      {/* 统计信息 */}
      {symbolList.length > 0 && (
        <div className="card bg-gray-50 border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">{symbolList.length}</div>
              <div className="text-sm text-gray-600">预测股票数量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {symbolList.filter(symbol => predictions[symbol].direction === 'Up').length}
              </div>
              <div className="text-sm text-gray-600">看涨股票</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {symbolList.filter(symbol => predictions[symbol].direction === 'Down').length}
              </div>
              <div className="text-sm text-gray-600">看跌股票</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
