#!/usr/bin/env python3
"""
加密货币数据获取实现
"""
from datetime import datetime, timezone, timedelta
import pytz
from pathlib import Path
import pandas as pd
from typing import Optional, List
import os
from binance.client import Client
import time
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
import yfinance as yf
from binance.exceptions import BinanceAPIException

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
        # 'V2EXUSDT': 'V2EX / USDT', # 暂时注释，Binance US 可能不支持
    }
    
    # 映射 Binance Symbol 到 Yahoo Finance Ticker
    YFINANCE_MAPPING = {
        'BTCUSDT': 'BTC-USD',
        'ETHUSDT': 'ETH-USD',
        'SOLUSDT': 'SOL-USD',
        'XRPUSDT': 'XRP-USD',
        'DOGEUSDT': 'DOGE-USD',
    }

    SUPPORTED_SYMBOLS = list(SYMBOL_NAMES.keys())
    
    INTERVAL_MAPPING = {
        '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
        '1h': '1h', '2h': '2h', '4h': '4h', '6h': '6h', '8h': '8h', '12h': '12h',
        '1d': '1d', '3d': '3d', '1w': '1w', '1M': '1M'
    }
    
    YFINANCE_INTERVAL_MAPPING = {
        '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
        '1h': '1h', '1d': '1d', '1w': '1wk', '1M': '1mo'
    }

    def __init__(self, data_dir: Path, interval: str = '1h', hist_points: int = 1000):
        super().__init__(data_dir, interval)
        self.hist_points = hist_points
        self._client = None  # 延迟初始化
        
    @property
    def client(self):
        """延迟初始化 Binance Client"""
        if self._client is None:
            # 支持通过环境变量配置 TLD (例如 'us') 和代理
            tld = os.environ.get('BINANCE_TLD') or 'com'
            
            # 检查代理设置
            proxies = None
            if os.environ.get('HTTP_PROXY') or os.environ.get('HTTPS_PROXY'):
                proxies = {
                    'http': os.environ.get('HTTP_PROXY'),
                    'https': os.environ.get('HTTPS_PROXY')
                }
                logger.info(f"使用代理配置: {proxies}")
            
            logger.info(f"初始化 Binance Client, TLD: {tld}")
            self._client = Client(tld=tld, requests_params={'proxies': proxies} if proxies else None)
        return self._client
    
    def get_interval_display_name(self) -> str:
        """获取时间间隔的显示名称"""
        return self.interval

    def _fetch_from_yfinance(self, symbol: str, start_time: Optional[datetime] = None) -> Optional[pd.DataFrame]:
        """从 Yahoo Finance 获取数据作为备用"""
        ticker = self.YFINANCE_MAPPING.get(symbol)
        if not ticker:
            logger.warning(f"Yahoo Finance 不支持 {symbol}，跳过备用获取")
            return None
            
        yf_interval = self.YFINANCE_INTERVAL_MAPPING.get(self.interval)
        if not yf_interval:
            logger.warning(f"Yahoo Finance 不支持时间间隔 {self.interval}，跳过备用获取")
            return None

        logger.info(f"尝试从 Yahoo Finance 获取 {ticker} ({symbol}) 数据...")
        try:
            # 计算合适的 period
            if start_time:
                # 如果有开始时间，计算到现在的时间差
                # yfinance 的 period 参数比较灵活，但 download 方法支持 start/end
                # 注意：yfinance 的 start/end 是日期字符串或 datetime
                # 为了简单起见，如果请求的是最近的数据，我们使用 period
                # 如果是增量更新，可能比较复杂，这里简化为获取最近一段数据
                # 实际上，为了保持一致性，我们尝试获取足够长的数据
                pass
            
            # 简化策略：获取最近的数据。如果 interval 是分钟级，最大只能获取最近 60 天（1m）或 730 天（1h）
            # 根据 hist_points 估算需要的 period
            period = "2y" # 默认获取较长时间
            if self.interval in ['1m', '5m', '15m', '30m']:
                period = "1mo" # 分钟级数据限制较多
            elif self.interval == '1h':
                period = "730d" # 1h 数据最多约 2 年
            
            # 使用 yf.download
            # 注意：auto_adjust=True 会调整 OHLC，我们通常需要原始数据，但加密货币通常没有分红拆股
            # 保持默认 auto_adjust=False
            df = yf.download(ticker, period=period, interval=yf_interval, progress=False, multi_level_index=False)
            
            if df.empty:
                logger.warning(f"Yahoo Finance 返回空数据: {ticker}")
                return None
                
            # 重置索引，将 Date/Datetime 变为列
            df.reset_index(inplace=True)
            
            # 统一列名
            # yfinance 列名通常是: Date (or Datetime), Open, High, Low, Close, Adj Close, Volume
            # 我们需要: timestamps, open, high, low, close, volume, amount
            
            # 查找时间列
            time_col = 'Date' if 'Date' in df.columns else 'Datetime'
            if time_col not in df.columns:
                 # 可能是索引名没被 reset 出来或者名字不对
                 if isinstance(df.index, pd.DatetimeIndex):
                     df['timestamps'] = df.index
                 else:
                     logger.error(f"无法识别 Yahoo Finance 时间列: {df.columns}")
                     return None
            else:
                df.rename(columns={time_col: 'timestamps'}, inplace=True)

            df.rename(columns={
                'Open': 'open', 'High': 'high', 'Low': 'low', 
                'Close': 'close', 'Volume': 'volume'
            }, inplace=True)
            
            # 计算 amount (Quote Asset Volume) ≈ volume * close
            # 这只是一个估算，但在无法获取真实成交额时作为替代
            df['amount'] = df['volume'] * df['close']
            
            # 筛选需要的列
            required_cols = ['timestamps', 'open', 'high', 'low', 'close', 'volume', 'amount']
            df = df[required_cols]
            
            # 处理时区
            # yfinance 返回的通常是本地时间或 UTC，取决于 interval
            # 我们需要统一转换为 UTC+8 无时区时间
            if df['timestamps'].dt.tz is None:
                # 假设是 UTC，先 localize
                df['timestamps'] = df['timestamps'].dt.tz_localize('UTC')
            
            china_tz = pytz.timezone('Asia/Shanghai')
            df['timestamps'] = df['timestamps'].dt.tz_convert(china_tz).dt.tz_localize(None)
            
            # 过滤 start_time 之后的数据
            if start_time:
                # start_time 应该是 UTC+8 无时区（根据 DataFetcher 的逻辑）
                # 确保比较时一致
                df = df[df['timestamps'] > start_time]
            
            logger.info(f"从 Yahoo Finance 成功获取 {len(df)} 条数据")
            return df

        except Exception as e:
            logger.error(f"Yahoo Finance 获取失败: {e}")
            return None

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
            if "Service unavailable from a restricted location" in str(e) or isinstance(e, BinanceAPIException):
                logger.warning(f"Binance API 受限或失败 ({e})，尝试切换到 Yahoo Finance...")
                return self._fetch_from_yfinance(symbol, start_time)
            
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
