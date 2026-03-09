# Kronos 预测示例

本目录包含使用 [Kronos](https://huggingface.co/Kronos-Forecasting) 时序大模型进行 OHLCV K 线预测的完整示例脚本，适合快速上手与二次开发。

## 目录结构

```
examples/
├── prediction_example.py          # 含成交量特征的完整预测示例
├── prediction_wo_vol_example.py   # 仅价格特征（OHLC）的预测示例
├── data/
│   └── XSHG_5min_600977.csv       # 示例 A 股 5 分钟 K 线数据
└── my_kronos_cache/               # Hugging Face 模型缓存目录（首次运行自动创建）
```

## 环境准备

```bash
# 在项目根目录激活虚拟环境
source ../.venv/bin/activate

# 安装依赖（如未安装）
uv pip install -r ../requirements.txt
```

> 首次运行时，脚本会自动从 Hugging Face Hub 下载 `Kronos-Tokenizer-base` 和 `Kronos-small` 模型，需要网络连接。模型缓存后无需重复下载。

---

## prediction_example.py — 含成交量预测

演示使用完整 OHLCV 特征（open / high / low / close / volume / amount）进行时序预测。

**运行步骤：**

```bash
cd examples
python prediction_example.py
```

**主要流程：**

1. 从 Hugging Face Hub 加载 `Kronos-Tokenizer-base` 分词器与 `Kronos-small` 模型
2. 实例化 `KronosPredictor`
3. 从 `./data/XSHG_5min_600977.csv` 加载数据，选取 6 个特征列
4. 调用 `predictor.predict()` 生成未来 K 线预测
5. 绘制原始收盘价 vs 预测收盘价、原始成交量 vs 预测成交量的对比图

---

## prediction_wo_vol_example.py — 仅价格特征预测

演示仅使用 OHLC 价格特征（不含成交量）进行时序预测，适用于无成交量数据的场景。

**运行步骤：**

```bash
cd examples
python prediction_wo_vol_example.py
```

**主要流程：**

1. 从 Hugging Face Hub 加载 `Kronos-Tokenizer-base` 分词器与 `Kronos-small` 模型
2. 实例化 `KronosPredictor`
3. 从 `./data/XSHG_5min_600977.csv` 加载数据，选取 4 个价格特征列
4. 调用 `predictor.predict()` 生成预测
5. 绘制原始收盘价 vs 预测收盘价的对比图

---

## 数据格式说明

示例数据文件格式为 CSV，包含以下列：

| 列名 | 类型 | 说明 |
|------|------|------|
| `datetime` | string | 时间戳（如 `2024-01-02 09:30:00`） |
| `open` | float | 开盘价 |
| `high` | float | 最高价 |
| `low` | float | 最低价 |
| `close` | float | 收盘价 |
| `volume` | float | 成交量（可选） |
| `amount` | float | 成交额（可选） |

你可以替换为自己的 CSV 数据文件，只需确保包含上述列名即可。

---

## 自定义使用

```python
from model.kronos import KronosTokenizer, Kronos, KronosPredictor
from huggingface_hub import hf_hub_download
import pandas as pd
import torch

# 加载模型
tokenizer = KronosTokenizer.from_pretrained("Kronos-Forecasting/Kronos-Tokenizer-base")
model = Kronos.from_pretrained("Kronos-Forecasting/Kronos-small")
predictor = KronosPredictor(model=model, tokenizer=tokenizer)

# 准备数据（OHLCV DataFrame）
df = pd.read_csv("your_data.csv", index_col="datetime", parse_dates=True)
features = df[["open", "high", "low", "close", "volume"]].values

# 预测
predictions = predictor.predict(features)
```

---

## 参考资源

- [Kronos 模型主页（Hugging Face）](https://huggingface.co/Kronos-Forecasting)
- [k-online 项目主页](../README.md)
- [完整预测流水线](../scripts/)
