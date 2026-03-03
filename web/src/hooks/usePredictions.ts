import { useAppStore } from '@/store';
import { apiService } from '@/services/api';
import React from 'react'; // 引入 React

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

  const fetchPredictions = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.fetchPredictions(forceRefresh);

      if (response.success && response.data) {
        setPredictions(response.data);

        if (!selectedSymbol) {
          const firstSymbol = Object.keys(response.data)[0];
          if (firstSymbol) {
            setSelectedSymbol(firstSymbol);
          }
        }
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const refreshPredictions = () => {
    fetchPredictions(true);
  };

  const selectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const selectedPrediction = React.useMemo(() => {
    if (!selectedSymbol || !predictions[selectedSymbol]) {
      return null;
    }
    return predictions[selectedSymbol];
  }, [selectedSymbol, predictions]); // 仅当 selectedSymbol 或 predictions 变化时才重新计算

  const symbolList = React.useMemo(() => {
    return Object.keys(predictions);
  }, [predictions]); // 仅当 predictions 变化时才重新计算

  return {
    predictions,
    selectedSymbol,
    loading,
    error,
    selectedPrediction,
    symbolList,
    fetchPredictions,
    refreshPredictions,
    selectSymbol,
  };
};
