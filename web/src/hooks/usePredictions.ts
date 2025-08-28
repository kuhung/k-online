import { useAppStore } from '@/store';
import { apiService } from '@/services/api';

export const usePredictions = () => {
  const {
    predictions,
    selectedSymbol,
    loading,
    error,
    setPredictions,
    setSelectedSymbol,
    setLoading,
    setError,
  } = useAppStore();

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.fetchPredictions();
      
      if (response.success && response.data) {
        setPredictions(response.data);
        
        // 如果还没有选中的标的，自动选择第一个
        if (!selectedSymbol) {
          const firstSymbol = Object.keys(response.data)[0];
          if (firstSymbol) {
            setSelectedSymbol(firstSymbol);
          }
        }
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const refreshPredictions = () => {
    fetchPredictions();
  };

  const selectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const getSelectedPrediction = () => {
    if (!selectedSymbol || !predictions[selectedSymbol]) {
      return null;
    }
    return predictions[selectedSymbol];
  };

  const getSymbolList = () => {
    return Object.keys(predictions);
  };

  return {
    predictions,
    selectedSymbol,
    loading,
    error,
    selectedPrediction: getSelectedPrediction(),
    symbolList: getSymbolList(),
    fetchPredictions,
    refreshPredictions,
    selectSymbol,
  };
};
