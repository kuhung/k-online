// 市场类型枚举
export enum MarketType {
  INDEX = 'index',  // 股指市场优先
  CRYPTO = 'crypto' // 加密货币市场其次
}

// 市场信息接口
export interface MarketInfo {
  type: MarketType;
  name: string;
  icon: string;
  description: string;
}

// 导入图表数据类型
export * from './chart-data';

// K线预测数据类型定义（更新版本）
export interface KlinePrediction {
  symbol: string;
  name: string;
  updated_at_utc: string;
  direction: 'Up' | 'Down';
  upside_probability: string;
  volatility_amplification_probability: string;
  data_source: string;
  market_type?: MarketType; // 可选字段，用于兼容现有数据
  display_name?: string; // 中文显示名称
  
  // 新的数据结构（优先）
  chart_data?: import('./chart-data').ChartData;
  
  // 向后兼容（可选）
  chart_image_base64?: string;
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
  symbol: string;
  chartData?: import('./chart-data').ChartData;
  chartImageBase64?: string;
  showVolume?: boolean;
  onChartReady?: (chart: any) => void;
}
