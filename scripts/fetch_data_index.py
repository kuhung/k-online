import gc
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pandas as pd
import sys
import json
import argparse
from tenacity import retry, stop_after_attempt, wait_exponential
import akshare as ak

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

# --- Configuration ---
Config = {
    "INDEX_SYMBOLS": ['000001', '399001', '399006'],  # 示例：上证指数, 深证成指, 创业板指
    "INDEX_NAMES": {  # 指数名称映射
        '000001': '上证指数',
        '399001': '深证成指',
        '399006': '创业板指',
    },
    "INTERVAL": '60',  # 默认使用小时级别数据, AkShare period参数为字符串'60'
    "HIST_POINTS": 360, # 这个参数对于AkShare可能不直接适用，但保留
    "VOL_WINDOW": 24, # 这个参数对于AkShare可能不直接适用，但保留
    "DATA_DIR": Path(__file__).resolve().parent / "data"
}

def get_interval_display_name(interval: str) -> str:
    """将时间间隔转换为显示名称"""
    interval_map = {
        '60': '1h',
        '60min': '1h',
        '1': '1min',
        '5': '5min',
        '15': '15min',
        '30': '30min',
        '60': '1h',
        '120': '2h',
        '240': '4h',
        '480': '8h',
        '720': '12h'
    }
    return interval_map.get(interval, interval)

def get_data_file_path(symbol: str) -> Path:
    """获取数据文件路径"""
    interval_display = get_interval_display_name(Config['INTERVAL'])
    return Config["DATA_DIR"] / f"{symbol}_{interval_display}.csv"

def get_last_timestamp(file_path: Path) -> datetime:
    """获取本地数据的最后时间戳"""
    if not file_path.exists():
        return None
    try:
        df = pd.read_csv(file_path)
        if len(df) == 0:
            return None
        return pd.to_datetime(df['timestamps'].iloc[-1])
    except Exception as e:
        print(f"读取本地数据失败: {e}")
        return None

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=1, max=10))
def fetch_akshare_index_data(symbol: str, start_time: datetime = None):
    """从AkShare获取A股指数K线数据"""
    interval_period = Config["INTERVAL"] # '60' for hourly data
    
    # 确定查询的开始和结束时间
    if start_time:
        # 增量获取，从本地最新时间戳之后开始
        start_date_str = (start_time + timedelta(minutes=int(interval_period))).strftime("%Y-%m-%d %H:%M:%S")
        end_date_str = datetime.now(timezone.utc).astimezone(None).strftime("%Y-%m-%d %H:%M:%S") # 当前时间
    else:
        # 首次获取，获取最近一年的数据，AkShare接口对历史数据有“近期”的限制
        # 对于小时级别数据，AkShare通常只能获取数月到一年的数据
        one_year_ago = datetime.now() - timedelta(days=365)
        start_date_str = one_year_ago.strftime("%Y-%m-%d %H:%M:%S")
        end_date_str = datetime.now(timezone.utc).astimezone(None).strftime("%Y-%m-%d %H:%M:%S")

    print(f"正在获取 {Config['INDEX_NAMES'].get(symbol, symbol)} ({symbol}) {interval_period}分钟数据, 从 {start_date_str} 到 {end_date_str}...")
    
    try:
        df = ak.index_zh_a_hist_min_em(
            symbol=symbol,
            period=interval_period,
            start_date=start_date_str,
            end_date=end_date_str
        )
        if df.empty:
            print(f"没有新数据需要获取")
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

        # 只保留需要的列，与示范脚本保持一致
        df = df[['timestamps', 'open', 'high', 'low', 'close', 'volume', 'amount']]

        df['timestamps'] = pd.to_datetime(df['timestamps'])
        # 确保数据类型正确
        for col in ['open', 'high', 'low', 'close', 'volume', 'amount']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        print(f"成功获取 {len(df)} 条数据")
        return df
    except Exception as e:
        print(f"从AkShare获取数据失败: {e}")
        return None

def update_local_data(symbol: str):
    """更新本地数据文件"""
    file_path = get_data_file_path(symbol)
    last_timestamp = get_last_timestamp(file_path)
    
    if last_timestamp:
        print(f"发现本地数据，最后更新时间: {last_timestamp}")
        # 获取增量数据
        new_data = fetch_akshare_index_data(symbol, last_timestamp)
        if new_data is not None and not new_data.empty:
            # 读取现有数据
            existing_data = pd.read_csv(file_path)
            existing_data['timestamps'] = pd.to_datetime(existing_data['timestamps'])
            
            # 合并数据并去重
            combined_data = pd.concat([existing_data, new_data])
            combined_data = combined_data.drop_duplicates(subset=['timestamps']).sort_values('timestamps')
            
            # 保存更新后的数据
            combined_data.to_csv(file_path, index=False)
            print(f"更新了 {len(new_data)} 条新数据")
        else:
            print("没有新数据需要更新")
    else:
        print("未找到本地数据，开始首次下载")
        # 首次下载数据
        new_data = fetch_akshare_index_data(symbol)
        if new_data is not None and not new_data.empty:
            # 确保目录存在
            file_path.parent.mkdir(parents=True, exist_ok=True)
            new_data.to_csv(file_path, index=False)
            print(f"首次下载完成，共 {len(new_data)} 条数据")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='获取A股指数历史数据')
    parser.add_argument('--period', type=str, default='60',
                      choices=['1', '5', '15', '30', '60'],
                      help='数据时间间隔 (默认: 60分钟)')
    args = parser.parse_args()

    # 更新配置
    Config["INTERVAL"] = args.period

    print(f"开始更新数据 - {datetime.now(timezone.utc).astimezone(None)}")
    print(f"数据时间间隔: {Config['INTERVAL']}分钟")
    
    for symbol in Config["INDEX_SYMBOLS"]:
        print(f"\n处理 {Config['INDEX_NAMES'].get(symbol, symbol)} ({symbol}) 数据...")
        try:
            update_local_data(symbol)
        except Exception as e:
            print(f"更新 {Config['INDEX_NAMES'].get(symbol, symbol)} ({symbol}) 数据时出错: {e}")
        time.sleep(1)  # 在处理不同交易对之间添加延迟
    
    print("\n数据更新完成")

if __name__ == '__main__':
    main()
