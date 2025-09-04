#!/usr/bin/env python3
"""
上传预测数据到Vercel Blob存储服务
"""
import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv
import vercel_blob.blob_store as vb_store

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PredictionUploader:
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
        # self.predictions_path = Path(os.path.dirname(__file__)) / '..' / 'web' / 'public' / 'predictions.json'
        
    def read_predictions(self) -> Dict[str, Any]:
        """读取预测数据文件"""
        try:
            # 尝试从history目录读取最新的文件
            if not self.history_dir.exists():
                logger.error(f"History directory not found at {self.history_dir}")
                return {}
            
            history_files = sorted(self.history_dir.glob('predictions_*.json'), reverse=True)
            if history_files:
                with open(history_files[0], 'r', encoding='utf-8') as f:
                    return json.load(f)
            
            logger.error(f"No predictions file found in history directory {self.history_dir}")
            return {}
            
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding predictions file: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error reading predictions file: {e}")
            return {}

    def upload_predictions(self) -> str:
        """上传预测数据到Vercel Blob存储"""
        try:
            predictions = self.read_predictions()
            if not predictions:
                logger.warning("No predictions data to upload")
                return ""

            # 生成带时间戳的文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"predictions_{timestamp}.json"
            
            # 将数据转换为bytes
            data = json.dumps(predictions, indent=2).encode('utf-8')
            
            # 上传到Vercel Blob存储
            logger.info(f"Uploading predictions to Vercel Blob Storage as {filename}")
            response = vb_store.put(
                filename,
                data,
                {
                    "access": "public",
                    "addRandomSuffix": "false"
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
