#!/bin/bash

# 设置工作目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 确保数据目录存在
mkdir -p data

# 激活虚拟环境
source ../.venv/bin/activate

echo "开始执行数据更新和预测流程..."

# 第一步：获取数据
echo "步骤 1: 获取最新数据"
python fetch_data.py
if [ $? -ne 0 ]; then
    echo "数据获取失败，退出执行"
    exit 1
fi

# 第二步：生成预测
echo "步骤 2: 生成预测"
python predict.py
if [ $? -ne 0 ]; then
    echo "预测生成失败，退出执行"
    exit 1
fi

echo "所有任务执行完成"
