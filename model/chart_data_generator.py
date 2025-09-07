#!/usr/bin/env python3
"""
图表数据生成器 - 替代matplotlib预渲染的图片，输出前端可渲染的结构化数据（回测模式）
"""
from datetime import datetime, timezone
from typing import Dict, Any, List
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

class ChartDataGenerator:
    """生成前端图表渲染所需的结构化数据"""
    
    def __init__(self, interval: str):
        self.interval = interval
    
    def generate_chart_data(
        self,
        hist_df: pd.DataFrame,
        close_preds_df: pd.DataFrame,
        volume_preds_df: pd.DataFrame,
        symbol: str,
        last_timestamp: datetime,
        prediction_horizon: int,
        data_source: str,
        prediction_timestamps: pd.DatetimeIndex = None,
        validation_df: pd.DataFrame = None
    ) -> Dict[str, Any]:
        """
        生成图表数据结构（回测模式）
        
        Args:
            hist_df: 历史数据DataFrame（用于训练预测模型的数据）
            close_preds_df: 价格预测DataFrame（每列是一个样本）
            volume_preds_df: 成交量预测DataFrame（每列是一个样本）
            symbol: 标的符号
            last_timestamp: 最后一个历史数据时间点
            prediction_horizon: 预测周期
            data_source: 数据源
            prediction_timestamps: 预测时间戳索引
            validation_df: 实际验证数据DataFrame（预留的真实历史数据用于验证）
            
        Returns:
            包含图表数据的字典
        """
        try:
            logger.info(f"为 {symbol} 生成图表数据...")
            
            # 生成历史数据
            historical_data = self._generate_historical_data(hist_df)
            
            # 生成预测数据
            prediction_data = self._generate_prediction_data(
                close_preds_df, 
                volume_preds_df,
                last_timestamp,
                prediction_horizon,
                prediction_timestamps
            )
            
            # 生成验证数据（实际的历史数据用于对比）
            validation_data = None
            if validation_df is not None:
                validation_data = self._generate_validation_data(validation_df)
            
            # 构建完整的图表数据结构
            chart_data = {
                "historical": historical_data,
                "predictions": prediction_data,
                "validation": validation_data,
                "metadata": {
                    "symbol": symbol,
                    "interval": self.interval,
                    "lastHistoricalTime": last_timestamp.isoformat(),
                    "predictionHorizon": prediction_horizon,
                    "dataSource": data_source,
                    "mode": "backtest"  # 标识为回测模式
                }
            }
            
            logger.info(f"图表数据生成成功，包含 {len(historical_data['price'])} 个历史数据点")
            return chart_data
            
        except Exception as e:
            logger.error(f"生成图表数据时出错: {e}")
            return None
    
    def _generate_historical_data(self, hist_df: pd.DataFrame) -> Dict[str, Any]:
        """生成历史数据部分"""
        price_data = []
        volume_data = []
        
        for _, row in hist_df.iterrows():
            timestamp = row['timestamps'].isoformat()
            
            # K线数据
            price_data.append({
                "timestamp": timestamp,
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": float(row['volume'])
            })
            
            # 成交量数据（单独序列用于成交量图表）
            volume_data.append({
                "timestamp": timestamp,
                "value": float(row['volume'])
            })
        
        return {
            "price": price_data,
            "volume": volume_data
        }
    
    def _generate_prediction_data(
        self,
        close_preds_df: pd.DataFrame,
        volume_preds_df: pd.DataFrame,
        last_timestamp: datetime,
        prediction_horizon: int,
        prediction_timestamps: pd.DatetimeIndex = None
    ) -> Dict[str, Any]:
        """生成预测数据部分"""
        # 使用传入的预测时间戳或生成新的
        if prediction_timestamps is not None:
            pred_timestamps = [ts.isoformat() for ts in prediction_timestamps]
        else:
            pred_timestamps = self._generate_prediction_timestamps(
                last_timestamp, 
                prediction_horizon
            )
        
        # 价格预测系列
        price_series = self._generate_price_prediction_series(
            close_preds_df, 
            pred_timestamps
        )
        
        # 成交量预测系列
        volume_series = self._generate_volume_prediction_series(
            volume_preds_df, 
            pred_timestamps
        )
        
        return {
            "price": price_series,
            "volume": volume_series
        }
    
    def _generate_prediction_timestamps(
        self,
        last_timestamp: datetime,
        prediction_horizon: int
    ) -> List[str]:
        """生成预测时间戳序列，确保从下一个时间点开始"""
        timestamps = []
        
        # 解析间隔
        if self.interval.endswith('h'):
            hours = int(self.interval[:-1])
            delta = pd.Timedelta(hours=hours)
        elif self.interval.endswith('min'):
            minutes = int(self.interval[:-3])
            delta = pd.Timedelta(minutes=minutes)
        elif self.interval.isdigit():
            # A股指数格式（分钟）
            minutes = int(self.interval)
            delta = pd.Timedelta(minutes=minutes)
        else:
            # 默认1小时
            delta = pd.Timedelta(hours=1)
        
        # 从最后一个历史数据点的下一个时间点开始
        current = last_timestamp
        for i in range(prediction_horizon):
            current = current + delta
            timestamps.append(current.isoformat())
        
        return timestamps
    
    def _generate_price_prediction_series(
        self,
        close_preds_df: pd.DataFrame,
        timestamps: List[str]
    ) -> List[Dict[str, Any]]:
        """生成价格预测系列"""
        series = []
        
        # 平均预测
        mean_data = []
        min_data = []
        max_data = []
        
        for i, timestamp in enumerate(timestamps):
            if i < len(close_preds_df):
                row_values = close_preds_df.iloc[i].values
                mean_data.append({
                    "timestamp": timestamp,
                    "value": float(np.mean(row_values))
                })
                min_data.append({
                    "timestamp": timestamp,
                    "value": float(np.min(row_values))
                })
                max_data.append({
                    "timestamp": timestamp,
                    "value": float(np.max(row_values))
                })
        
        series.extend([
            {
                "name": "mean",
                "data": mean_data,
                "color": "#ff7300",
                "strokeWidth": 2
            },
            {
                "name": "min",
                "data": min_data,
                "color": "#ff7300",
                "strokeWidth": 1
            },
            {
                "name": "max",
                "data": max_data,
                "color": "#ff7300", 
                "strokeWidth": 1
            }
        ])
        
        return series
    
    def _generate_volume_prediction_series(
        self,
        volume_preds_df: pd.DataFrame,
        timestamps: List[str]
    ) -> List[Dict[str, Any]]:
        """生成成交量预测系列"""
        series = []
        
        # 平均预测成交量
        mean_data = []
        
        for i, timestamp in enumerate(timestamps):
            if i < len(volume_preds_df):
                row_values = volume_preds_df.iloc[i].values
                mean_data.append({
                    "timestamp": timestamp,
                    "value": float(np.mean(row_values))
                })
        
        series.append({
            "name": "mean",
            "data": mean_data,
            "color": "#ffa500",
            "strokeWidth": 2
        })
        
        return series
    
    def _generate_validation_data(self, validation_df: pd.DataFrame) -> Dict[str, Any]:
        """生成验证数据部分（实际的历史数据用于对比预测准确性）"""
        price_data = []
        volume_data = []
        
        for _, row in validation_df.iterrows():
            timestamp = row['timestamps'].isoformat()
            
            # K线数据
            price_data.append({
                "timestamp": timestamp,
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": float(row['volume'])
            })
            
            # 成交量数据
            volume_data.append({
                "timestamp": timestamp,
                "value": float(row['volume'])
            })
        
        return {
            "price": price_data,
            "volume": volume_data
        }
