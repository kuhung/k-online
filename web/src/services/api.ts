import { PredictionsData, ApiResponse, KlinePrediction } from '@/types';
import { list } from '@vercel/blob';

class ApiService {
  private blobUrl: string | null = null;

  constructor() {
    // 在生产环境中，这可能是一个实际的API端点
  }

  /**
   * 获取最新的预测数据URL
   */
  private async getLatestPredictionUrl(): Promise<string> {
    if (this.blobUrl) {
      return this.blobUrl;
    }

    try {
      // 列出所有预测文件
      const { blobs } = await list();
      
      // 按时间戳排序并获取最新的文件
      const latestBlob = blobs
        .filter(blob => blob.pathname.startsWith('predictions_'))
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];

      if (!latestBlob) {
        throw new Error('No prediction files found');
      }

      this.blobUrl = latestBlob.url;
      return this.blobUrl;
    } catch (error) {
      console.error('Failed to get latest prediction URL:', error);
      // 如果获取失败，回退到本地文件
      return '/predictions.json';
    }
  }

  /**
   * 获取所有K线预测数据
   */
  async fetchPredictions(): Promise<ApiResponse<PredictionsData>> {
    try {
      const url = await this.getLatestPredictionUrl();
      const response = await fetch(url);
      
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
      const allPredictions = await this.fetchPredictions();
      
      if (!allPredictions.success || !allPredictions.data) {
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