#!/usr/bin/env python3
"""
使用新架构的加密货币数据获取脚本
"""
import argparse
import logging
from pathlib import Path
import sys

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from crypto_fetcher import CryptoDataFetcher

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='获取加密货币数据')
    parser.add_argument('--interval', '-i', type=str, default='1h',
                       help='时间间隔 (1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M)')
    parser.add_argument('--symbols', '-s', type=str, nargs='*',
                       help='指定要获取的交易对，默认获取所有支持的交易对')
    
    args = parser.parse_args()
    
    # 数据目录
    data_dir = Path(__file__).resolve().parent / "data"
    
    # 创建数据获取器
    fetcher = CryptoDataFetcher(data_dir, args.interval)
    
    # 确定要获取的交易对
    if args.symbols:
        symbols = args.symbols
        # 验证交易对是否支持
        for symbol in symbols:
            if symbol not in fetcher.get_all_symbols():
                logger.error(f"不支持的交易对: {symbol}")
                logger.info(f"支持的交易对: {', '.join(fetcher.get_all_symbols())}")
                return
    else:
        symbols = fetcher.get_all_symbols()
    
    logger.info(f"开始获取加密货币数据，时间间隔: {args.interval}")
    logger.info(f"交易对: {', '.join(symbols)}")
    
    success_count = 0
    total_count = len(symbols)
    
    for symbol in symbols:
        logger.info(f"正在处理 {fetcher.get_symbol_name(symbol)} ({symbol})")
        try:
            if fetcher.update_local_data(symbol):
                success_count += 1
                logger.info(f"✓ {symbol} 数据更新成功")
            else:
                logger.error(f"✗ {symbol} 数据更新失败")
        except Exception as e:
            logger.error(f"✗ {symbol} 数据更新失败: {e}")
    
    logger.info(f"数据获取完成: {success_count}/{total_count} 个交易对更新成功")
    
    # 不再根据 success_count < total_count 退出，而是始终返回成功，
    # 除非遇到更严重的、无法继续处理的错误
    # if success_count < total_count:
    #     sys.exit(1)

if __name__ == "__main__":
    main()
