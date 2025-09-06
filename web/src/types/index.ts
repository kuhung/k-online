// 市场类型枚举
export enum MarketType {
  CRYPTO = 'crypto',
  INDEX = 'index'
}

// 市场信息接口
export interface MarketInfo {
  type: MarketType;
  name: string;
  icon: string;
  description: string;
}

// K线预测数据类型定义
export interface KlinePrediction {
  symbol: string;
  name: string;
  updated_at_utc: string;
  direction: 'Up' | 'Down';
  upside_probability: string;
  volatility_amplification_probability: string;
  chart_image_base64: string;
  data_source: string;
  market_type?: MarketType; // 可选字段，用于兼容现有数据
}

// 多标的预测数据类型
export interface PredictionsData {
  [symbol: string]: KlinePrediction;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 应用状态类型
export interface AppState {
  predictions: PredictionsData;
  selectedSymbol: string | null;
  loading: boolean;
  error: string | null;
}

// 组件Props类型
export interface StockSelectorProps {
  predictions: PredictionsData;
  selectedSymbol: string | null;
  onSymbolSelect: (symbol: string) => void;
  groupByMarket?: boolean; // 是否按市场分组显示
}

export interface PredictionDetailProps {
  prediction: KlinePrediction | null;
  loading: boolean;
}

export interface ChartDisplayProps {
  chartImageBase64: string;
  symbol: string;
}
