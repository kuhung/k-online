# Examples

此目录包含使用 Kronos 模型进行时间序列预测的示例脚本。

## prediction_example.py

此脚本演示了如何使用 Kronos 模型进行包含 "open", "high", "low", "close", "volume", "amount" 等多个特征的时间序列预测。它展示了加载预训练模型、准备输入数据、执行预测以及可视化收盘价和交易量预测结果的完整流程。

**主要步骤:**
1.  **加载模型和分词器:** 从 Hugging Face Hub 加载 `Kronos-Tokenizer-base` 分词器和 `Kronos-small` 模型。
2.  **实例化预测器:** 使用加载的模型和分词器实例化 `KronosPredictor`。
3.  **数据准备:** 从 `./data/XSHG_5min_600977.csv` 加载数据，并选择包含 "open", "high", "low", "close", "volume", "amount" 的特征。
4.  **进行预测:** 使用 `predictor.predict` 方法对未来数据进行预测。
5.  **可视化结果:** 绘制原始收盘价、预测收盘价、原始交易量和预测交易量的对比图。

**运行方式:**
```bash
python prediction_example.py
```

## prediction_wo_vol_example.py

此脚本演示了如何使用 Kronos 模型进行不包含交易量特征的时间序列预测，仅使用 "open", "high", "low", "close" 等价格特征。它展示了加载预训练模型、准备输入数据、执行预测以及可视化收盘价预测结果的流程。

**主要步骤:**
1.  **加载模型和分词器:** 从 Hugging Face Hub 加载 `Kronos-Tokenizer-base` 分词器和 `Kronos-small` 模型。
2.  **实例化预测器:** 使用加载的模型和分词器实例化 `KronosPredictor`。
3.  **数据准备:** 从 `./data/XSHG_5min_600977.csv` 加载数据，并选择包含 "open", "high", "low", "close" 的特征。
4.  **进行预测:** 使用 `predictor.predict` 方法对未来数据进行预测。
5.  **可视化结果:** 绘制原始收盘价和预测收盘价的对比图。

**运行方式:**
```bash
python prediction_wo_vol_example.py
```
