# 贡献指南

感谢你对 k-online 的关注！欢迎任何形式的贡献，包括但不限于：Bug 修复、功能新增、文档改善、测试完善。

## 开始之前

1. 请先阅读 [README.md](README.md) 了解项目整体结构
2. 检查 [Issues](https://github.com/kuhung/k-online/issues) 确认问题是否已存在或被讨论
3. 对于较大的功能变更，建议先开 Issue 讨论方案，避免重复劳动

## 开发环境搭建

### Python 环境

```bash
git clone https://github.com/kuhung/k-online.git
cd k-online

# 创建虚拟环境（使用 uv）
uv venv
source .venv/bin/activate

# 安装依赖
uv pip install -r requirements.txt
```

### 前端环境

```bash
cd web
npm install
npm run dev
```

## 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范。

### 提交类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档修改 |
| `style` | 代码格式调整（不影响逻辑） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |

### 示例

```
feat: 新增 yfinance 美股数据源支持
fix: 修复加密货币数据抓取在断网时的重试逻辑
docs: 补充 run.sh 参数说明
```

## Pull Request 流程

1. Fork 本仓库并创建特性分支：
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. 完成开发后，确保代码通过 Lint 检查：
   ```bash
   # Python
   # 确保 scripts/ 和 model/ 目录下无明显语法错误

   # 前端
   cd web && npm run lint
   ```

3. 提交代码并推送：
   ```bash
   git add .
   git commit -m "feat: 你的功能描述"
   git push origin feat/your-feature-name
   ```

4. 在 GitHub 上创建 Pull Request，填写：
   - 变更内容说明
   - 相关 Issue 编号（如有）
   - 测试方式

## 常见贡献方向

### 新增数据源

数据抓取模块位于 `scripts/`，继承 `DataFetcher` 基类即可：

```python
# scripts/your_fetcher.py
from data_fetcher import DataFetcher

class YourFetcher(DataFetcher):
    def fetch(self, symbol: str, interval: str) -> pd.DataFrame:
        # 实现数据获取逻辑
        ...
```

### 新增预测标的

在 `scripts/predict.py` 中的标的列表新增对应配置，并确保数据源已就绪。

### 前端功能

前端组件位于 `web/src/components/`，新增组件请遵循现有的 TypeScript 类型规范，并在 `web/src/components/index.ts` 中导出。

## 问题反馈

- Bug 报告：请使用 [Issue 模板](https://github.com/kuhung/k-online/issues/new)，附上复现步骤与环境信息
- 功能建议：欢迎在 Issues 中描述使用场景与期望行为
- 直接联系：hi@kuhung.me

## 行为准则

请保持友善、尊重的交流态度。本项目欢迎来自不同背景的贡献者。
