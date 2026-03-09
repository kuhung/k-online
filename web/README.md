# K-Online 前端 — 金融预测可视化平台

基于 React 18 + TypeScript + Vite 构建的现代化 K 线预测展示平台，支持加密货币与 A 股指数的交互式图表展示。

## 功能特性

- 多标的切换：一键查看不同加密货币或 A 股指数的预测结果
- 交互式 K 线图：基于 ECharts 的完整 OHLCV 图表，支持缩放与悬浮提示
- 预测统计面板：涨跌方向准确率、波动放大概率等核心指标
- 实时数据刷新：通过 Vercel Blob 获取最新预测数据
- 响应式设计：完整适配桌面与移动端
- TypeScript 全覆盖：严格类型检查，保障代码健壮性

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 |
| 语言 | TypeScript 5 |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 路由 | React Router v6 |
| 图表 | ECharts + echarts-for-react |
| 图标 | Lucide React |
| 部署 | Vercel（Serverless + Edge） |

## 项目结构

```
web/
├── api/
│   └── get-latest-prediction-url.ts  # Vercel Serverless Function，从 Blob 获取最新预测 URL
├── public/
│   └── predictions.json              # 本地开发用预测数据
├── src/
│   ├── main.tsx                      # 应用入口
│   ├── App.tsx                       # 根组件与路由
│   ├── index.css                     # 全局样式
│   ├── components/                   # UI 组件
│   │   ├── Dashboard.tsx             # 主仪表板
│   │   ├── DashboardHeader.tsx       # 顶部头部栏
│   │   ├── MainContent.tsx           # 主内容区域
│   │   ├── StockSelector.tsx         # 标的选择器
│   │   ├── PredictionDetail.tsx      # 预测详情卡片
│   │   ├── ChartDisplay.tsx          # 图表容器
│   │   ├── CandlestickChart.tsx      # K 线图组件
│   │   ├── StatsPanel.tsx            # 统计数据面板
│   │   ├── Layout.tsx                # 页面布局
│   │   ├── ErrorMessage.tsx          # 错误提示
│   │   ├── LoadingSpinner.tsx        # 加载动画
│   │   ├── SkeletonLoader.tsx        # 骨架屏
│   │   └── Tooltip.tsx               # 工具提示
│   ├── hooks/
│   │   └── usePredictions.ts         # 预测数据获取 Hook
│   ├── services/
│   │   └── api.ts                    # API 请求封装
│   ├── store/
│   │   └── index.ts                  # Zustand 全局状态
│   ├── types/
│   │   ├── index.ts                  # 核心类型定义
│   │   └── chart-data.ts             # 图表数据类型
│   └── utils/
│       └── index.ts                  # 工具函数
├── package.json
├── vite.config.ts                    # Vite 配置（含开发代理）
├── tsconfig.json
├── tailwind.config.js
└── deploy.sh                         # 一键部署脚本
```

## 开发指南

### 环境要求

- Node.js >= 18
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

开发模式下，Vite 代理会拦截 `/api/get-latest-prediction-url` 请求，直接返回 `public/predictions.json` 的路径，无需配置 Vercel 环境。

### 构建生产版本

```bash
npm run build
```

构建产物输出至 `dist/` 目录。

### 代码检查

```bash
npm run lint
```

## 数据格式

`predictions.json` 的顶层为标的代码到预测对象的映射：

```json
{
  "BTCUSDT": {
    "name": "BTC/USDT",
    "updated_at_utc": "2026-03-09T00:00:00Z",
    "predicted_close": 85000.00,
    "actual_close": 84500.00,
    "direction": "Up",
    "upside_probability": "72%",
    "volatility_amplification_probability": "58%",
    "chart_image_base64": "base64编码的图片数据（可选）",
    "data_source": "BTCUSDT_1h.csv"
  },
  "000001.SH": {
    "name": "上证指数",
    "updated_at_utc": "2026-03-09T00:00:00Z",
    "predicted_close": 3320.50,
    "actual_close": 3305.20,
    "direction": "Up",
    "upside_probability": "65%",
    "volatility_amplification_probability": "45%",
    "data_source": "000001.SH_15min.csv"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 标的显示名称 |
| `updated_at_utc` | string | 预测更新时间（UTC ISO 8601） |
| `predicted_close` | number | 模型预测收盘价 |
| `actual_close` | number | 实际收盘价（回测时使用） |
| `direction` | `"Up" \| "Down"` | 预测涨跌方向 |
| `upside_probability` | string | 上涨概率（百分比字符串） |
| `volatility_amplification_probability` | string | 波动放大概率 |
| `chart_image_base64` | string（可选） | Base64 编码的图表图片 |
| `data_source` | string | 原始数据文件名 |

## Vercel 部署说明

1. 将 `web/` 目录关联到 Vercel 项目（根目录设置为 `web`）
2. 在 Vercel 项目环境变量中添加 `BLOB_READ_WRITE_TOKEN`
3. `api/get-latest-prediction-url.ts` 会自动作为 Serverless Function 部署

## 作者

- 昵称：kuhung
- 邮箱：hi@kuhung.me

## 许可证

MIT License
