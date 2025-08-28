import { PredictionsData, ApiResponse, KlinePrediction } from '@/types';

class ApiService {
  constructor() {
    // 在生产环境中，这可能是一个实际的API端点
  }

  /**
   * 获取所有K线预测数据
   */
  async fetchPredictions(): Promise<ApiResponse<PredictionsData>> {
    try {
      // 目前从静态文件读取，后续可以改为API调用
      const response = await fetch('/predictions.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * 获取单个标的的预测数据
   */
  async fetchPredictionBySymbol(symbol: string): Promise<ApiResponse<KlinePrediction>> {
    try {
      // 这里可以实现获取单个标的数据的逻辑
      const allPredictions = await this.fetchPredictions();
      
      if (!allPredictions.success || !allPredictions.data) {
        // 返回一个明确的 KlinePrediction 错误类型
        return {
          success: false,
          error: allPredictions.error || 'Failed to fetch all predictions.',
        };
      }
      
      const prediction = allPredictions.data[symbol];
      
      if (!prediction) {
        return {
          success: false,
          error: `No prediction found for symbol: ${symbol}`,
        };
      }
      
      return {
        success: true,
        data: prediction,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const apiService = new ApiService();
