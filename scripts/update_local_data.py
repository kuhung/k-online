#!/usr/bin/env python3
"""
将最新的预测数据合并并更新到前端 public 目录
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LocalDataUpdater:
    def __init__(self):
        self.script_dir = Path(__file__).resolve().parent
        self.history_dir = self.script_dir / 'history'
        self.frontend_file = self.script_dir.parent / 'web' / 'public' / 'predictions.json'
    
    def get_latest_file(self, pattern: str) -> Path:
        """获取匹配模式的最新文件"""
        if not self.history_dir.exists():
            return None
            
        files = sorted(self.history_dir.glob(pattern), reverse=True)
        return files[0] if files else None

    def read_json(self, file_path: Path) -> Dict[str, Any]:
        """读取 JSON 文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"读取文件失败 {file_path}: {e}")
            return {}

    def update(self):
        """执行更新"""
        logger.info("开始更新本地前端数据...")
        
        # 获取最新的预测文件
        latest_crypto = self.get_latest_file("predictions_crypto_*.json")
        latest_index = self.get_latest_file("predictions_index_*.json")
        
        if not latest_crypto and not latest_index:
            logger.warning("未找到任何预测历史文件")
            return

        all_data = {}
        
        # 合并 Crypto 数据
        if latest_crypto:
            logger.info(f"合并 Crypto 数据: {latest_crypto.name}")
            crypto_data = self.read_json(latest_crypto)
            all_data.update(crypto_data)
            
        # 合并 Index 数据
        if latest_index:
            logger.info(f"合并 Index 数据: {latest_index.name}")
            index_data = self.read_json(latest_index)
            all_data.update(index_data)
            
        # 写入前端文件
        try:
            # 确保目录存在
            self.frontend_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(self.frontend_file, 'w', encoding='utf-8') as f:
                json.dump(all_data, f, indent=2, ensure_ascii=False)
                
            logger.info(f"成功更新前端数据: {self.frontend_file}")
            
        except Exception as e:
            logger.error(f"写入前端文件失败: {e}")
            raise

if __name__ == "__main__":
    updater = LocalDataUpdater()
    updater.update()
