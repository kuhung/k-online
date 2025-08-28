#!/bin/bash

# K-Online Web 部署脚本
# 作者: kuhung <hi@kuhung.me>

set -e

echo "🚀 开始部署 K-Online Web 应用..."

# 安装依赖
echo "📦 安装依赖..."
npm install

# 运行代码检查
echo "🔍 运行代码检查..."
npm run lint

# 构建生产版本
echo "🔨 构建生产版本..."
npm run build

echo "✅ 部署准备完成！"
echo "📁 构建文件位于: ./dist"
echo "🌐 请将 dist 目录的内容部署到 Web 服务器"
echo ""
echo "💡 本地预览命令:"
echo "   npm run preview"
echo ""
echo "📖 更多信息请查看 README.md"
