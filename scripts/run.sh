#!/bin/bash

# 设置工作目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 确保数据目录存在
mkdir -p data

# 激活虚拟环境
source ../.venv/bin/activate

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  -m, --market    市场类型 (crypto 或 index 或 all)"
    echo "  -i, --interval  时间间隔"
    echo "                  crypto: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M"
    echo "                  index: 1,5,15,30,60"
    echo "  -u, --upload    上传预测结果到Blob存储"
    echo "  -U, --upload-only 仅上传已有的预测结果，不进行数据获取和预测"
    echo "  -s, --skip-fetch 跳过数据获取步骤，直接使用已有数据进行预测"
    echo "  -h, --help      显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 -m all                 # 更新所有市场数据"
    echo "  $0 -m all -u              # 更新所有市场数据并上传"
    echo "  $0 -m crypto -i 1h        # 仅更新加密货币数据"
    echo "  $0 -m index -i 60         # 仅更新A股指数数据"
    echo "  $0 -m crypto -u           # 更新加密货币数据并上传"
    echo "  $0 -m all -s              # 使用现有数据重新生成所有预测"
    echo "  $0 -m crypto -s -u        # 使用现有数据重新生成加密货币预测并上传"
    echo "  $0 -U                     # 仅上传已有的预测结果"
    echo
    echo "注意: 建议使用 -m all 确保所有市场数据同步更新"
}

# 解析命令行参数
MARKET=""
INTERVAL=""
UPLOAD=false
UPLOAD_ONLY=false
SKIP_FETCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--market)
            MARKET="$2"
            shift 2
            ;;
        -i|--interval)
            INTERVAL="$2"
            shift 2
            ;;
        -u|--upload)
            UPLOAD=true
            shift
            ;;
        -U|--upload-only)
            UPLOAD_ONLY=true
            shift
            ;;
        -s|--skip-fetch)
            SKIP_FETCH=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "错误: 未知选项 $1"
            show_help
            exit 1
            ;;
    esac
done

# 验证参数
if [[ "$UPLOAD_ONLY" == "false" ]]; then
    # 只有在非upload-only模式下才检查市场参数
    if [[ -z "$MARKET" ]]; then
        echo "错误: 必须指定市场类型 (-m crypto 或 -m index 或 -m all)"
        show_help
        exit 1
    fi

    if [[ "$MARKET" != "crypto" && "$MARKET" != "index" && "$MARKET" != "all" ]]; then
        echo "错误: 市场类型必须是 crypto、index 或 all"
        show_help
        exit 1
    fi
fi

# 如果指定了上传但不是all模式，给出警告
if [[ "$UPLOAD" == "true" && "$MARKET" != "all" ]]; then
    echo "警告: 建议使用 -m all 确保所有市场数据同步更新后再上传"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 处理加密货币市场
process_crypto() {
    local interval="${1:-1h}"
    echo "处理加密货币市场 (间隔: $interval)..."
    
    if [[ "$SKIP_FETCH" == "false" ]]; then
        echo "获取加密货币数据..."
        python fetch_data.py --interval "$interval"
        if [ $? -ne 0 ]; then
            echo "加密货币数据获取失败"
            return 1
        fi
    else
        echo "跳过数据获取步骤..."
    fi
    
    echo "生成加密货币预测..."
    python predict.py --market crypto --interval "$interval"
    if [ $? -ne 0 ]; then
        echo "加密货币预测失败"
        return 1
    fi
    return 0
}

# 处理A股指数市场
process_index() {
    local interval="${1:-15}"
    echo "处理A股指数市场 (间隔: $interval)..."
    
    if [[ "$SKIP_FETCH" == "false" ]]; then
        echo "获取A股指数数据..."
        python fetch_data_index.py --period "$interval"
        if [ $? -ne 0 ]; then
            echo "A股指数数据获取失败"
            return 1
        fi
    else
        echo "跳过数据获取步骤..."
    fi
    
    echo "生成A股指数预测..."
    python predict.py --market index --interval "$interval"
    if [ $? -ne 0 ]; then
        echo "A股指数预测失败"
        return 1
    fi
    return 0
}

# 主处理逻辑
if [[ "$UPLOAD_ONLY" == "true" ]]; then
    echo "仅执行数据上传流程..."
    python upload_predictions.py
    if [ $? -ne 0 ]; then
        echo "数据上传失败"
        exit 1
    fi
else
    echo "开始执行数据更新和预测流程..."

    if [[ "$MARKET" == "all" || "$MARKET" == "crypto" ]]; then
        crypto_interval="${INTERVAL:-1h}"
        process_crypto "$crypto_interval" || exit 1
    fi

    if [[ "$MARKET" == "all" || "$MARKET" == "index" ]]; then
        index_interval="${INTERVAL:-60}"
        process_index "$index_interval" || exit 1
    fi

    # 只有在指定了-u选项时才上传
    if [[ "$UPLOAD" == "true" ]]; then
        echo "步骤 3: 上传预测数据到Vercel Blob存储"
        python upload_predictions.py
        if [ $? -ne 0 ]; then
            echo "数据上传失败"
            exit 1
        fi
    fi
fi

echo "所有任务执行完成"