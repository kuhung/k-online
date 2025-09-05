#!/usr/bin/env python3
"""
上传预测数据到Vercel Blob存储服务
"""
import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from dotenv import load_dotenv
import vercel_blob.blob_store as vb_store

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PredictionUploader:
    """预测数据上传器"""
    
    def __init__(self):
        # 加载环境变量
        load_dotenv()
        self.token = os.getenv('BLOB_READ_WRITE_TOKEN')
        if not self.token:
            raise ValueError("BLOB_READ_WRITE_TOKEN not found in environment variables")
        
        # 设置Vercel Blob存储的token
        os.environ['BLOB_READ_WRITE_TOKEN'] = self.token
        
        # 预测数据文件路径
        self.history_dir = Path(os.path.dirname(__file__)) / 'history'
    
    def read_latest_predictions(self, market_type: str = None) -> Dict[str, Any]:
        """读取最新的预测数据文件"""
        try:
            if not self.history_dir.exists():
                logger.error(f"History directory not found at {self.history_dir}")
                return {}
            
            # 获取所有预测文件
            pattern = f"predictions_{market_type}_*.json" if market_type else "predictions_*.json"
            history_files = sorted(self.history_dir.glob(pattern), reverse=True)
            
            if not history_files:
                logger.error(f"No predictions file found in history directory {self.history_dir}")
                return {}
            
            # 读取最新的预测文件
            latest_file = history_files[0]
            with open(latest_file, 'r', encoding='utf-8') as f:
                predictions = json.load(f)
            
            logger.info(f"读取预测数据: {latest_file}")
            return predictions
            
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding predictions file: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error reading predictions file: {e}")
            return {}
    
    def merge_predictions(self) -> Dict[str, Any]:
        """合并所有市场的预测数据"""
        all_predictions = {}
        
        # 读取加密货币市场预测
        crypto_predictions = self.read_latest_predictions('crypto')
        if crypto_predictions:
            all_predictions.update(crypto_predictions)
        
        # 读取A股指数市场预测
        index_predictions = self.read_latest_predictions('index')
        if index_predictions:
            all_predictions.update(index_predictions)
        
        return all_predictions
    
    def upload_predictions(self) -> str:
        """上传预测数据到Vercel Blob存储"""
        try:
            # 合并所有市场的预测
            predictions = self.merge_predictions()
            if not predictions:
                logger.warning("No predictions data to upload")
                return ""
            
            # 生成文件名
            filename = "prediction_latest.json"
            
            # 将数据转换为bytes
            data = json.dumps(predictions, indent=2, ensure_ascii=False).encode('utf-8')
            
            # 上传到Vercel Blob存储
            logger.info(f"Uploading predictions to Vercel Blob Storage as {filename}")
            response = vb_store.put(
                filename,
                data,
                {
                    "access": "public",
                    "addRandomSuffix": "True",
                    "allowOverwrite": True
                }
            )
            
            logger.info(f"Upload successful. URL: {response['url']}")
            return response['url']
            
        except Exception as e:
            logger.error(f"Error uploading predictions: {e}")
            raise

def main():
    try:
        uploader = PredictionUploader()
        url = uploader.upload_predictions()
        if url:
            print(f"Successfully uploaded predictions to: {url}")
        else:
            print("No predictions were uploaded")
    except Exception as e:
        logger.error(f"Failed to upload predictions: {e}")
        raise

if __name__ == "__main__":
    main()