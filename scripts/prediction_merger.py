#!/usr/bin/env python3
"""
预测数据合并工具 -- 提供查找最新预测文件并合并的共享逻辑
供 update_local_data.py 和 upload_predictions.py 共同使用
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

HISTORY_DIR = Path(__file__).resolve().parent / 'history'

MARKET_TYPES = ('crypto', 'index')


def get_latest_file(pattern: str, history_dir: Path = HISTORY_DIR) -> Optional[Path]:
    """获取匹配模式的最新文件（按文件名中的时间戳排序）"""
    if not history_dir.exists():
        return None
    files = sorted(history_dir.glob(pattern), reverse=True)
    return files[0] if files else None


def read_json(file_path: Path) -> Dict[str, Any]:
    """读取 JSON 文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"读取文件失败 {file_path}: {e}")
        return {}


def merge_latest_predictions(history_dir: Path = HISTORY_DIR) -> Dict[str, Any]:
    """查找并合并所有市场最新的预测数据

    Returns:
        合并后的预测数据字典；若无任何可用数据则返回空字典
    """
    all_data: Dict[str, Any] = {}

    for market in MARKET_TYPES:
        latest = get_latest_file(f"predictions_{market}_*.json", history_dir)
        if latest:
            logger.info(f"合并 {market} 数据: {latest.name}")
            data = read_json(latest)
            all_data.update(data)
        else:
            logger.warning(f"未找到 {market} 市场的预测文件")

    return all_data
