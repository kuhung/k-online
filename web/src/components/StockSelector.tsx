import React, { useState, useMemo } from 'react';
import { ChevronDown, TrendingUp, TrendingDown, Database, ChevronRight } from 'lucide-react';
import { StockSelectorProps, MarketType } from '@/types';
import { cn, getDirectionColor, groupPredictionsByMarket, getMarketInfo } from '@/utils';

export const StockSelector: React.FC<StockSelectorProps> = ({
  predictions,
  selectedSymbol,
  onSymbolSelect,
  groupByMarket = true,
}) => {
  const [expandedMarkets, setExpandedMarkets] = useState<Set<MarketType>>(new Set([MarketType.CRYPTO, MarketType.INDEX]));
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const symbolList = Object.keys(predictions);
  
  // 按市场类型分组数据
  const groupedPredictions = useMemo(() => {
    return groupPredictionsByMarket(predictions);
  }, [predictions]);

  // 切换市场展开状态
  const toggleMarketExpansion = (marketType: MarketType) => {
    const newExpanded = new Set(expandedMarkets);
    if (newExpanded.has(marketType)) {
      newExpanded.delete(marketType);
    } else {
      newExpanded.add(marketType);
    }
    setExpandedMarkets(newExpanded);
  };

  if (symbolList.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">暂无标的数据</p>
      </div>
    );
  }

  // 渲染市场分组的标的选择器
  const renderGroupedSelector = () => {
    return (
      <div className="space-y-4">
        {Object.values(MarketType).map((marketType) => {
          const marketPredictions = groupedPredictions[marketType];
          const marketSymbols = Object.keys(marketPredictions);
          const marketInfo = getMarketInfo(marketType);
          const isExpanded = expandedMarkets.has(marketType);
          
          if (marketSymbols.length === 0) return null;

          return (
            <div key={marketType} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* 市场标题栏 */}
              <button
                onClick={() => toggleMarketExpansion(marketType)}
                className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{marketInfo.icon}</span>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900">{marketInfo.name}</h3>
                    <p className="text-xs text-gray-500">{marketSymbols.length} 只标的</p>
                  </div>
                </div>
                <ChevronRight 
                  className={cn(
                    'w-4 h-4 text-gray-400 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )} 
                />
              </button>

              {/* 标的列表 */}
              {isExpanded && (
                <div className="p-2">
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {marketSymbols.map((symbol) => {
                      const prediction = marketPredictions[symbol];
                      const isSelected = selectedSymbol === symbol;
                      
                      return (
                        <button
                          key={symbol}
                          onClick={() => onSymbolSelect(symbol)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900 text-sm">{symbol}</span>
                                <span className="text-xs text-gray-500 truncate">{prediction.name}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className={cn('flex items-center space-x-1 text-xs font-medium', getDirectionColor(prediction.direction))}>
                                  {prediction.direction === 'Up' ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  <span>{prediction.direction === 'Up' ? '看涨' : '看跌'}</span>
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center justify-center w-5 h-5 bg-primary-100 rounded-full flex-shrink-0">
                                <ChevronDown className="w-3 h-3 text-primary-600" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染移动端自定义分组选择器
  const renderMobileCustomSelector = () => {
    const selectedPrediction = selectedSymbol ? predictions[selectedSymbol] : null;

    return (
      <div className="relative">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <div className="flex-1 min-w-0">
            {selectedPrediction ? (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 text-sm">{selectedSymbol}</span>
                <span className="text-xs text-gray-500 truncate">{selectedPrediction.name}</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">请选择标的</span>
            )}
          </div>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showMobileMenu && 'rotate-180')} />
        </button>

        {showMobileMenu && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black bg-opacity-20"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {Object.values(MarketType).map((marketType) => {
                const marketPredictions = groupedPredictions[marketType];
                const marketSymbols = Object.keys(marketPredictions);
                const marketInfo = getMarketInfo(marketType);

                if (marketSymbols.length === 0) return null;

                return (
                  <div key={marketType}>
                    <div className="px-4 py-2 bg-gray-50 border-b border-t border-gray-100 sticky top-0">
                      <h3 className="text-sm font-semibold text-gray-800">{marketInfo.name}</h3>
                    </div>
                    {marketSymbols.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => {
                          onSymbolSelect(symbol);
                          setShowMobileMenu(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3 text-sm flex items-center justify-between',
                          selectedSymbol === symbol ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <span>{symbol} <span className="text-xs text-gray-500">{predictions[symbol].name}</span></span>
                        {selectedSymbol === symbol && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

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
        {groupByMarket ? renderMobileCustomSelector() : (
          <select
            value={selectedSymbol || ''}
            onChange={(e) => onSymbolSelect(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm font-medium pr-8"
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
        )}
      </div>

      {/* 桌面端列表 */}
      <div className="hidden xl:block">
        {groupByMarket ? renderGroupedSelector() : (
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
        )}
      </div>

      {/* 数据源信息 */}
      {selectedSymbol && predictions[selectedSymbol] && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center space-x-2 text-sm text-gray-600">
          <Database className="w-4 h-4 text-gray-500" />
          <span>模型: {predictions[selectedSymbol].data_source}</span>
        </div>
      )}
    </div>
  );
};
