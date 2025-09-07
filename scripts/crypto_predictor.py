#!/usr/bin/env python3
"""
加密货币市场预测器
"""
from datetime import datetime, timedelta
import pytz
import pandas as pd
from typing import Tuple
from market_predictor import MarketPredictor

class CryptoPredictor(MarketPredictor):
    """加密货币市场预测器"""
    
    INTERVAL_MAPPING = {
        '1m': 1/60, '3m': 3/60, '5m': 5/60, '15m': 15/60, '30m': 30/60,
        '1h': 1, '2h': 2, '4h': 4, '6h': 6, '8h': 8, '12h': 12,
        '1d': 24, '3d': 72, '1w': 168, '1M': 720  # 假设一个月平均30天
    }
    
    def __init__(self, model_path: str, interval: str = '1d'):
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
        return 300  # 使用300个数据点作为历史数据
    
    def get_market_hours(self) -> Tuple[datetime, datetime]:
        """获取市场交易时间（加密货币市场24小时交易）"""
        now = datetime.now()
        return (
            now.replace(hour=0, minute=0, second=0, microsecond=0),
            now.replace(hour=23, minute=59, second=59, microsecond=999999)
        )
    
    def _generate_prediction_timestamps(self, last_timestamp: datetime) -> pd.DatetimeIndex:
        """生成预测时间序列"""
        start_new_range = last_timestamp + pd.Timedelta(hours=self.interval_hours)
        
        if self.interval_hours < 1:  # 分钟级别
            freq_value = int(self.interval_hours * 60)
            freq = f'{freq_value}min'
        elif self.interval_hours >= 24:  # 天及以上级别
            freq_map = {24: 'D', 72: '3D', 168: 'W', 720: 'M'}
            freq = freq_map.get(self.interval_hours, 'D')
        else:  # 小时级别
            freq = f'{int(self.interval_hours)}h'
        
        # 生成时间序列，确保使用 UTC+8 时区
        timestamps = pd.date_range(
            start=start_new_range,
            periods=self.get_prediction_horizon(),
            freq=freq
        )
        
        # 确保时间戳没有时区信息（已经是 UTC+8 本地时间）
        return timestamps.tz_localize(None) if timestamps.tz is not None else timestamps
    
    def _filter_trading_hours(self, df: pd.DataFrame) -> pd.DataFrame:
        """过滤数据，加密货币市场24小时交易，不需要过滤"""
        return df  # 加密货币市场24小时交易，返回所有数据
    
    def get_market_type(self) -> str:
        """获取市场类型"""
        return "crypto"
    
    def get_data_source(self) -> str:
        """获取数据来源"""
        return "Binance + Kronos"
    
    def get_interval_display_name(self) -> str:
        """获取时间间隔显示名称"""
        return self.interval
    
    def get_validation_window(self) -> int:
        """获取回测验证窗口大小（预留24小时的数据）"""
        return max(1, int(24 / self.interval_hours))