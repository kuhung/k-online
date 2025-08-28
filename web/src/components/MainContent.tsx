import React from 'react';
import { StockSelector } from './StockSelector';
import { PredictionDetail } from './PredictionDetail';
import { ChartDisplay } from './ChartDisplay';
import { StatsPanel } from './StatsPanel';
import { PredictionsData, KlinePrediction } from '@/types';

interface MainContentProps {
  predictions: PredictionsData;
  selectedSymbol: string | null;
  selectedPrediction: KlinePrediction | null;
  loading: boolean;
  onSymbolSelect: (symbol: string) => void;
  symbolList: string[]; // Added symbolList prop
}

export const MainContent: React.FC<MainContentProps> = ({
  predictions,
  selectedSymbol,
  selectedPrediction,
  loading,
  onSymbolSelect,
  symbolList,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
      {/* 左侧：标的选择器 */}
      <div className="xl:col-span-1">
        <div className="sticky top-6 flex flex-col gap-6 lg:gap-8">
          <StockSelector
            predictions={predictions}
            selectedSymbol={selectedSymbol}
            onSymbolSelect={onSymbolSelect}
          />
          <StatsPanel predictions={predictions} symbolList={symbolList} />
        </div>
      </div>

      {/* 右侧：预测详情和图表 */}
      <div className="xl:col-span-3">
        <div className="space-y-6 lg:space-y-8">
          {/* 预测详情 */}
          <PredictionDetail
            prediction={selectedPrediction}
            loading={loading}
          />

          {/* 图表展示 */}
          {selectedPrediction && (
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">
                  预测图表 ({selectedPrediction.symbol})
                </h3>
                <div className="text-sm text-gray-500">
                  下个24小时预测
                </div>
              </div>
              <ChartDisplay
                chartImageBase64={selectedPrediction.chart_image_base64}
                symbol={selectedPrediction.symbol}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
