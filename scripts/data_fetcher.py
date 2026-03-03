#!/usr/bin/env python3
"""
统一的数据获取接口
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pandas as pd
from typing import Optional, List
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataFetcher(ABC):
    """数据获取基类"""
    
    def __init__(self, data_dir: Path, interval: str):
        self.data_dir = data_dir
        self.interval = interval
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    def get_data_file_path(self, symbol: str) -> Path:
        """获取数据文件路径"""
        return self.data_dir / f"{symbol}_{self.get_interval_display_name()}.csv"
    
    @abstractmethod
    def get_interval_display_name(self) -> str:
        """获取时间间隔的显示名称"""
        pass
    
    def get_last_timestamp(self, file_path: Path) -> Optional[datetime]:
        """获取本地数据的最后时间戳"""
        if not file_path.exists():
            return None
        try:
            import pytz
            df = pd.read_csv(file_path)
            if len(df) == 0:
                return None
            
            # 解析时间戳
            timestamp = pd.to_datetime(df['timestamps'].iloc[-1])
            
            # 如果是加密货币数据，需要将本地存储的北京时间转换为带时区信息的时间
            # 这样在调用 timestamp() 时才能得到正确的UTC时间戳
            if hasattr(self, 'get_market_type') and self.get_market_type() == 'crypto':
                china_tz = pytz.timezone('Asia/Shanghai')
                # 本地数据存储的是北京时间，添加时区信息
                if timestamp.tz is None:
                    timestamp = china_tz.localize(timestamp)
            
            return timestamp
        except Exception as e:
            logger.error(f"读取本地数据失败: {e}")
            return None
    
    @abstractmethod
    def fetch_data(self, symbol: str, start_time: Optional[datetime] = None) -> Optional[pd.DataFrame]:
        """获取市场数据"""
        pass
    
    def update_local_data(self, symbol: str, max_rows: int = 5000) -> bool:
        """更新本地数据文件"""
        file_path = self.get_data_file_path(symbol)
        last_timestamp = self.get_last_timestamp(file_path)
        
        try:
            if last_timestamp:
                logger.info(f"发现本地数据，最后更新时间: {last_timestamp}")
                # 获取增量数据
                new_data = self.fetch_data(symbol, last_timestamp)
                if new_data is not None and not new_data.empty:
                    # 读取现有数据
                    existing_data = pd.read_csv(file_path)
                    existing_data['timestamps'] = pd.to_datetime(existing_data['timestamps'])
                    
                    # 合并数据并去重
                    combined_data = pd.concat([existing_data, new_data])
                    combined_data = combined_data.drop_duplicates(subset=['timestamps']).sort_values('timestamps')
                    
                    # 截断数据，只保留最近的 max_rows 行
                    if len(combined_data) > max_rows:
                        logger.info(f"数据量超过 {max_rows} 行，进行截断")
                        combined_data = combined_data.tail(max_rows)
                    
                    # 保存更新后的数据
                    combined_data.to_csv(file_path, index=False)
                    logger.info(f"更新了 {len(new_data)} 条新数据")
                else:
                    logger.info("没有新数据需要更新")
            else:
                logger.info("未找到本地数据，开始首次下载")
                # 首次下载数据
                new_data = self.fetch_data(symbol)
                if new_data is not None and not new_data.empty:
                    # 截断数据，只保留最近的 max_rows 行
                    if len(new_data) > max_rows:
                        logger.info(f"数据量超过 {max_rows} 行，进行截断")
                        new_data = new_data.tail(max_rows)
                        
                    new_data.to_csv(file_path, index=False)
                    logger.info(f"首次下载完成，共 {len(new_data)} 条数据")
                else:
                    logger.error("首次下载数据失败")
                    return False
            return True
        except Exception as e:
            logger.error(f"更新数据失败: {e}")
            return False
    
    @abstractmethod
    def get_all_symbols(self) -> List[str]:
        """获取所有支持的交易对"""
        pass
    
    @abstractmethod
    def get_symbol_name(self, symbol: str) -> str:
        """获取交易对的显示名称"""
        pass
    
    @abstractmethod
    def get_market_type(self) -> str:
        """获取市场类型"""
        pass
