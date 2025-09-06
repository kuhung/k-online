import React, { useState, useEffect } from 'react';
import { StockSelector } from './StockSelector';
import { PredictionDetail } from './PredictionDetail';
import { ChartDisplay } from './ChartDisplay';
import { StatsPanel } from './StatsPanel';
import { PredictionsData, KlinePrediction } from '@/types';
import { getSymbolDisplayName, getFormattedSymbol, isSmallScreen } from '@/utils';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

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
  const [showVolume, setShowVolume] = useState(true);
  const [chartRef, setChartRef] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端设备
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(isSmallScreen());
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 增强的重置功能，包含按钮状态重置
  const handleResetAll = () => {
    // 重置缩放
    if (chartRef) {
      chartRef.dispatchAction({
        type: 'dataZoom',
        start: 70,
        end: 100
      });
      
      // 重置图例选择状态
      chartRef.dispatchAction({
        type: 'legendSelect',
        name: '历史K线'
      });
      chartRef.dispatchAction({
        type: 'legendSelect',
        name: '预测均价'
      });
      chartRef.dispatchAction({
        type: 'legendSelect',
        name: '预测范围'
      });
      chartRef.dispatchAction({
        type: 'legendSelect',
        name: '历史成交量'
      });
      chartRef.dispatchAction({
        type: 'legendSelect',
        name: '预测成交量'
      });
      
      // 确保预测上限和下限保持隐藏状态
      chartRef.dispatchAction({
        type: 'legendUnSelect',
        name: '预测上限'
      });
      chartRef.dispatchAction({
        type: 'legendUnSelect',
        name: '预测下限'
      });
    }
    // 重置按钮状态
    setShowVolume(true);
  };
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
      {/* 左侧：标的选择器 */}
      <div className="xl:col-span-1 relative z-20">
        <div className="sticky top-6 flex flex-col gap-6 lg:gap-8 flex-col md:flex-col-reverse">
          <StatsPanel predictions={predictions} symbolList={symbolList} />
          <StockSelector
            predictions={predictions}
            selectedSymbol={selectedSymbol}
            onSymbolSelect={onSymbolSelect}
            groupByMarket={true}
          />
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
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    预测图表 ({getFormattedSymbol(selectedPrediction.symbol)} - {selectedPrediction.display_name || getSymbolDisplayName(selectedPrediction.symbol)})
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    未来24小时窗口
                  </p>
                </div>
                
                {/* 控制按钮组 - 移动端简化 */}
                {!isMobile && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowVolume(!showVolume)}
                      className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-md transition-colors ${
                        showVolume 
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {showVolume ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span>成交量</span>
                    </button>
                    
                    <button
                      onClick={handleResetAll}
                      className="flex items-center space-x-2 px-3 py-1 text-sm rounded-md transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                      title="重置缩放和按钮状态"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>重置</span>
                    </button>
                  </div>
                )}
                
                {/* 移动端简化的控制按钮 */}
                {isMobile && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowVolume(!showVolume)}
                      className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
                        showVolume 
                          ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                      title={showVolume ? '隐藏成交量' : '显示成交量'}
                    >
                      {showVolume ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
              
              <ChartDisplay
                symbol={selectedPrediction.symbol}
                chartData={selectedPrediction.chart_data}
                showVolume={showVolume}
                onChartReady={(chart) => setChartRef(chart)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
