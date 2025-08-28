# K-Online 股票预测平台前端

基于 React + TypeScript + Vite 构建的现代化股票预测展示平台。

## 功能特性

- 📊 多标的股票预测数据展示
- 📈 交互式图表查看
- 📱 响应式设计，支持移动端
- 🎨 现代化 UI 设计
- ⚡ 快速开发和构建
- 🔄 实时数据刷新
- 🎯 TypeScript 类型安全

## 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router
- **图标**: Lucide React

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Dashboard.tsx    # 主仪表板
│   ├── StockSelector.tsx # 股票选择器
│   ├── PredictionDetail.tsx # 预测详情
│   ├── ChartDisplay.tsx # 图表展示
│   └── ...
├── hooks/              # 自定义 Hooks
├── services/           # API 服务
├── store/              # 状态管理
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── assets/             # 静态资源
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

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 数据格式

预测数据应该放在 `public/predictions.json` 文件中，格式如下：

```json
{
  "股票代码": {
    "name": "股票名称",
    "updated_at_utc": "2025-01-08T10:30:00Z",
    "predicted_close": 15.23,
    "actual_close": 14.98,
    "direction": "Up",
    "upside_probability": "75%",
    "volatility_amplification_probability": "60%",
    "chart_image_base64": "base64编码的图片数据",
    "data_source": "数据源文件名"
  }
}
```

## 部署说明

1. 构建生产版本：`npm run build`
2. 将 `dist` 目录的内容部署到 Web 服务器
3. 确保预测数据文件 `predictions.json` 可以通过 HTTP 访问

## 作者

kuhung <hi@kuhung.me>

## 许可证

MIT License
