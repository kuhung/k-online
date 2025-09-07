import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { AlertCircle } from 'lucide-react';
import { ChartData, CandlestickPoint, DataPoint } from '@/types/chart-data';
import { useIsMobile, getMarketType, formatPrice } from '@/utils';
import * as echarts from 'echarts';

interface CandlestickChartProps {
  chartData: ChartData;
  symbol: string;
  showVolume?: boolean;
  onChartReady?: (chart: any) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  chartData,
  symbol,
  showVolume = true,
  onChartReady
}) => {
  // 检测是否为移动端/小屏幕设备
  const isMobile = useIsMobile();
  
  // 检测市场类型
  const marketType = getMarketType(symbol);

  // 处理数据格式，转换为ECharts K线图格式
  const processedData = useMemo(() => {
    if (!chartData) return null;

    // 处理历史K线数据
    const historicalKline = chartData.historical.price.map((point: CandlestickPoint) => [
      point.timestamp,
      point.open,
      point.close,
      point.low,
      point.high,
      point.volume
    ]);

    // 处理历史成交量数据
    const historicalVolume = chartData.historical.volume.map((point: DataPoint) => [
      point.timestamp,
      point.value
    ]);

    // 处理验证数据（回测模式）
    const validationKline = chartData.validation?.price.map((point: CandlestickPoint) => [
      point.timestamp,
      point.open,
      point.close,
      point.low,
      point.high,
      point.volume
    ]) || [];

    const validationVolume = chartData.validation?.volume.map((point: DataPoint) => [
      point.timestamp,
      point.value
    ]) || [];

    // 处理预测数据
    const predictions = chartData.predictions.price;
    const meanPrediction = predictions.find(s => s.name === 'mean');
    const minPrediction = predictions.find(s => s.name === 'min');
    const maxPrediction = predictions.find(s => s.name === 'max');

    const predictedMean = meanPrediction?.data.map((point: DataPoint) => [
      point.timestamp,
      point.value
    ]) || [];

    const predictedRange = meanPrediction?.data.map((point: DataPoint, index: number) => {
      const minValue = minPrediction?.data[index]?.value || point.value;
      const maxValue = maxPrediction?.data[index]?.value || point.value;
      return [point.timestamp, minValue, maxValue];
    }) || [];

    // 预测成交量
    const volumePredictions = chartData.predictions.volume;
    const meanVolumePrediction = volumePredictions.find(s => s.name === 'mean');
    const predictedVolume = meanVolumePrediction?.data.map((point: DataPoint) => [
      point.timestamp,
      point.value
    ]) || [];

    return {
      historicalKline,
      historicalVolume,
      validationKline,
      validationVolume,
      predictedMean,
      predictedRange,
      predictedVolume,
      lastHistoricalTime: chartData.metadata.lastHistoricalTime,
      isBacktest: chartData.metadata.mode === 'backtest'
    };
  }, [chartData]);

  const option = useMemo(() => {
    if (!processedData) return {};

    const { 
      historicalKline, 
      historicalVolume, 
      validationKline,
      validationVolume,
      predictedMean, 
      predictedRange, 
      predictedVolume,
      lastHistoricalTime,
      isBacktest
    } = processedData;

    // 创建连续的时间轴数据，确保数据连续性
    const allTimes: (string | number)[] = [];
    
    // 添加历史数据时间
    historicalKline.forEach(item => allTimes.push(item[0]));
    
    // 添加预测数据时间（确保连续性）
    predictedMean.forEach(item => {
      if (!allTimes.includes(item[0])) {
        allTimes.push(item[0]);
      }
    });
    
    // 添加验证数据时间（确保连续性）
    validationKline.forEach(item => {
      if (!allTimes.includes(item[0])) {
        allTimes.push(item[0]);
      }
    });
    
    // 按时间排序
    allTimes.sort();

    const option: echarts.EChartsOption = {
      animation: false,
      color: ['#c23531', '#2f4554', '#61a0a8', '#d48265'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        },
        formatter: function (params: any) {
          if (!params || params.length === 0) return '';
          
          // 过滤掉预测范围和边界线的tooltip
          const validParams = params.filter((param: any) => 
            !['预测范围', '预测上限', '预测下限'].includes(param.seriesName)
          );
          
          if (validParams.length === 0) return '';
          
          const data = validParams[0];
          const time = new Date(data.axisValue).toLocaleString('zh-CN');
          
          if (data.seriesName === '历史K线') {
            const values = data.data;
            // ECharts在category类型的xAxis下会在数据前添加dataIndex，需要跳过第一个元素
            const hasDataIndex = values.length > 4;
            const offset = hasDataIndex ? 1 : 0;
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${time}</div>
                <div>开盘: ${formatPrice(values[0 + offset], marketType, symbol)}</div>
                <div>收盘: ${formatPrice(values[1 + offset], marketType, symbol)}</div>
                <div>最低: ${formatPrice(values[2 + offset], marketType, symbol)}</div>
                <div>最高: ${formatPrice(values[3 + offset], marketType, symbol)}</div>
              </div>
            `;
          } else if (data.seriesName === '预测均价') {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${time}</div>
                <div>预测价格: ${formatPrice(data.value[1], marketType, symbol)}</div>
              </div>
            `;
          } else if (data.seriesName.includes('成交量')) {
            const volumeValue = Array.isArray(data.value) ? data.value[1] : data.value;
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${time}</div>
                <div>成交量: ${volumeValue?.toLocaleString()}</div>
              </div>
            `;
          }
          
          return '';
        }
      },
      legend: {
        data: isBacktest 
          ? ['历史K线', '预测均价', '预测范围', '历史成交量', '预测成交量'] 
          : ['历史K线', '预测均价', '预测范围', '历史成交量', '预测成交量'],
        top: 10,
        selected: {
          '预测上限': false,
          '预测下限': false
        },
        // 移动端简化图例显示
        show: !isMobile,
        ...(isMobile && {
          show: true,
          itemWidth: 20,
          itemHeight: 12,
          textStyle: {
            fontSize: 12
          }
        })
      },
      grid: [
        {
          left: isMobile ? '10px' : '80px',
          right: '4%',
          top: showVolume ? (isMobile ? '8%' : '12%') : (isMobile ? '10%' : '15%'),
          height: showVolume ? '55%' : '70%'
        },
        ...(showVolume ? [{
          left: isMobile ? '10px' : '80px',
          right: '4%',
          top: '75%',
          height: '20%'
        }] : [])
      ],
      xAxis: [
        {
          type: 'category',
          data: allTimes,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
          axisPointer: {
            z: 100
          }
        },
        ...(showVolume ? [{
          type: 'category' as const,
          gridIndex: 1,
          data: allTimes,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin' as const,
          max: 'dataMax' as const
        }] : [])
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          },
          // 移动端隐藏Y轴标签
          axisLabel: { 
            show: !isMobile,
            ...(isMobile && { show: false })
          },
          axisTick: { show: !isMobile },
          axisLine: { show: !isMobile }
        },
        ...(showVolume ? [{
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }] : [])
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: showVolume ? [0, 1] : [0],
          start: 70,
          end: 100
        },
        {
          show: !isMobile, // 移动端隐藏滑块
          xAxisIndex: showVolume ? [0, 1] : [0],
          type: 'slider',
          top: showVolume ? '95%' : '85%',
          start: 70,
          end: 100,
          height: isMobile ? 20 : 30 // 移动端减小高度
        }
      ],
      series: [
        // 历史K线（包含验证数据）
        {
          name: '历史K线',
          type: 'candlestick' as const,
          data: allTimes.map(time => {
            // 优先查找历史数据，如果没有则查找验证数据
            let klineItem = historicalKline.find(item => item[0] === time);
            if (!klineItem && isBacktest) {
              klineItem = validationKline.find(item => item[0] === time);
            }
            return klineItem ? [klineItem[1], klineItem[2], klineItem[3], klineItem[4]] : null;
          }).filter(item => item !== null),
          itemStyle: {
            color: '#ec0000',
            color0: '#00da3c',
            borderColor: '#8A0000',
            borderColor0: '#008F28'
          },
          markLine: {
            symbol: ['none', 'none'],
            data: [
              {
                name: '预测开始',
                xAxis: lastHistoricalTime,
                lineStyle: {
                  color: '#ff4444',
                  type: 'dashed',
                  width: 2
                },
                label: {
                  show: true,
                  position: 'middle',
                  formatter: '预测开始',
                  color: '#ff4444'
                }
              }
            ]
          }
        },
        // 预测均价线
        {
          name: '预测均价',
          type: 'line' as const,
          data: allTimes.map(time => {
            const predItem = predictedMean.find(item => item[0] === time);
            return predItem ? [predItem[0], predItem[1]] : null;
          }).filter(item => item !== null),
          smooth: true,
          lineStyle: {
            color: '#ff7300',
            width: 2,
            type: 'dashed'
          },
          showSymbol: false
        },
        // 预测范围（使用上下边界数据创建区域）
        {
          name: '预测范围',
          type: 'line' as const,
          // 创建区域数据：先绘制上限，再反向绘制下限
          data: [
            ...predictedRange.map(item => [item[0], item[2]]), // 上限
            ...predictedRange.slice().reverse().map(item => [item[0], item[1]]) // 下限（反向）
          ],
          lineStyle: {
            color: 'transparent' // 隐藏边界线
          },
          showSymbol: false,
          areaStyle: {
            color: 'rgba(255, 115, 0, 0.15)'
          },
          tooltip: {
            show: false // 不显示区域的tooltip
          }
        },
        // 预测范围上下限边界线（不显示在图例中）
        {
          name: '预测上限',
          type: 'line' as const,
          data: predictedRange.map(item => [item[0], item[2]]),
          lineStyle: {
            color: '#ff7300',
            width: 1,
            opacity: 0.5,
            type: 'dotted'
          },
          showSymbol: false
        },
        {
          name: '预测下限',
          type: 'line' as const,
          data: predictedRange.map(item => [item[0], item[1]]),
          lineStyle: {
            color: '#ff7300',
            width: 1,
            opacity: 0.5,
            type: 'dotted'
          },
          showSymbol: false
        },
        // 历史成交量（包含验证数据）
        ...(showVolume ? [{
          name: '历史成交量',
          type: 'bar' as const,
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: allTimes.map((time) => {
            // 优先查找历史数据，如果没有则查找验证数据
            let volumeItem = historicalVolume.find(item => item[0] === time);
            if (!volumeItem && isBacktest) {
              volumeItem = validationVolume.find(item => item[0] === time);
            }
            return volumeItem ? volumeItem[1] : 0;
          }),
          itemStyle: {
            color: function(params: any) {
              const time = allTimes[params.dataIndex];
              // 优先查找历史K线数据，如果没有则查找验证K线数据
              let klineData = historicalKline.find(item => item[0] === time);
              if (!klineData && isBacktest) {
                klineData = validationKline.find(item => item[0] === time);
              }
              return klineData && klineData[2] > klineData[1] ? '#ec0000' : '#00da3c';
            }
          }
        }] : []),
        // 预测成交量
        ...(showVolume ? [{
          name: '预测成交量',
          type: 'bar' as const,
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: allTimes.map(time => {
            const volumeItem = predictedVolume.find(item => item[0] === time);
            return volumeItem ? volumeItem[1] : 0;
          }),
          itemStyle: {
            color: 'rgba(255, 115, 0, 0.7)'
          }
        }] : []),
      ]
    };

    return option;
  }, [processedData, showVolume, symbol]);

  if (!chartData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p>暂无图表数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <ReactECharts
          option={option}
          style={{ 
            height: isMobile ? 
              (showVolume ? '400px' : '300px') : 
              (showVolume ? '650px' : '500px'), 
            width: '100%' 
          }}
          opts={{ renderer: 'canvas' }}
          onChartReady={onChartReady}
        />
      </div>
      
      <div className={`text-sm text-gray-500 text-center space-y-1 ${isMobile ? 'text-xs' : ''}`}>
        {!isMobile && <p>* 红色K线表示上涨，绿色K线表示下跌</p>}
        <p>* 虚线为{processedData?.isBacktest ? '回测' : '预测'}数据{!isMobile ? '，阴影区域为预测范围' : ''}</p>
        {processedData?.isBacktest && <p>* 分割线后为预测数据对比实际结果</p>}
        <p>* 数据&模型: {chartData.metadata.dataSource}</p>
      </div>
    </div>
  );
};
