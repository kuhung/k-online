#!/usr/bin/env python3
"""
将最新的预测数据合并并更新到前端 public 目录
"""
import json
import logging
from pathlib import Path

from prediction_merger import merge_latest_predictions

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

FRONTEND_FILE = Path(__file__).resolve().parent.parent / 'web' / 'public' / 'predictions.json'


def update():
    logger.info("开始更新本地前端数据...")

    all_data = merge_latest_predictions()
    if not all_data:
        logger.warning("未找到任何预测历史文件，跳过更新")
        return

    try:
        FRONTEND_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(FRONTEND_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        logger.info(f"成功更新前端数据: {FRONTEND_FILE}")
    except Exception as e:
        logger.error(f"写入前端文件失败: {e}")
        raise


if __name__ == "__main__":
    update()
