#!/usr/bin/env python3
"""
A股指数数据获取实现

数据源优先级（由高到低）:
  1. AkShare   — 分钟级行情，主力来源
  2. Yahoo Finance — 分钟级行情，第一备用
  3. finshare  — 日线行情，最终兜底（颗粒度降级，聊胜于无）
"""
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pandas as pd
from typing import Optional, List
import akshare as ak
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
import yfinance as yf
import pytz

from data_fetcher import DataFetcher

logger = logging.getLogger(__name__)

class IndexDataFetcher(DataFetcher):
    """A股指数数据获取类"""
    
    SYMBOL_NAMES = {
        '000001': '上证指数',
        '399001': '深证成指',
        '399006': '创业板指',
    }
    
    # 映射 AkShare Symbol 到 Yahoo Finance Ticker
    YFINANCE_MAPPING = {
        '000001': '000001.SS',
        '399001': '399001.SZ',
        '399006': '399006.SZ',
    }

    # finshare 默认按首位数字判断市场（'0' → 深市），上证指数 000001 需手动指定 SH 前缀
    FINSHARE_CODE_MAPPING = {
        '000001': 'sh000001',   # 上证指数，上交所指数
        '399001': 'sz399001',   # 深证成指，深交所指数
        '399006': 'sz399006',   # 创业板指，深交所指数
    }

    SUPPORTED_SYMBOLS = list(SYMBOL_NAMES.keys())
    
    INTERVAL_MAPPING = {
        '1': '1min',
        '5': '5min',
        '15': '15min',
        '30': '30min',
        '60': '1h'
    }
    
    YFINANCE_INTERVAL_MAPPING = {
        '1': '1m',
        '5': '5m',
        '15': '15m',
        '30': '30m',
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
            # 简化策略：获取最近的数据
            period = "2y" # 默认获取较长时间
            if self.interval in ['1', '5', '15', '30']:
                period = "1mo" # 分钟级数据限制较多
            elif self.interval == '60':
                period = "730d" # 1h 数据最多约 2 年
            
            df = yf.download(ticker, period=period, interval=yf_interval, progress=False, multi_level_index=False)
            
            if df.empty:
                logger.warning(f"Yahoo Finance 返回空数据: {ticker}")
                return None
                
            df.reset_index(inplace=True)
            
            # 查找时间列
            time_col = 'Date' if 'Date' in df.columns else 'Datetime'
            if time_col not in df.columns:
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
            
            # 计算 amount (成交额)
            # A股 Yahoo Finance 的 Volume 通常是股数，Amount 需要估算
            df['amount'] = df['volume'] * df['close']
            
            # 筛选需要的列
            required_cols = ['timestamps', 'open', 'high', 'low', 'close', 'volume', 'amount']
            df = df[required_cols]
            
            # 处理时区: 统一转换为 UTC+8 无时区时间
            if df['timestamps'].dt.tz is None:
                # 假设是 UTC，先 localize
                df['timestamps'] = df['timestamps'].dt.tz_localize('UTC')
            
            china_tz = pytz.timezone('Asia/Shanghai')
            df['timestamps'] = df['timestamps'].dt.tz_convert(china_tz).dt.tz_localize(None)
            
            # 过滤 start_time 之后的数据
            if start_time:
                df = df[df['timestamps'] > start_time]
            
            logger.info(f"从 Yahoo Finance 成功获取 {len(df)} 条数据")
            return df

        except Exception as e:
            logger.error(f"Yahoo Finance 获取失败: {e}")
            return None

    def _fetch_from_finshare(self, symbol: str, start_time: Optional[datetime] = None) -> Optional[pd.DataFrame]:
        """从 finshare 获取日线数据作为最终兜底

        注意：finshare 仅支持日线粒度，当分钟级数据源全部失效时使用。
        返回数据的 timestamps 设置为每个交易日 15:00（A股收盘时间）。
        """
        try:
            from finshare import get_data_manager
        except ImportError:
            logger.warning("finshare 未安装，跳过该备用源")
            return None

        logger.info(f"尝试从 finshare 获取 {self.get_symbol_name(symbol)} ({symbol}) 日线数据...")
        try:
            manager = get_data_manager()

            # 使用预定义映射确保指数代码指向正确市场，避免 finshare 按首位数字
            # 误判市场（如 000001 → SZ000001 平安银行，而非 SH000001 上证指数）
            finshare_code = self.FINSHARE_CODE_MAPPING.get(symbol, symbol)

            start_str = (
                (start_time + timedelta(days=1)).strftime("%Y-%m-%d")
                if start_time
                else (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
            )
            end_str = datetime.now().strftime("%Y-%m-%d")

            df = manager.get_historical_data(
                code=finshare_code,
                start=start_str,
                end=end_str,
            )

            if df is None or df.empty:
                logger.warning(f"finshare 返回空数据: {symbol}")
                return None

            # 将 trade_date 转成 datetime，并固定为 15:00 收盘时间点
            df['timestamps'] = pd.to_datetime(df['trade_date']).apply(
                lambda d: d.replace(hour=15, minute=0, second=0)
            )

            df.rename(columns={
                'open_price': 'open',
                'high_price': 'high',
                'low_price': 'low',
                'close_price': 'close',
            }, inplace=True)

            for col in ['open', 'high', 'low', 'close', 'volume', 'amount']:
                df[col] = pd.to_numeric(df[col], errors='coerce')

            df = df[['timestamps', 'open', 'high', 'low', 'close', 'volume', 'amount']]

            if start_time:
                df = df[df['timestamps'] > start_time]

            logger.info(f"finshare 成功获取 {len(df)} 条日线数据（粒度已降级为日线）")
            return df if not df.empty else None

        except Exception as e:
            logger.error(f"finshare 获取失败: {e}")
            return None

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
            logger.warning(f"AkShare 获取失败 ({e})，尝试切换到 Yahoo Finance...")
            result = self._fetch_from_yfinance(symbol, start_time)
            if result is not None:
                return result
            logger.warning("Yahoo Finance 也失败，降级到 finshare 日线数据...")
            return self._fetch_from_finshare(symbol, start_time)
    
    def get_all_symbols(self) -> List[str]:
        """获取所有支持的指数代码"""
        return self.SUPPORTED_SYMBOLS
    
    def get_symbol_name(self, symbol: str) -> str:
        """获取指数的显示名称"""
        return self.SYMBOL_NAMES.get(symbol, symbol)
    
    def get_market_type(self) -> str:
        """获取市场类型"""
        return "index"
