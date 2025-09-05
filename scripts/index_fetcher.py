#!/usr/bin/env python3
"""
A股指数数据获取实现
"""
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pandas as pd
from typing import Optional, List
import akshare as ak
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from data_fetcher import DataFetcher

logger = logging.getLogger(__name__)

class IndexDataFetcher(DataFetcher):
    """A股指数数据获取类"""
    
    SYMBOL_NAMES = {
        '000001': '上证指数',
        '399001': '深证成指',
        '399006': '创业板指',
    }
    
    SUPPORTED_SYMBOLS = list(SYMBOL_NAMES.keys())
    
    INTERVAL_MAPPING = {
        '1': '1min',
        '5': '5min',
        '15': '15min',
        '30': '30min',
        '60': '1h'
    }
    
    def __init__(self, data_dir: Path, interval: str = '60'):
        super().__init__(data_dir, interval)
    
    def get_interval_display_name(self) -> str:
        """获取时间间隔的显示名称"""
        interval_map = {
            '60': '1h',
            '1': '1min',
            '5': '5min',
            '15': '15min',
            '30': '30min'
        }
        return interval_map.get(self.interval, self.interval)
    
    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=1, max=10))
    def fetch_data(self, symbol: str, start_time: Optional[datetime] = None) -> Optional[pd.DataFrame]:
        """从AkShare获取A股指数K线数据"""
        try:
            # 确定查询的开始和结束时间
            if start_time:
                # 增量获取，从本地最新时间戳之后开始
                start_date_str = (start_time + timedelta(minutes=int(self.interval))).strftime("%Y-%m-%d %H:%M:%S")
                end_date_str = datetime.now(timezone.utc).astimezone(None).strftime("%Y-%m-%d %H:%M:%S")
            else:
                # 首次获取，获取最近一年的数据
                one_year_ago = datetime.now() - timedelta(days=365)
                start_date_str = one_year_ago.strftime("%Y-%m-%d %H:%M:%S")
                end_date_str = datetime.now(timezone.utc).astimezone(None).strftime("%Y-%m-%d %H:%M:%S")
            
            logger.info(f"正在获取 {self.get_symbol_name(symbol)} ({symbol}) {self.interval}分钟数据...")
            
            df = ak.index_zh_a_hist_min_em(
                symbol=symbol,
                period=self.interval,
                start_date=start_date_str,
                end_date=end_date_str
            )
            
            if df.empty:
                logger.info("没有新数据需要获取")
                return None
            
            # 重命名列并只保留需要的列
            df.rename(columns={
                '时间': 'timestamps',
                '开盘': 'open',
                '收盘': 'close',
                '最高': 'high',
                '最低': 'low',
                '成交量': 'volume',
                '成交额': 'amount'
            }, inplace=True)
            
            # 只保留需要的列
            df = df[['timestamps', 'open', 'high', 'low', 'close', 'volume', 'amount']]
            
            # 转换数据类型
            df['timestamps'] = pd.to_datetime(df['timestamps'])
            for col in ['open', 'high', 'low', 'close', 'volume', 'amount']:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            logger.info(f"成功获取 {len(df)} 条数据")
            return df
            
        except Exception as e:
            logger.error(f"获取数据失败: {e}")
            return None
    
    def get_all_symbols(self) -> List[str]:
        """获取所有支持的指数代码"""
        return self.SUPPORTED_SYMBOLS
    
    def get_symbol_name(self, symbol: str) -> str:
        """获取指数的显示名称"""
        return self.SYMBOL_NAMES.get(symbol, symbol)
    
    def get_market_type(self) -> str:
        """获取市场类型"""
        return "index"
