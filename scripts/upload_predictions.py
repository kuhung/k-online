#!/usr/bin/env python3
"""
上传预测数据到 Vercel Blob 存储服务
"""
import os
import json
import logging
from dotenv import load_dotenv
import vercel_blob.blob_store as vb_store

from prediction_merger import merge_latest_predictions

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BLOB_FILENAME = "prediction_latest.json"


class PredictionUploader:

    def __init__(self):
        load_dotenv()
        self.token = os.getenv('BLOB_READ_WRITE_TOKEN')
        if not self.token:
            raise ValueError("BLOB_READ_WRITE_TOKEN not found in environment variables")
        os.environ['BLOB_READ_WRITE_TOKEN'] = self.token

    def upload(self) -> str:
        """合并并上传预测数据到 Vercel Blob"""
        predictions = merge_latest_predictions()
        if not predictions:
            logger.warning("No predictions data to upload")
            return ""

        data = json.dumps(predictions, indent=2, ensure_ascii=False).encode('utf-8')

        logger.info(f"Uploading predictions to Vercel Blob as {BLOB_FILENAME}")
        response = vb_store.put(
            BLOB_FILENAME,
            data,
            {
                "access": "public",
                "addRandomSuffix": False,
                "allowOverwrite": True,
            }
        )

        logger.info(f"Upload successful. URL: {response['url']}")
        return response['url']


def main():
    try:
        uploader = PredictionUploader()
        url = uploader.upload()
        if url:
            logger.info(f"Successfully uploaded predictions to: {url}")
        else:
            logger.warning("No predictions were uploaded")
    except Exception as e:
        logger.error(f"Failed to upload predictions: {e}")
        raise


if __name__ == "__main__":
    main()
