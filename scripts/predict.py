#!/usr/bin/env python3
"""
市场预测主程序
"""
import gc
import time
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd
import sys
import json
import argparse
import logging
from typing import Dict, Any, List, Optional

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from market_predictor import MarketPredictor
from crypto_predictor import CryptoPredictor
from index_predictor import IndexPredictor
from crypto_fetcher import CryptoDataFetcher
from index_fetcher import IndexDataFetcher

# --- Configuration ---
Config = {
    "MODEL_PATH": str(Path(__file__).resolve().parents[1] / "examples/my_kronos_cache"),
    "DATA_DIR": Path(__file__).resolve().parent / "data",
}

def load_data(symbol: str, market_type: str, interval: str) -> Optional[pd.DataFrame]:
    """加载市场数据"""
    try:
        if market_type == "crypto":
            fetcher = CryptoDataFetcher(Config["DATA_DIR"], interval)
        elif market_type == "index":
            fetcher = IndexDataFetcher(Config["DATA_DIR"], interval)
        else:
            raise ValueError(f"不支持的市场类型: {market_type}")
        
        file_path = fetcher.get_data_file_path(symbol)
        if not file_path.exists():
            raise FileNotFoundError(f"找不到数据文件: {file_path}")
        
        df = pd.read_csv(file_path)
        df['timestamps'] = pd.to_datetime(df['timestamps'])
        return df
    
    except Exception as e:
        logger.error(f"加载数据失败: {e}")
        return None

def get_market_predictor(market_type: str, interval: str) -> MarketPredictor:
    """获取市场预测器"""
    if market_type == "crypto":
        return CryptoPredictor(Config["MODEL_PATH"], interval)
    elif market_type == "index":
        return IndexPredictor(Config["MODEL_PATH"], interval)
    else:
        raise ValueError(f"不支持的市场类型: {market_type}")

def get_symbols_for_market(market_type: str) -> List[str]:
    """获取指定市场的所有交易对"""
    if market_type == "crypto":
        return CryptoDataFetcher.SUPPORTED_SYMBOLS
    elif market_type == "index":
        return IndexDataFetcher.SUPPORTED_SYMBOLS
    else:
        raise ValueError(f"不支持的市场类型: {market_type}")

def main_task(symbol: str, market_type: str, interval: str) -> Dict[str, Any]:
    """执行单个交易对的预测任务"""
    logger.info("\n" + "=" * 60 + f"\n开始更新 {symbol} 的预测\n" + "=" * 60)
    
    try:
        # 加载数据
        df = load_data(symbol, market_type, interval)
        if df is None:
            return None
        
        # 获取预测器
        predictor = get_market_predictor(market_type, interval)
        
        # 生成预测
        prediction_data = predictor.make_prediction(df, symbol)
        
        # 清理内存
        del df
        gc.collect()
        
        logger.info("-" * 60 + "\n--- 任务成功完成 ---\n" + "-" * 60 + "\n")
        return prediction_data
    
    except Exception as e:
        logger.error(f"处理 {symbol} 时出错: {e}")
        return None

def generate_predictions(market_type: str, interval: str) -> Dict[str, Any]:
    """生成指定市场的所有预测"""
    all_predictions = {}
    
    try:
        symbols = get_symbols_for_market(market_type)
        for symbol in symbols:
            prediction_data = main_task(symbol, market_type, interval)
            if prediction_data:
                all_predictions[symbol] = prediction_data
            time.sleep(1)  # 添加延迟避免API限制
    except Exception as e:
        logger.error(f"生成预测时出错: {e}")
    
    return all_predictions

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='生成市场预测')
    parser.add_argument('--market', type=str, required=True,
                      choices=['crypto', 'index'],
                      help='市场类型: crypto (加密货币) 或 index (A股指数)')
    
    parser.add_argument('--interval', type=str,
                      help='数据时间间隔。对于加密货币市场: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M；'
                           '对于A股指数市场: 1,5,15,30,60')
    
    args = parser.parse_args()
    
    # 根据市场类型设置默认间隔
    if args.interval is None:
        args.interval = '1h' if args.market == 'crypto' else '60'
    
    # 验证时间间隔
    if args.market == 'crypto' and args.interval not in CryptoPredictor.INTERVAL_MAPPING:
        parser.error(f"加密货币市场不支持的时间间隔: {args.interval}")
    elif args.market == 'index' and args.interval not in IndexPredictor.INTERVAL_MAPPING:
        parser.error(f"A股指数市场不支持的时间间隔: {args.interval}")
    
    # 生成预测
    data = generate_predictions(args.market, args.interval)
    
    # 生成带时间戳的文件名
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    history_path = Path(__file__).resolve().parent / "history" / f"predictions_{args.market}_{timestamp}.json"
    
    # 确保目录存在
    history_path.parent.mkdir(parents=True, exist_ok=True)
    
    # 保存到历史记录
    with open(history_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    logger.info(f"预测数据已保存到历史记录 {history_path}")