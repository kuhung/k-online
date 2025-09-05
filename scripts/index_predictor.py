#!/usr/bin/env python3
"""
A股指数市场预测器
"""
from datetime import datetime, timedelta
import pandas as pd
from typing import Tuple
from market_predictor import MarketPredictor

class IndexPredictor(MarketPredictor):
    """A股指数市场预测器"""
    
    INTERVAL_MAPPING = {
        '1': 1/60,    # 1分钟
        '5': 5/60,    # 5分钟
        '15': 15/60,  # 15分钟
        '30': 30/60,  # 30分钟
        '60': 1       # 1小时
    }
    
    def __init__(self, model_path: str, interval: str = '60'):
        super().__init__(model_path, interval)
        self.interval_hours = self.INTERVAL_MAPPING[interval]
    
    def get_prediction_horizon(self) -> int:
        """获取预测周期"""
        base_horizon = 24  # 基础预测周期（小时）
        return max(1, int(base_horizon / self.interval_hours))
    
    def get_vol_window(self) -> int:
        """获取波动率窗口大小"""
        return 24  # 使用24个数据点作为波动率计算窗口
    
    def get_hist_points(self) -> int:
        """获取历史数据点数"""
        return 360  # 使用360个数据点作为历史数据
    
    def get_market_hours(self) -> Tuple[datetime, datetime]:
        """获取市场交易时间（A股市场交易时间：9:30-11:30, 13:00-15:00）"""
        now = datetime.now()
        morning_start = now.replace(hour=9, minute=30, second=0, microsecond=0)
        morning_end = now.replace(hour=11, minute=30, second=0, microsecond=0)
        afternoon_start = now.replace(hour=13, minute=0, second=0, microsecond=0)
        afternoon_end = now.replace(hour=15, minute=0, second=0, microsecond=0)
        
        return (
            morning_start,
            afternoon_end
        )
    
    def _generate_prediction_timestamps(self, last_timestamp: datetime) -> pd.DatetimeIndex:
        """生成预测时间序列，考虑A股市场交易时间"""
        start_new_range = last_timestamp + pd.Timedelta(minutes=int(self.interval))
        
        # 生成时间序列
        timestamps = []
        current_time = start_new_range
        remaining_periods = self.get_prediction_horizon()
        
        while remaining_periods > 0:
            # 检查是否在交易时间内
            hour = current_time.hour
            minute = current_time.minute
            
            # 跳过非交易时间
            if (hour < 9 or (hour == 9 and minute < 30)) or \
               (hour == 11 and minute >= 30) or \
               (hour == 12) or \
               (hour >= 15):
                if hour >= 15:  # 如果超过收盘时间，跳到下一个交易日
                    current_time = current_time.replace(
                        hour=9, minute=30
                    ) + timedelta(days=1)
                elif hour == 11 and minute >= 30:  # 如果是午休时间
                    current_time = current_time.replace(hour=13, minute=0)
                else:  # 其他情况，前进到开盘时间
                    current_time = current_time.replace(hour=9, minute=30)
                continue
            
            timestamps.append(current_time)
            current_time += pd.Timedelta(minutes=int(self.interval))
            remaining_periods -= 1
        
        return pd.DatetimeIndex(timestamps)
    
    def get_market_type(self) -> str:
        """获取市场类型"""
        return "index"
    
    def get_data_source(self) -> str:
        """获取数据来源"""
        return "AkShare + Kronos"
    
    def get_interval_display_name(self) -> str:
        """获取时间间隔显示名称"""
        interval_map = {
            '60': '1h',
            '1': '1min',
            '5': '5min',
            '15': '15min',
            '30': '30min'
        }
        return interval_map.get(self.interval, self.interval)
