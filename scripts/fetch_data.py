import gc
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pandas as pd
from binance.client import Client
import sys
import json
from tenacity import retry, stop_after_attempt, wait_exponential

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

# --- Configuration ---
Config = {
    "SYMBOL": 'BTCUSDT',  # 保持原有的单一标的配置
    "TARGET_SYMBOLS": ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'],
    "SYMBOL_NAMES": {  # 标的名称映射
        'BTCUSDT': '比特币 / USDT',
        'ETHUSDT': '以太坊 / USDT',
        'SOLUSDT': 'Solana / USDT',
        'XRPUSDT': '瑞波币 / USDT',
        'DOGEUSDT': '狗狗币 / USDT',
    },
    "INTERVAL": '1h',
    "HIST_POINTS": 360,
    "VOL_WINDOW": 24,
    "DATA_DIR": Path(__file__).parent / "data"
}

def get_data_file_path(symbol: str) -> Path:
    """获取数据文件路径"""
    return Config["DATA_DIR"] / f"{symbol}_{Config['INTERVAL']}.csv"

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
def fetch_binance_data(symbol: str, start_time: datetime = None):
    """从Binance获取K线数据"""
    interval = Config["INTERVAL"]
    limit = Config["HIST_POINTS"] + Config["VOL_WINDOW"] if start_time is None else 1000

    print(f"正在获取 {symbol} {interval} 数据...")
    client = Client(tld='us')  # 使用 Binance US API
    
    klines = []
    if start_time:
        # 增量获取数据
        current_start = int(start_time.timestamp() * 1000)
        while True:
            batch = client.get_klines(
                symbol=symbol,
                interval=interval,
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
        klines = client.get_klines(symbol=symbol, interval=interval, limit=limit)

    if not klines:
        print(f"没有新数据需要获取")
        return None

    cols = ['open_time', 'open', 'high', 'low', 'close', 'volume', 'close_time',
            'quote_asset_volume', 'number_of_trades', 'taker_buy_base_asset_volume',
            'taker_buy_quote_asset_volume', 'ignore']
    df = pd.DataFrame(klines, columns=cols)

    df = df[['open_time', 'open', 'high', 'low', 'close', 'volume', 'quote_asset_volume']]
    df.rename(columns={'quote_asset_volume': 'amount', 'open_time': 'timestamps'}, inplace=True)

    df['timestamps'] = pd.to_datetime(df['timestamps'], unit='ms')
    for col in ['open', 'high', 'low', 'close', 'volume', 'amount']:
        df[col] = pd.to_numeric(df[col])

    print(f"成功获取 {len(df)} 条数据")
    return df

def update_local_data(symbol: str):
    """更新本地数据文件"""
    file_path = get_data_file_path(symbol)
    last_timestamp = get_last_timestamp(file_path)
    
    if last_timestamp:
        print(f"发现本地数据，最后更新时间: {last_timestamp}")
        # 获取增量数据
        new_data = fetch_binance_data(symbol, last_timestamp)
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
        new_data = fetch_binance_data(symbol)
        if new_data is not None and not new_data.empty:
            # 确保目录存在
            file_path.parent.mkdir(parents=True, exist_ok=True)
            new_data.to_csv(file_path, index=False)
            print(f"首次下载完成，共 {len(new_data)} 条数据")

def main():
    """主函数"""
    print(f"开始更新数据 - {datetime.now(timezone.utc)}")
    
    for symbol in Config["TARGET_SYMBOLS"]:
        print(f"\n处理 {symbol} 数据...")
        try:
            update_local_data(symbol)
        except Exception as e:
            print(f"更新 {symbol} 数据时出错: {e}")
        time.sleep(1)  # 在处理不同交易对之间添加延迟
    
    print("\n数据更新完成")

if __name__ == '__main__':
    main()
