#!/usr/bin/env python3
"""
加密货币数据获取实现
"""
from datetime import datetime, timezone, timedelta
import pytz
from pathlib import Path
import pandas as pd
from typing import Optional, List
from binance.client import Client
import time
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from data_fetcher import DataFetcher

logger = logging.getLogger(__name__)

class CryptoDataFetcher(DataFetcher):
    """加密货币数据获取类"""
    
    SYMBOL_NAMES = {
        'BTCUSDT': '比特币 / USDT',
        'ETHUSDT': '以太坊 / USDT',
        'SOLUSDT': 'Solana / USDT',
        'XRPUSDT': '瑞波币 / USDT',
        'DOGEUSDT': '狗狗币 / USDT',
        'V2EXUSDT': 'V2EX / USDT',
    }
    
    SUPPORTED_SYMBOLS = list(SYMBOL_NAMES.keys())
    
    INTERVAL_MAPPING = {
        '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
        '1h': '1h', '2h': '2h', '4h': '4h', '6h': '6h', '8h': '8h', '12h': '12h',
        '1d': '1d', '3d': '3d', '1w': '1w', '1M': '1M'
    }
    
    def __init__(self, data_dir: Path, interval: str = '1h', hist_points: int = 1000):
        super().__init__(data_dir, interval)
        self.hist_points = hist_points
        self._client = None  # 延迟初始化
        
    @property
    def client(self):
        """延迟初始化 Binance Client"""
        if self._client is None:
            self._client = Client()  # 使用 Binance 国际版 API
        return self._client
    
    def get_interval_display_name(self) -> str:
        """获取时间间隔的显示名称"""
        return self.interval
    
    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=1, max=10))
    def fetch_data(self, symbol: str, start_time: Optional[datetime] = None) -> Optional[pd.DataFrame]:
        """从Binance获取K线数据"""
        try:
            limit = self.hist_points if start_time is None else 1000
            logger.info(f"正在获取 {symbol} {self.interval} 数据...")
            
            klines = []
            if start_time:
                # 增量获取数据
                current_start = int(start_time.timestamp() * 1000)
                while True:
                    batch = self.client.get_klines(
                        symbol=symbol,
                        interval=self.interval,
                        startTime=current_start,
                        limit=1000
                    )
                    if not batch:
                        break
                    klines.extend(batch)
                    current_start = batch[-1][0] + 1
                    if len(batch) < 1000:
                        break
                    time.sleep(0.1)  # 避免触发频率限制
            else:
                # 首次获取数据
                klines = self.client.get_klines(
                    symbol=symbol,
                    interval=self.interval,
                    limit=limit
                )
            
            if not klines:
                logger.info(f"没有新数据需要获取")
                return None
            
            # 处理数据
            cols = ['open_time', 'open', 'high', 'low', 'close', 'volume', 'close_time',
                   'quote_asset_volume', 'number_of_trades', 'taker_buy_base_asset_volume',
                   'taker_buy_quote_asset_volume', 'ignore']
            df = pd.DataFrame(klines, columns=cols)
            
            # 选择和重命名列
            df = df[['open_time', 'open', 'high', 'low', 'close', 'volume', 'quote_asset_volume']]
            df.rename(columns={'quote_asset_volume': 'amount', 'open_time': 'timestamps'}, inplace=True)
            
            # 转换数据类型和时区
            df['timestamps'] = pd.to_datetime(df['timestamps'], unit='ms', utc=True)
            # 转换为 UTC+8 时区
            china_tz = pytz.timezone('Asia/Shanghai')
            df['timestamps'] = df['timestamps'].dt.tz_convert(china_tz).dt.tz_localize(None)
            for col in ['open', 'high', 'low', 'close', 'volume', 'amount']:
                df[col] = pd.to_numeric(df[col])
            
            logger.info(f"成功获取 {len(df)} 条数据")
            return df
            
        except Exception as e:
            logger.error(f"获取数据失败: {e}")
            return None
    
    def get_all_symbols(self) -> List[str]:
        """获取所有支持的交易对"""
        return self.SUPPORTED_SYMBOLS
    
    def get_symbol_name(self, symbol: str) -> str:
        """获取交易对的显示名称"""
        return self.SYMBOL_NAMES.get(symbol, symbol)
    
    def get_market_type(self) -> str:
        """获取市场类型"""
        return "crypto"
