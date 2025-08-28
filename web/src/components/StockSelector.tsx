import React from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { StockSelectorProps } from '@/types';
import { cn, getDirectionColor } from '@/utils';

export const StockSelector: React.FC<StockSelectorProps> = ({
  predictions,
  selectedSymbol,
  onSymbolSelect,
}) => {
  const symbolList = Object.keys(predictions);

  if (symbolList.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">暂无股票数据</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">股票选择</h2>
      
      {/* 移动端下拉选择器 */}
      <div className="block sm:hidden mb-4">
        <select
          value={selectedSymbol || ''}
          onChange={(e) => onSymbolSelect(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">选择股票</option>
          {symbolList.map((symbol) => {
            const prediction = predictions[symbol];
            return (
              <option key={symbol} value={symbol}>
                {symbol} - {prediction.name}
              </option>
            );
          })}
        </select>
      </div>

      {/* 桌面端列表 */}
      <div className="hidden sm:block space-y-2">
        {symbolList.map((symbol) => {
          const prediction = predictions[symbol];
          const isSelected = selectedSymbol === symbol;
          
          return (
            <button
              key={symbol}
              onClick={() => onSymbolSelect(symbol)}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{symbol}</span>
                    <span className="text-sm text-gray-600">{prediction.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">
                      预测: ¥{prediction.predicted_close.toFixed(2)}
                    </span>
                    <div className={cn('flex items-center space-x-1', getDirectionColor(prediction.direction))}>
                      {prediction.direction === 'Up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{prediction.direction}</span>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <ChevronDown className="w-5 h-5 text-primary-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
