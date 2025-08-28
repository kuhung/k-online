# k-online

在线K线预测系统

## 项目简介

k-online 是一个在线K线预测系统。它通过一个周期性任务自动化获取市场数据，运用预测模型进行分析预测，并将最新的预测结果存储为静态文件。前端Web用户界面直接加载这些静态预测数据进行展示。本项目旨在提供一个高效且易于部署的解决方案，实现K线走势的周期性监控与预测。

## 系统架构

本系统主要由以下几个核心模块组成：

1. **数据生成模块 (`scripts`)**:

   * **功能**: 负责定时从指定数据源获取K线数据，并利用预设的机器学习或深度学习模型对未来的K线走势进行预测。计算相关指标并生成预测图表（Base64编码）。
   * **实现**: `scripts/generate_prediction_data.py` 脚本负责数据的抓取、预处理、模型推理、指标计算和图表生成。预测结果（包括指标和Base64编码的图表）会被保存到 `web/public/latest_prediction.json` 文件中。

2. **Web 用户界面模块 (`web`)**:

   * **功能**: 提供一个基于Web的交互式界面，用于展示最新的K线预测结果。
   * **实现**: `web` 目录包含静态HTML文件 (`index.html`) 和 JavaScript 文件 (`web/public/script.js`)。前端脚本会直接异步请求 `web/public/latest_prediction.json` 文件来获取最新的预测数据，并动态地将数据和图表渲染到页面上。

### 工作流程

1. **周期性任务**: 外部调度系统（例如 Cron Job）会定时触发 `scripts/generate_prediction_data.py` 脚本。
2. **数据获取**: 脚本运行，连接数据源（如 Binance API），获取最新的K线数据。
3. **模型预测与指标计算**: 获取到的数据经过预处理后，输入到预测模型中生成预测结果，并计算如“上涨概率”和“波动放大概率”等关键指标。
4. **图表生成**: 根据历史数据和预测结果生成Base64编码的预测图表。
5. **结果存储**: 所有预测结果（指标、Base64图表、更新时间戳）以 JSON 格式保存到 `web/public/latest_prediction.json` 文件中，覆盖旧的预测。
6. **前端展示**: 用户通过浏览器访问Web界面，`web/public/script.js` 会自动加载 `web/public/latest_prediction.json` 文件，并展示最新的预测数据和图表。

```mermaid
graph TD;
    A[周期性任务/调度器] --> B(scripts/generate_prediction_data.py);
    B --> C{数据获取};
    C --> D[数据预处理];
    D --> E[预测模型推理];
    E --> F[指标计算];
    F --> G[图表生成 (Base64)];
    G --> H[保存至 web/public/latest_prediction.json];
    H --> I[Web前端 (index.html)];
    I --> J{加载 latest_prediction.json};
    J --> K[展示预测结果];
```

## 模块说明

### `scripts/` 目录

该目录包含用于数据获取和模型预测的脚本，具体功能请参考上方的“系统架构”部分。

* `data/`: 存放示例K线数据，例如 `XSHG_5min_600977.csv`。
* `generate_prediction_data.py`: 负责定时从数据源获取数据、进行模型预测、计算指标并生成图表，最终将结果保存为 `web/public/latest_prediction.json`。
* `prediction_example.py`: 示例预测脚本，演示如何获取数据并进行预测。
* `prediction_wo_vol_example.py`: 另一个预测脚本示例，可能用于不包含交易量的预测场景。

### `web/` 目录

该目录包含Web用户界面的实现，具体功能请参考上方的“系统架构”部分。

* `index.html`: Web应用程序的主文件，用于展示K线图和预测结果。
* `public/`:
    * `img/`:
        * `logo.png`: 项目Logo图片。
    * `script.js`: 前端JavaScript文件，负责加载 `latest_prediction.json` 并动态渲染预测数据和图表。
    * `style.css`: 前端样式文件。
    * `latest_prediction.json`: 存储 `scripts/generate_prediction_data.py` 生成的最新预测结果文件（JSON格式）。

## 安装与运行

### 环境准备
1.  **Python 环境**: 确保您的系统已安装 Python 3.8 或更高版本。
2.  **创建并激活虚拟环境**: 为了管理项目依赖，建议您为本项目创建一个独立的 Python 虚拟环境。
    ```bash
    # 在项目根目录创建虚拟环境，指定Python 3.12
    uv venv --python 3.12
    # 激活虚拟环境 (macOS/Linux)
    source .venv/bin/activate
    # 激活虚拟环境 (Windows)
    # .venv\Scripts\activate
    ```

### 依赖安装

激活虚拟环境后，安装项目所需的依赖。

```bash
# 安装 uv (如果尚未安装)
# pip install uv

# 安装所有依赖
uv pip install -r requirements.txt

# 如果 `examples` 目录下有独立的 `requirements.txt`，也需要安装
# uv pip install -r examples/requirements.txt
```

### 启动预测数据生成

数据生成脚本可以通过运行 `scripts/generate_prediction_data.py` 来执行。为了实现定时预测数据更新，建议您配置一个定时任务（如 Linux 的 Cron Job 或 Windows 的任务计划程序，或者 Vercel Serverless Functions 的 Cron Job 功能）来定期执行该脚本。

```bash
# 激活虚拟环境
source .venv/bin/activate
# 运行预测数据生成脚本 (在项目根目录执行)
python scripts/generate_prediction_data.py
```

**注意**: 预测结果将保存到 `web/public/latest_prediction.json` 文件。请确保该目录存在且可写。

### 启动Web UI

Web UI 是一个静态页面，无需启动额外的Web服务器。您只需将 `web` 目录下的所有内容（包括 `index.html` 和 `public` 目录）部署到静态文件托管服务（如 Vercel, Netlify, GitHub Pages 等）即可。

部署后，通过浏览器访问您部署的URL即可查看K线预测结果。

## 联系方式

昵称: kuhung
邮箱: hi@kuhung.me
时间: 2025年

## 许可证

本项目采用 MIT 许可证。详见 `LICENSE` 文件。
