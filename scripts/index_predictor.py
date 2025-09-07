#!/usr/bin/env python3
"""
A股指数市场预测器
"""
from datetime import datetime, timedelta
import pandas as pd
from typing import Tuple
import logging
from market_predictor import MarketPredictor

logger = logging.getLogger(__name__)

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
        """获取预测周期
        对于A股市场，一个交易日包含4小时交易时间（上午9:30-11:30，下午13:00-15:00）
        """
        trading_hours = 4  # A股市场一天交易4小时
        points_per_hour = int(60 / int(self.interval))  # 每小时的数据点数
        return trading_hours * points_per_hour  # 返回一个交易日所需的数据点数
    
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
            # 检查是否在工作日
            if current_time.weekday() >= 5:  # 周六(5)和周日(6)
                # 跳到下一个周一
                days_ahead = 7 - current_time.weekday()
                current_time = current_time.replace(hour=9, minute=30) + timedelta(days=days_ahead)
                continue
                
            # 检查是否在交易时间内
            hour = current_time.hour
            minute = current_time.minute
            
            # 跳过非交易时间
            if (hour < 9 or (hour == 9 and minute < 30)) or \
               (hour == 11 and minute >= 30) or \
               (hour == 12) or \
               (hour >= 15):
                if hour >= 15:  # 如果超过收盘时间，跳到下一个交易日
                    next_day = current_time + timedelta(days=1)
                    current_time = next_day.replace(hour=9, minute=30)
                elif hour == 11 and minute >= 30:  # 如果是午休时间
                    current_time = current_time.replace(hour=13, minute=0)
                else:  # 其他情况，前进到开盘时间
                    current_time = current_time.replace(hour=9, minute=30)
                continue
            
            timestamps.append(current_time)
            current_time += pd.Timedelta(minutes=int(self.interval))
            remaining_periods -= 1
        
        return pd.DatetimeIndex(timestamps)
    
    def _filter_trading_hours(self, df: pd.DataFrame) -> pd.DataFrame:
        """过滤数据，仅保留A股交易时间的数据
        
        对于历史数据预测，我们需要保留所有有效的交易时间数据，
        而不是基于当前时间来过滤
        """
        if df.empty:
            return df
            
        df = df.copy()
        
        # 确保timestamps列是datetime类型
        if 'timestamps' not in df.columns:
            raise ValueError("数据框必须包含'timestamps'列")
        
        df['timestamps'] = pd.to_datetime(df['timestamps'])
        
        # 提取时间信息
        df['hour'] = df['timestamps'].dt.hour
        df['minute'] = df['timestamps'].dt.minute
        df['weekday'] = df['timestamps'].dt.weekday  # 0=Monday, 6=Sunday
        
        # 定义交易时间条件
        # A股交易时间：周一到周五 9:30-11:30, 13:00-15:00
        trading_hours_condition = (
            # 工作日（周一到周五）
            (df['weekday'] < 5) &
            # 交易时间段
            (
                # 上午：9:30-11:30
                ((df['hour'] == 9) & (df['minute'] >= 30)) |
                (df['hour'] == 10) |
                ((df['hour'] == 11) & (df['minute'] <= 30)) |
                # 下午：13:00-15:00
                (df['hour'] == 13) |
                (df['hour'] == 14) |
                ((df['hour'] == 15) & (df['minute'] == 0))
            )
        )
        
        # 应用过滤条件
        filtered_df = df[trading_hours_condition].copy()
        
        # 删除临时列
        filtered_df = filtered_df.drop(['hour', 'minute', 'weekday'], axis=1)
        
        # 如果过滤后数据为空，但原始数据不为空，说明可能是时间范围问题
        # 在这种情况下，我们提供更详细的日志信息
        if len(filtered_df) == 0 and len(df) > 0:
            logger.warning(f"交易时间过滤后无数据！原始数据时间范围: {df['timestamps'].min()} 到 {df['timestamps'].max()}")
            logger.warning("这可能是因为数据时间不在交易时间范围内，或者是非交易日的数据")
            
            # 对于指数预测，如果是历史数据分析，我们可以放宽限制
            # 检查数据是否都是历史数据（比当前时间早）
            current_time = pd.Timestamp.now()
            if df['timestamps'].max() < current_time - pd.Timedelta(days=1):
                logger.info("检测到历史数据分析模式，返回所有工作日数据")
                # 只过滤工作日，不过滤具体时间
                weekday_condition = df['weekday'] < 5
                filtered_df = df[weekday_condition].copy()
                filtered_df = filtered_df.drop(['hour', 'minute', 'weekday'], axis=1)
        
        if len(filtered_df) != len(df):
            logger.info(f"交易时间过滤：从 {len(df)} 条数据过滤到 {len(filtered_df)} 条数据")
        
        return filtered_df
    
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
    
    def get_validation_window(self) -> int:
        """获取回测验证窗口大小（预留1个交易日的数据）"""
        # A股市场一天交易4小时
        trading_hours = 4
        points_per_hour = int(60 / int(self.interval))
        return trading_hours * points_per_hour