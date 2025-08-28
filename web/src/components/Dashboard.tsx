import React, { useEffect } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { DashboardHeader } from './DashboardHeader';
import { MainContent } from './MainContent';
import { ErrorMessage } from './ErrorMessage';
import { StockSelectorSkeleton, PredictionDetailSkeleton, StatsPanelSkeleton } from './SkeletonLoader';

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
      <div className="space-y-6 lg:space-y-8">
        <DashboardHeader onRefresh={handleRefresh} loading={loading} />
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          <div className="xl:col-span-1">
            <StockSelectorSkeleton />
          </div>
          <div className="xl:col-span-3">
            <PredictionDetailSkeleton />
          </div>
        </div>
        <StatsPanelSkeleton />
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
    <div className="space-y-6 lg:space-y-8">
      {/* 页面标题和刷新按钮 */}
      <DashboardHeader onRefresh={handleRefresh} loading={loading} />

      {/* 错误提示 */}
      {error && (
        <ErrorMessage message={error} onRetry={handleRefresh} />
      )}

      {/* 主要内容区域 */}
      <MainContent
        predictions={predictions}
        selectedSymbol={selectedSymbol}
        selectedPrediction={selectedPrediction}
        loading={loading}
        onSymbolSelect={selectSymbol}
        symbolList={symbolList}
      />

      {/* 统计面板 */}
      {/* <StatsPanel predictions={predictions} symbolList={symbolList} /> */}
    </div>
  );
};
