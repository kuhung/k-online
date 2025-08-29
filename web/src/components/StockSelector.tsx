import React from 'react';
import { ChevronDown, TrendingUp, TrendingDown, Database } from 'lucide-react';
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
        <p className="text-gray-500 text-center">暂无标的数据</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">标的选择</h2>
        <div className="text-sm text-gray-500">
          {symbolList.length} 只标的
        </div>
      </div>
      
      {/* 移动端下拉选择器 */}
      <div className="block xl:hidden mb-4 relative w-full">
        <select
          value={selectedSymbol || ''}
          onChange={(e) => onSymbolSelect(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm font-medium pr-8 max-w-full overflow-y-auto"
        >
          <option value="">请选择标的</option>
          {symbolList.map((symbol) => {
            const prediction = predictions[symbol];
            return (
              <option key={symbol} value={symbol} className="truncate">
                {symbol} {prediction.name ? `- ${prediction.name}` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* 桌面端列表 */}
      <div className="hidden xl:block">
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
          {symbolList.map((symbol) => {
            const prediction = predictions[symbol];
            const isSelected = selectedSymbol === symbol;
            
            return (
              <button
                key={symbol}
                onClick={() => onSymbolSelect(symbol)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-sm',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{symbol}</span>
                      <span className="text-xs text-gray-500 truncate">{prediction.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={cn('flex items-center space-x-1 text-xs font-medium', getDirectionColor(prediction.direction))}>
                        {prediction.direction === 'Up' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>{prediction.direction === 'Up' ? '看涨' : '看跌'}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center justify-center w-6 h-6 bg-primary-100 rounded-full flex-shrink-0">
                      <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 数据源信息 */}
      {selectedSymbol && predictions[selectedSymbol] && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center space-x-2 text-sm text-gray-600">
          <Database className="w-4 h-4 text-gray-500" />
          <span>数据源: {predictions[selectedSymbol].data_source}</span>
        </div>
      )}
    </div>
  );
};
