import gc
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
import io
import base64
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import sys
import json
import argparse

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from model import KronosTokenizer, Kronos, KronosPredictor

# --- Configuration ---
Config = {
    "MODEL_PATH": str(Path(__file__).resolve().parents[1] / "examples/my_kronos_cache"),
    "SYMBOL": 'BTCUSDT',  # 保持原有的单一标的配置
    "TARGET_SYMBOLS": ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'],
    "SYMBOL_NAMES": {  # 标的名称映射
        'BTCUSDT': '比特币 / USDT',
        'ETHUSDT': '以太坊 / USDT',
        'SOLUSDT': 'Solana / USDT',
        'XRPUSDT': '瑞波币 / USDT',
        'DOGEUSDT': '狗狗币 / USDT',
    },
    "INTERVAL": '1d',  # 默认使用天级别数据
    "INTERVAL_MAPPING": {  # 时间间隔到小时的映射
        '1m': 1/60, '3m': 3/60, '5m': 5/60, '15m': 15/60, '30m': 30/60,
        '1h': 1, '2h': 2, '4h': 4, '6h': 6, '8h': 8, '12h': 12,
        '1d': 24, '3d': 72, '1w': 168, '1M': 720  # 假设一个月平均30天
    },
    "HIST_POINTS": 360,
    "PRED_HORIZON": 24,  # 将根据时间间隔动态调整
    "N_PREDICTIONS": 30,
    "VOL_WINDOW": 24,  # 将根据时间间隔动态调整
    "DATA_DIR": Path(__file__).resolve().parent / "data",
    "price_cols": ['open', 'high', 'low', 'close']
}

def load_model():
    """加载 Kronos 模型和分词器"""
    print("加载 Kronos 模型...")
    try:
        # 尝试从本地缓存加载
        cache_dir = Path(Config["MODEL_PATH"])
        tokenizer_path = cache_dir / "models--NeoQuasar--Kronos-Tokenizer-base/snapshots/f6c7de7b0490e422fde7a44bc73369e07115c445"
        model_path = cache_dir / "models--NeoQuasar--Kronos-small/snapshots/12b79908b3a9bef41ad5db0e01746f9a2fd2d882"
        
        print(f"从 {tokenizer_path} 加载分词器")
        tokenizer = KronosTokenizer.from_pretrained(tokenizer_path)
        print(f"从 {model_path} 加载模型")
        model = Kronos.from_pretrained(model_path)
    except Exception as e:
        print(f"从缓存加载失败: {e}")
        print("尝试从 Hugging Face 下载...")
        tokenizer = KronosTokenizer.from_pretrained("NeoQuasar/Kronos-Tokenizer-base", cache_dir=Config["MODEL_PATH"])
        model = Kronos.from_pretrained("NeoQuasar/Kronos-small", cache_dir=Config["MODEL_PATH"])
    
    tokenizer.eval()
    model.eval()
    predictor = KronosPredictor(model, tokenizer, device="cuda" if torch.cuda.is_available() else "cpu", max_context=512)
    print("模型加载成功")
    return predictor

def load_local_data(symbol: str):
    """加载本地数据"""
    file_path = Config["DATA_DIR"] / f"{symbol}_{Config['INTERVAL']}.csv"
    if not file_path.exists():
        raise FileNotFoundError(f"找不到数据文件: {file_path}")
    
    df = pd.read_csv(file_path)
    df['timestamps'] = pd.to_datetime(df['timestamps'])
    return df

def make_prediction(df, predictor):
    """使用 Kronos 模型生成概率预测"""
    last_timestamp = df['timestamps'].max()
    interval_hours = Config["INTERVAL_MAPPING"][Config["INTERVAL"]]
    
    # 根据时间间隔调整预测周期
    pred_horizon = max(1, int(Config["PRED_HORIZON"] / interval_hours))
    
    start_new_range = last_timestamp + pd.Timedelta(hours=interval_hours)
    freq_str = {
        1/60: 'min', 1: 'H', 24: 'D', 168: 'W', 720: 'M'
    }.get(interval_hours, 'H')
    
    if interval_hours < 1:  # 分钟级别
        freq_value = int(interval_hours * 60)
        freq = f'{freq_value}min'
    elif interval_hours >= 24:  # 天及以上级别
        freq = freq_str
    else:  # 小时级别
        freq = f'{int(interval_hours)}H'
    
    new_timestamps_index = pd.date_range(
        start=start_new_range,
        periods=pred_horizon,
        freq=freq
    )
    y_timestamp = pd.Series(new_timestamps_index, name='y_timestamp')
    x_timestamp = df['timestamps']
    x_df = df[['open', 'high', 'low', 'close', 'volume', 'amount']]

    with torch.no_grad():
        print("生成主要预测 (T=1.0)...")
        begin_time = time.time()
        all_preds_main = predictor.predict(
            df=x_df, x_timestamp=x_timestamp, y_timestamp=y_timestamp,
            pred_len=Config["PRED_HORIZON"], T=1.0, top_p=0.95,
            sample_count=Config["N_PREDICTIONS"], verbose=True
        )
        close_preds_main, volume_preds_main = all_preds_main
        print(f"主要预测完成，用时 {time.time() - begin_time:.2f} 秒")

        close_preds_volatility = close_preds_main # 暂时仍然使用主要预测的close数据

    return close_preds_main, volume_preds_main, close_preds_volatility

def calculate_metrics(hist_df, close_preds_df, v_close_preds_df):
    """计算24小时周期的上涨概率和波动性放大概率"""
    last_close = hist_df['close'].iloc[-1]

    # 1. 上涨概率（24小时周期）
    final_hour_preds = close_preds_df.iloc[-1]
    upside_prob = (final_hour_preds > last_close).mean()

    # 2. 波动性放大概率（24小时周期）
    hist_log_returns = np.log(hist_df['close'] / hist_df['close'].shift(1))
    historical_vol = hist_log_returns.iloc[-Config["VOL_WINDOW"]:].std()

    amplification_count = 0
    print("\n--- Volatility Calculation Debug ---")
    print(f"Historical Volatility (window={Config['VOL_WINDOW']}): {historical_vol}")
    
    for i, col in enumerate(v_close_preds_df.columns):
        full_sequence = pd.concat([pd.Series([last_close]), v_close_preds_df[col]]).reset_index(drop=True)
        pred_log_returns = np.log(full_sequence / full_sequence.shift(1))
        predicted_vol = pred_log_returns.std()
        
        if i < 5: # 仅打印前5个样本以避免刷屏
            print(f"  Prediction Sample {i+1} Volatility: {predicted_vol}")
            
        if predicted_vol > historical_vol:
            amplification_count += 1

    vol_amp_prob = amplification_count / len(v_close_preds_df.columns)
    print(f"Total predictions: {len(v_close_preds_df.columns)}, Amplified count: {amplification_count}")
    print("------------------------------------\n")

    print(f"上涨概率 (24h): {upside_prob:.2%}, 波动性放大概率: {vol_amp_prob:.2%}")
    return upside_prob, vol_amp_prob

def create_plot(hist_df, close_preds_df, volume_preds_df):
    """生成并保存综合预测图表"""
    print("生成综合预测图表...")
    fig, (ax1, ax2) = plt.subplots(
        2, 1, figsize=(15, 10), sharex=True,
        gridspec_kw={'height_ratios': [3, 1]}
    )

    hist_time = hist_df['timestamps']
    last_hist_time = hist_time.iloc[-1]
    interval_hours = Config["INTERVAL_MAPPING"][Config["INTERVAL"]]
    
    # 根据时间间隔生成预测时间序列
    pred_time = pd.date_range(
        start=last_hist_time + pd.Timedelta(hours=interval_hours),
        periods=len(close_preds_df),
        freq=pd.Timedelta(hours=interval_hours)
    )

    ax1.plot(hist_time, hist_df['close'], color='royalblue', label='Historical Price', linewidth=1.5)
    mean_preds = close_preds_df.mean(axis=1)
    ax1.plot(pred_time, mean_preds, color='darkorange', linestyle='-', label='Average Prediction')
    ax1.fill_between(pred_time, close_preds_df.min(axis=1), close_preds_df.max(axis=1), color='darkorange', alpha=0.2, label='Prediction Range (Min-Max)')
    interval_display = {
        '1m': 'minute', '3m': 'minute', '5m': 'minute', '15m': 'minute', '30m': 'minute',
        '1h': 'hour', '2h': 'hour', '4h': 'hour', '6h': 'hour', '8h': 'hour', '12h': 'hour',
        '1d': 'day', '3d': 'day', '1w': 'week', '1M': 'month'
    }.get(Config["INTERVAL"], 'time unit')
    
    pred_count = len(close_preds_df)
    ax1.set_title(
        f'{Config["SYMBOL"]} Probabilistic Price and Volume Prediction (Next {pred_count} {interval_display})',
        fontsize=16, weight='bold'
    )
    ax1.set_ylabel('Price (USDT)')
    ax1.legend()
    ax1.grid(True, which='both', linestyle='--', linewidth=0.5)

    ax2.bar(hist_time, hist_df['volume'], color='skyblue', label='Historical Volume', width=0.03)
    ax2.bar(pred_time, volume_preds_df.mean(axis=1), color='sandybrown', label='Predicted Average Volume', width=0.03)
    ax2.set_ylabel('Volume')
    ax2.set_xlabel('Time (UTC)')
    ax2.legend()
    ax2.grid(True, which='both', linestyle='--', linewidth=0.5)

    separator_time = hist_time.iloc[-1] + timedelta(minutes=30)
    for ax in [ax1, ax2]:
        ax.axvline(x=separator_time, color='red', linestyle='--', linewidth=1.5, label='_nolegend_')
        ax.tick_params(axis='x', rotation=30)

    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=120)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    print("图表生成完成并编码为base64")
    return img_base64

def main_task(model, symbol: str):
    """执行单个交易对的完整更新周期"""
    print("\n" + "=" * 60 + f"\n开始更新 {symbol} 的预测 - {datetime.now(timezone.utc)}\n" + "=" * 60)
    
    try:
        df_full = load_local_data(symbol)
        df_for_model = df_full.tail(Config["HIST_POINTS"] + Config["VOL_WINDOW"]).iloc[:-1]

        close_preds, volume_preds, v_close_preds = make_prediction(df_for_model, model)

        hist_df_for_plot = df_for_model.tail(Config["HIST_POINTS"])
        hist_df_for_metrics = df_for_model.tail(Config["VOL_WINDOW"])

        upside_prob, vol_amp_prob = calculate_metrics(hist_df_for_metrics, close_preds, v_close_preds)
        chart_base64 = create_plot(hist_df_for_plot, close_preds, volume_preds)

        # 清理内存
        del df_full, df_for_model, close_preds, volume_preds, v_close_preds
        del hist_df_for_plot, hist_df_for_metrics
        gc.collect()

        print("-" * 60 + "\n--- 任务成功完成 ---\n" + "-" * 60 + "\n")
        return {
            "symbol": symbol,
            "name": Config["SYMBOL_NAMES"].get(symbol, symbol),
            "updated_at_utc": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC'),
            "direction": "Up" if upside_prob >= 0.5 else "Down",
            "upside_probability": f"{upside_prob:.1%}",
            "volatility_amplification_probability": f"{vol_amp_prob:.1%}",
            "chart_image_base64": chart_base64,
            "data_source": "Local Data"
        }
    except Exception as e:
        print(f"处理 {symbol} 时出错: {e}")
        return None

# 全局变量存储加载的模型
_loaded_predictor = None

def generate_and_save_prediction_data():
    global _loaded_predictor

    # 只加载一次模型
    if _loaded_predictor is None:
        model_path_obj = Path(Config["MODEL_PATH"])
        model_path_obj.mkdir(parents=True, exist_ok=True)
        _loaded_predictor = load_model()

    print("执行主要预测任务以生成数据")
    
    all_predictions = {}
    for symbol in Config["TARGET_SYMBOLS"]:
        prediction_data = main_task(_loaded_predictor, symbol)
        if prediction_data:
            all_predictions[symbol] = prediction_data

    return all_predictions

if __name__ == '__main__':
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='生成加密货币价格预测')
    parser.add_argument('--interval', type=str, default='1d',
                      choices=['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'],
                      help='数据时间间隔 (默认: 1d)')
    args = parser.parse_args()

    # 更新配置
    Config["INTERVAL"] = args.interval
    
    # 生成并保存数据
    data = generate_and_save_prediction_data()
    output_path = Path(__file__).resolve().parents[1] / "web/public/predictions.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"预测数据已保存到 {output_path}")
