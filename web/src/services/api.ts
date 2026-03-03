import { PredictionsData, ApiResponse, KlinePrediction } from '@/types';

class ApiService {
  private blobUrl: string | null = null;

  private async getLatestPredictionUrl(forceRefresh = false): Promise<string> {
    if (this.blobUrl && !forceRefresh) {
      return this.blobUrl;
    }

    try {
      const response = await fetch('/api/get-latest-prediction-url');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.url) {
        throw new Error('Invalid response from API: URL not found');
      }
      const url: string = data.url;
      this.blobUrl = url;
      return url;
    } catch (error) {
      console.error('Failed to get latest prediction URL:', error);
      return '/predictions.json';
    }
  }

  async fetchPredictions(forceRefresh = false): Promise<ApiResponse<PredictionsData>> {
    try {
      const url = await this.getLatestPredictionUrl(forceRefresh);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();

      return {
        success: true,
        data: rawData as PredictionsData,
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