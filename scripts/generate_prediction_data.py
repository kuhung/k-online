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
from binance.client import Client
import sys

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from model import KronosTokenizer, Kronos, KronosPredictor

# --- Configuration ---
Config = {
    "MODEL_PATH": "../examples/my_kronos_cache",
    "SYMBOL": 'BTCUSDT',  # 保持原有的单一标的配置
    "TARGET_SYMBOLS": ['BTCUSDT', 'ETHUSDT'],  # 添加 ETHUSDT
    "SYMBOL_NAMES": {  # 标的名称映射
        'BTCUSDT': '比特币 / USDT',
        'ETHUSDT': '以太坊 / USDT',
    },
    "INTERVAL": '1h',
    "HIST_POINTS": 360,
    "PRED_HORIZON": 24,
    "N_PREDICTIONS": 30,
    "VOL_WINDOW": 24,
    "price_cols": ['open', 'high', 'low', 'close']
}


def load_model():
    """Loads the Kronos model and tokenizer."""
    print("Loading Kronos model...")
    try:
        # 尝试从本地缓存加载
        cache_dir = Path(Config["MODEL_PATH"])
        tokenizer_path = cache_dir / "models--NeoQuasar--Kronos-Tokenizer-base/snapshots/f6c7de7b0490e422fde7a44bc73369e07115c445"
        model_path = cache_dir / "models--NeoQuasar--Kronos-small/snapshots/12b79908b3a9bef41ad5db0e01746f9a2fd2d882"
        
        print(f"Loading tokenizer from {tokenizer_path}")
        tokenizer = KronosTokenizer.from_pretrained(tokenizer_path)
        print(f"Loading model from {model_path}")
        model = Kronos.from_pretrained(model_path)
    except Exception as e:
        print(f"Failed to load from cache: {e}")
        print("Attempting to download from Hugging Face...")
        tokenizer = KronosTokenizer.from_pretrained("NeoQuasar/Kronos-Tokenizer-base", cache_dir=Config["MODEL_PATH"])
        model = Kronos.from_pretrained("NeoQuasar/Kronos-small", cache_dir=Config["MODEL_PATH"])
    
    tokenizer.eval()
    model.eval()
    predictor = KronosPredictor(model, tokenizer, device="cpu", max_context=512)
    print("Model loaded successfully.")
    return predictor


def make_prediction(df, predictor):
    """Generates probabilistic forecasts using the Kronos model."""
    last_timestamp = df['timestamps'].max()
    start_new_range = last_timestamp + pd.Timedelta(hours=1)
    new_timestamps_index = pd.date_range(
        start=start_new_range,
        periods=Config["PRED_HORIZON"],
        freq='H'
    )
    y_timestamp = pd.Series(new_timestamps_index, name='y_timestamp')
    x_timestamp = df['timestamps']
    x_df = df[['open', 'high', 'low', 'close', 'volume', 'amount']]

    with torch.no_grad():
        print("Making main prediction (T=1.0)...")
        begin_time = time.time()
        all_preds_main = predictor.predict(
            df=x_df, x_timestamp=x_timestamp, y_timestamp=y_timestamp,
            pred_len=Config["PRED_HORIZON"], T=1.0, top_p=0.95,
            sample_count=Config["N_PREDICTIONS"], verbose=True
        )
        # --------------------------------------------------------
        # 修改 close_preds_main 和 volume_preds_main，确保它们始终是 DataFrame
        # --------------------------------------------------------
        close_preds_main = pd.DataFrame(all_preds_main['close'])
        volume_preds_main = pd.DataFrame(all_preds_main['volume'])
        # --------------------------------------------------------
        print(f"Main prediction completed in {time.time() - begin_time:.2f} seconds.")

        # print("Making volatility prediction (T=0.9)...")
        # begin_time = time.time()
        # close_preds_volatility, _ = predictor.predict(
        #     df=x_df, x_timestamp=x_timestamp, y_timestamp=y_timestamp,
        #     pred_len=Config["PRED_HORIZON"], T=0.9, top_p=0.9,
        #     sample_count=Config["N_PREDICTIONS"], verbose=True
        # )
        # print(f"Volatility prediction completed in {time.time() - begin_time:.2f} seconds.")
        close_preds_volatility = pd.DataFrame(close_preds_main) # Ensure it's a DataFrame

    return close_preds_main, volume_preds_main, close_preds_volatility


def fetch_binance_data(symbol: str):
    """Fetches K-line data from the Binance public API."""
    interval = Config["INTERVAL"]
    limit = Config["HIST_POINTS"] + Config["VOL_WINDOW"]

    print(f"Fetching {limit} bars of {symbol} {interval} data from Binance...")
    client = Client(tld='us')  # 使用 Binance US API
    klines = client.get_klines(symbol=symbol, interval=interval, limit=limit)

    cols = ['open_time', 'open', 'high', 'low', 'close', 'volume', 'close_time',
            'quote_asset_volume', 'number_of_trades', 'taker_buy_base_asset_volume',
            'taker_buy_quote_asset_volume', 'ignore']
    df = pd.DataFrame(klines, columns=cols)

    df = df[['open_time', 'open', 'high', 'low', 'close', 'volume', 'quote_asset_volume']]
    df.rename(columns={'quote_asset_volume': 'amount', 'open_time': 'timestamps'}, inplace=True)

    df['timestamps'] = pd.to_datetime(df['timestamps'], unit='ms')
    for col in ['open', 'high', 'low', 'close', 'volume', 'amount']:
        df[col] = pd.to_numeric(df[col])

    print("Data fetched successfully.")
    return df


def calculate_metrics(hist_df, close_preds_df, v_close_preds_df):
    """
    Calculates upside and volatility amplification probabilities for the 24h horizon.
    """
    last_close = hist_df['close'].iloc[-1]

    # 1. Upside Probability (for the 24-hour horizon)
    # This is the probability that the price at the end of the horizon is higher than now.
    final_hour_preds = close_preds_df.iloc[-1]
    upside_prob = (final_hour_preds > last_close).mean()

    # 2. Volatility Amplification Probability (over the 24-hour horizon)
    hist_log_returns = np.log(hist_df['close'] / hist_df['close'].shift(1))
    historical_vol = hist_log_returns.iloc[-Config["VOL_WINDOW"]:].std()

    amplification_count = 0
    for col in v_close_preds_df.columns:
        full_sequence = pd.concat([pd.Series([last_close]), v_close_preds_df[col]]).reset_index(drop=True)
        pred_log_returns = np.log(full_sequence / full_sequence.shift(1))
        predicted_vol = pred_log_returns.std()
        if predicted_vol > historical_vol:
            amplification_count += 1

    vol_amp_prob = amplification_count / len(v_close_preds_df.columns)

    print(f"Upside Probability (24h): {upside_prob:.2%}, Volatility Amplification Probability: {vol_amp_prob:.2%}")
    return upside_prob, vol_amp_prob


def create_plot(hist_df, close_preds_df, volume_preds_df):
    """Generates and saves a comprehensive forecast chart."""
    print("Generating comprehensive forecast chart...")
    # plt.style.use('seaborn-v0_8-whitegrid')
    fig, (ax1, ax2) = plt.subplots(
        2, 1, figsize=(15, 10), sharex=True,
        gridspec_kw={'height_ratios': [3, 1]}
    )

    hist_time = hist_df['timestamps']
    last_hist_time = hist_time.iloc[-1]
    pred_time = pd.to_datetime([last_hist_time + timedelta(hours=i + 1) for i in range(len(close_preds_df))])

    ax1.plot(hist_time, hist_df['close'], color='royalblue', label='Historical Price', linewidth=1.5)
    mean_preds = close_preds_df.mean(axis=1)
    ax1.plot(pred_time, mean_preds, color='darkorange', linestyle='-', label='Mean Forecast')
    ax1.fill_between(pred_time, close_preds_df.min(axis=1), close_preds_df.max(axis=1), color='darkorange', alpha=0.2, label='Forecast Range (Min-Max)')
    ax1.set_title(f'{Config["SYMBOL"]} Probabilistic Price & Volume Forecast (Next {Config["PRED_HORIZON"]} Hours)', fontsize=16, weight='bold')
    ax1.set_ylabel('Price (USDT)')
    ax1.legend()
    ax1.grid(True, which='both', linestyle='--', linewidth=0.5)

    ax2.bar(hist_time, hist_df['volume'], color='skyblue', label='Historical Volume', width=0.03)
    ax2.bar(pred_time, volume_preds_df.mean(axis=1), color='sandybrown', label='Mean Forecasted Volume', width=0.03)
    ax2.set_ylabel('Volume')
    ax2.set_xlabel('Time (UTC)')
    ax2.legend()
    ax2.grid(True, which='both', linestyle='--', linewidth=0.5)

    separator_time = hist_time.iloc[-1] + timedelta(minutes=30)
    for ax in [ax1, ax2]:
        ax.axvline(x=separator_time, color='red', linestyle='--', linewidth=1.5, label='_nolegend_')
        ax.tick_params(axis='x', rotation=30)

    fig.tight_layout()
    # chart_path = Config["REPO_OUTPUT_DIR"] / 'prediction_chart.png'
    # fig.savefig(chart_path, dpi=120)
    # plt.close(fig)
    # print(f"Chart saved to: {chart_path}")

    # Save plot to a BytesIO object and encode as base64
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=120)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    print("Chart generated and encoded to base64.")
    return img_base64


def main_task(model, symbol: str):
    """Executes one full update cycle for a given symbol."""
    print("\n" + "=" * 60 + f"\nStarting update task for {symbol} at {datetime.now(timezone.utc)}\n" + "=" * 60)
    df_full = fetch_binance_data(symbol)
    df_for_model = df_full.iloc[:-1]

    close_preds, volume_preds, v_close_preds = make_prediction(df_for_model, model)

    hist_df_for_plot = df_for_model.tail(Config["HIST_POINTS"])
    hist_df_for_metrics = df_for_model.tail(Config["VOL_WINDOW"])

    upside_prob, vol_amp_prob = calculate_metrics(hist_df_for_metrics, close_preds, v_close_preds)
    chart_base64 = create_plot(hist_df_for_plot, close_preds, volume_preds)

    # --- 新增的内存清理步骤 ---
    # 显式删除大的DataFrame对象，帮助垃圾回收器
    del df_full, df_for_model, close_preds, volume_preds, v_close_preds
    del hist_df_for_plot, hist_df_for_metrics

    # 强制执行垃圾回收
    gc.collect()
    # --- 内存清理结束 ---

    print("-" * 60 + "\n--- Task completed successfully ---\n" + "-" * 60 + "\n")
    return {
        "symbol": symbol,
        "name": Config["SYMBOL_NAMES"].get(symbol, symbol),
        "updated_at_utc": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC'),
        "direction": "Up" if upside_prob >= 0.5 else "Down",
        "upside_probability": f"{upside_prob:.1%}",
        "volatility_amplification_probability": f"{vol_amp_prob:.1%}",
        "chart_image_base64": chart_base64,
        "data_source": "Binance API"
    }


# Global variable to store the loaded model
# This ensures the model is loaded only once on cold start
_loaded_predictor = None

def generate_and_save_prediction_data():
    global _loaded_predictor

    # Load model only once
    if _loaded_predictor is None:
        model_path_obj = Path(Config["MODEL_PATH"])
        model_path_obj.mkdir(parents=True, exist_ok=True)
        _loaded_predictor = load_model()

    print("Executing main prediction task for data generation.")
    
    all_predictions = {}
    for symbol in Config["TARGET_SYMBOLS"]:
        prediction_data = main_task(_loaded_predictor, symbol)
        all_predictions[symbol] = prediction_data

    return all_predictions

if __name__ == '__main__':
    import json
    # For local testing, generate and save data
    data = generate_and_save_prediction_data()
    output_path = Path("web/public/predictions.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Prediction data saved to {output_path}")
