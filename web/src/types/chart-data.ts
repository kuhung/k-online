// 图表数据类型定义

// 单个数据点
export interface DataPoint {
  timestamp: string; // ISO格式时间戳
  value: number;     // 数值
}

// K线数据点
export interface CandlestickPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 预测数据系列
export interface PredictionSeries {
  name: string;           // 系列名称，如"mean", "min", "max"
  data: DataPoint[];      // 数据点数组
  color?: string;         // 可选的颜色
  strokeWidth?: number;   // 可选的线条宽度
}

// 图表数据
export interface ChartData {
  // 历史数据
  historical: {
    price: CandlestickPoint[];  // 历史K线数据
    volume: DataPoint[];        // 历史成交量数据
  };
  
  // 预测数据
  predictions: {
    price: PredictionSeries[];  // 价格预测系列（平均值、范围等）
    volume: PredictionSeries[]; // 成交量预测系列
  };
  
  // 元数据
  metadata: {
    symbol: string;           // 标的符号
    interval: string;         // 时间间隔
    lastHistoricalTime: string; // 最后一个历史数据点的时间
    predictionHorizon: number;  // 预测的数据点数量
    dataSource: string;       // 数据源
  };
}

// 更新的预测数据类型（向后兼容）
export interface EnhancedKlinePrediction {
  symbol: string;
  name: string;
  updated_at_utc: string;
  direction: 'Up' | 'Down';
  upside_probability: string;
  volatility_amplification_probability: string;
  data_source: string;
  market_type?: string;
  display_name?: string;
  
  // 新增字段
  chart_data?: ChartData;     // 原始图表数据
  chart_image_base64?: string; // 向后兼容，保留图片字段
}
