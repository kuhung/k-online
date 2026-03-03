#!/usr/bin/env python3
"""
使用统一架构的A股指数数据获取脚本
"""
import argparse
import logging
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from index_fetcher import IndexDataFetcher

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description='获取A股指数历史数据')
    parser.add_argument('--period', '-p', type=str, default='15',
                       choices=['1', '5', '15', '30', '60'],
                       help='数据时间间隔，单位为分钟 (默认: 15)')
    parser.add_argument('--symbols', '-s', type=str, nargs='*',
                       help='指定要获取的指数代码，默认获取所有支持的指数')

    args = parser.parse_args()

    data_dir = Path(__file__).resolve().parent / "data"
    fetcher = IndexDataFetcher(data_dir, args.period)

    if args.symbols:
        symbols = args.symbols
        for symbol in symbols:
            if symbol not in fetcher.get_all_symbols():
                logger.error(f"不支持的指数代码: {symbol}")
                logger.info(f"支持的指数代码: {', '.join(fetcher.get_all_symbols())}")
                return
    else:
        symbols = fetcher.get_all_symbols()

    logger.info(f"开始获取A股指数数据，时间间隔: {args.period}分钟")
    logger.info(f"指数代码: {', '.join(symbols)}")

    success_count = 0
    total_count = len(symbols)

    for symbol in symbols:
        logger.info(f"正在处理 {fetcher.get_symbol_name(symbol)} ({symbol})")
        try:
            if fetcher.update_local_data(symbol):
                success_count += 1
                logger.info(f"{symbol} 数据更新成功")
            else:
                logger.error(f"{symbol} 数据更新失败")
        except Exception as e:
            logger.error(f"{symbol} 数据更新失败: {e}")

    logger.info(f"数据获取完成: {success_count}/{total_count} 个指数更新成功")


if __name__ == '__main__':
    main()
