#!/usr/bin/env python3
"""
市场预测器基类
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
import pytz
from pathlib import Path
import pandas as pd
from typing import Dict, Any, Tuple, Optional
import numpy as np
import torch
import logging
import io
import base64
import matplotlib.pyplot as plt
from model import KronosTokenizer, Kronos, KronosPredictor
from model.chart_data_generator import ChartDataGenerator

logger = logging.getLogger(__name__)

class MarketPredictor(ABC):
    """市场预测器基类"""
    
    def __init__(self, model_path: str, interval: str):
        self.model_path = Path(model_path)
        self.interval = interval
        self._predictor = None
        self.chart_data_generator = ChartDataGenerator(interval)
    
    @property
    def predictor(self) -> KronosPredictor:
        """懒加载预测器"""
        if self._predictor is None:
            self._predictor = self._load_model()
        return self._predictor
    
    def _load_model(self) -> KronosPredictor:
        """加载Kronos模型"""
        logger.info("加载 Kronos 模型...")
        try:
            # 尝试从本地缓存加载
            cache_dir = self.model_path
            tokenizer_path = cache_dir / "models--NeoQuasar--Kronos-Tokenizer-base/snapshots/f6c7de7b0490e422fde7a44bc73369e07115c445"
            model_path = cache_dir / "models--NeoQuasar--Kronos-small/snapshots/12b79908b3a9bef41ad5db0e01746f9a2fd2d882"
            
            logger.info(f"从 {tokenizer_path} 加载分词器")
            tokenizer = KronosTokenizer.from_pretrained(tokenizer_path)
            logger.info(f"从 {model_path} 加载模型")
            model = Kronos.from_pretrained(model_path)
        except Exception as e:
            logger.error(f"从缓存加载失败: {e}")
            logger.info("尝试从 Hugging Face 下载...")
            tokenizer = KronosTokenizer.from_pretrained(
                "NeoQuasar/Kronos-Tokenizer-base",
                cache_dir=self.model_path
            )
            model = Kronos.from_pretrained(
                "NeoQuasar/Kronos-small",
                cache_dir=self.model_path
            )
        
        tokenizer.eval()
        model.eval()
        predictor = KronosPredictor(
            model, tokenizer,
            device="cuda" if torch.cuda.is_available() else "cpu",
            max_context=512
        )
        logger.info("模型加载成功")
        return predictor
    
    @abstractmethod
    def get_prediction_horizon(self) -> int:
        """获取预测周期"""
        pass
    
    @abstractmethod
    def get_vol_window(self) -> int:
        """获取波动率窗口大小"""
        pass
    
    @abstractmethod
    def get_hist_points(self) -> int:
        """获取历史数据点数"""
        pass
    
    @abstractmethod
    def get_market_hours(self) -> Tuple[datetime, datetime]:
        """获取市场交易时间"""
        pass
    
    def make_prediction(self, df: pd.DataFrame, symbol: str, include_chart_image: bool = False) -> Dict[str, Any]:
        """生成回测结果"""
        try:
            # 过滤数据，确保只包含交易时间的数据
            df_filtered = self._filter_trading_hours(df)
            
            # 回测模式：预留验证数据
            validation_window = self.get_validation_window()
            total_data_needed = self.get_hist_points() + self.get_vol_window() + validation_window
            
            if len(df_filtered) < total_data_needed:
                raise ValueError(f"数据不足，需要至少 {total_data_needed} 个数据点，实际只有 {len(df_filtered)} 个")
            
            # 分割数据：训练数据 + 验证数据
            training_df = df_filtered.iloc[:-validation_window]
            validation_df = df_filtered.iloc[-validation_window:]
            
            # 准备训练数据
            df_for_model = training_df.tail(self.get_hist_points() + self.get_vol_window())
            hist_df_for_plot = df_for_model.tail(self.get_hist_points())
            hist_df_for_metrics = df_for_model.tail(self.get_vol_window())
            
            # 生成预测
            close_preds, volume_preds, close_preds_volatility = self._generate_predictions(df_for_model)
            
            # 计算指标（基于训练数据）
            upside_prob, vol_amp_prob = self._calculate_metrics(
                hist_df_for_metrics,
                close_preds,
                close_preds_volatility
            )
            
            # 计算回测准确率
            backtest_accuracy = self._calculate_backtest_accuracy(
                training_df.iloc[-1]['close'],  # 最后一个训练数据的价格
                validation_df,
                upside_prob >= 0.5
            )
            
            # 生成结构化图表数据（包含验证数据）
            last_timestamp = df_for_model['timestamps'].max()
            prediction_timestamps = self._generate_prediction_timestamps(last_timestamp)
            chart_data = self.chart_data_generator.generate_chart_data(
                hist_df_for_plot,
                close_preds,
                volume_preds,
                symbol,
                last_timestamp,
                self.get_prediction_horizon(),
                self.get_data_source(),
                prediction_timestamps,
                validation_df  # 传入验证数据
            )
            
            # 构建基本返回结果
            result = {
                "symbol": symbol,
                "market_type": self.get_market_type(),
                "updated_at_utc": datetime.now(pytz.utc).isoformat() + 'Z', # Store as ISO 8601 UTC time
                "direction": "Up" if upside_prob >= 0.5 else "Down",
                "upside_probability": f"{upside_prob:.1%}",
                "volatility_amplification_probability": f"{vol_amp_prob:.1%}",
                "backtest_accuracy": f"{backtest_accuracy:.1f}%",
                "data_source": self.get_data_source(),
                "chart_data": chart_data,
                "mode": "backtest"
            }
            
            # 可选生成图表图片（向后兼容）
            if include_chart_image:
                chart_base64 = self._create_plot(hist_df_for_plot, close_preds, volume_preds, symbol)
                result["chart_image_base64"] = chart_base64
            
            return result
        
        except Exception as e:
            logger.error(f"生成回测时出错: {e}")
            return None
    
    def _generate_predictions(
        self,
        df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """生成预测数据"""
        last_timestamp = df['timestamps'].max()
        
        # 生成预测时间序列
        new_timestamps_index = self._generate_prediction_timestamps(last_timestamp)
        y_timestamp = pd.Series(new_timestamps_index, name='y_timestamp')
        x_timestamp = df['timestamps']
        x_df = df[['open', 'high', 'low', 'close', 'volume', 'amount']]
        
        with torch.no_grad():
            logger.info("生成主要预测 (T=1.0)...")
            all_preds_main = self.predictor.predict(
                df=x_df,
                x_timestamp=x_timestamp,
                y_timestamp=y_timestamp,
                pred_len=self.get_prediction_horizon(),
                T=1.0,
                top_p=0.95,
                sample_count=50,
                verbose=True
            )
            close_preds_main, volume_preds_main = all_preds_main
            
            # 暂时使用主要预测的close数据作为波动率预测
            close_preds_volatility = close_preds_main
        
        return close_preds_main, volume_preds_main, close_preds_volatility
    
    def _calculate_metrics(
        self,
        hist_df: pd.DataFrame,
        close_preds_df: pd.DataFrame,
        v_close_preds_df: pd.DataFrame
    ) -> Tuple[float, float]:
        """计算预测指标"""
        last_close = hist_df['close'].iloc[-1]
        
        # 上涨概率
        final_preds = close_preds_df.iloc[-1]
        upside_prob = (final_preds > last_close).mean()
        
        # 波动性放大概率
        hist_log_returns = np.log(hist_df['close'] / hist_df['close'].shift(1))
        historical_vol = hist_log_returns.iloc[-self.get_vol_window():].std()
        
        amplification_count = 0
        for col in v_close_preds_df.columns:
            full_sequence = pd.concat([
                pd.Series([last_close]),
                v_close_preds_df[col]
            ]).reset_index(drop=True)
            pred_log_returns = np.log(full_sequence / full_sequence.shift(1))
            predicted_vol = pred_log_returns.std()
            
            if predicted_vol > historical_vol:
                amplification_count += 1
        
        vol_amp_prob = amplification_count / len(v_close_preds_df.columns)
        return upside_prob, vol_amp_prob
    
    def _calculate_backtest_accuracy(
        self,
        last_training_close: float,
        validation_df: pd.DataFrame,
        predicted_upward: bool
    ) -> float:
        """计算回测准确率"""
        if validation_df.empty:
            return 0.0
        
        # 获取验证期间的最终价格
        final_validation_close = validation_df['close'].iloc[-1]
        actual_upward = final_validation_close > last_training_close
        
        # 计算准确率（简单的方向预测准确率）
        return 100.0 if predicted_upward == actual_upward else 0.0
    
    def _create_plot(
        self,
        hist_df: pd.DataFrame,
        close_preds_df: pd.DataFrame,
        volume_preds_df: pd.DataFrame,
        symbol: str
    ) -> str:
        """生成预测图表 - 使用连续x轴显示，隐藏非交易时间间隔"""
        logger.info("生成预测图表...")
        fig, (ax1, ax2) = plt.subplots(
            2, 1, figsize=(15, 10),
            sharex=True,
            gridspec_kw={'height_ratios': [3, 1]}
        )
        
        hist_time = hist_df['timestamps']
        last_hist_time = hist_time.iloc[-1]
        pred_time = self._generate_prediction_timestamps(last_hist_time)
        
        # 创建连续的x轴索引来避免显示非交易时间的间隔
        hist_indices = list(range(len(hist_time)))
        pred_indices = list(range(len(hist_time), len(hist_time) + len(pred_time)))
        
        # 绘制价格图
        ax1.plot(hist_indices, hist_df['close'], color='royalblue',
                label='Historical Price', linewidth=1.5)
        mean_preds = close_preds_df.mean(axis=1)
        ax1.plot(pred_indices, mean_preds, color='darkorange',
                linestyle='-', label='Average Prediction')
        ax1.fill_between(
            pred_indices,
            close_preds_df.min(axis=1),
            close_preds_df.max(axis=1),
            color='darkorange',
            alpha=0.2,
            label='Prediction Range (Min-Max)'
        )
        
        # 设置标题
        ax1.set_title(
            f'{symbol} Probabilistic Price and Volume Prediction\n'
            f'(Next {len(close_preds_df)} {self.get_interval_display_name()})',
            fontsize=16,
            weight='bold'
        )
        ax1.set_ylabel('Price')
        ax1.legend()
        ax1.grid(True, which='both', linestyle='--', linewidth=0.5)
        
        # 绘制成交量图
        ax2.bar(hist_indices, hist_df['volume'], color='skyblue',
                label='Historical Volume', width=0.8)
        ax2.bar(pred_indices, volume_preds_df.mean(axis=1),
                color='sandybrown', label='Predicted Average Volume', width=0.8)
        ax2.set_ylabel('Volume')
        ax2.set_xlabel('Time Periods (Trading Hours Only)')
        ax2.legend()
        ax2.grid(True, which='both', linestyle='--', linewidth=0.5)
        
        # 添加分隔线和时间戳标记
        separation_point = len(hist_time) - 0.5
        last_time_str = last_hist_time.strftime('%Y/%m/%d %H:%M') # 更改时间格式以包含年份
        for ax in [ax1, ax2]:
            ax.axvline(x=separation_point, color='red',
                      linestyle='--', linewidth=1.5, label='_nolegend_')
            # 添加最新数据时间戳标记 (横向显示，包含年份)
            y_pos = ax.get_ylim()[1] * 0.95  # 调整y轴位置，使其在图表内部稍低一些
            ax.text(separation_point, y_pos, last_time_str,
                   rotation=0, color='red', va='top', ha='center',
                   fontsize=10, bbox=dict(facecolor='white', alpha=0.8, edgecolor='none'))
        
        # 设置x轴标签 - 显示关键时间点
        all_times = list(hist_time) + list(pred_time)
        all_indices = hist_indices + pred_indices
        
        # 选择显示的时间点 - 每隔一定间隔显示一个
        step = max(1, len(all_times) // 10)  # 显示大约10个时间标签
        tick_indices = all_indices[::step]
        tick_labels = [all_times[i].strftime('%m/%d %H:%M') for i in range(0, len(all_times), step)]
        
        ax2.set_xticks(tick_indices)
        ax2.set_xticklabels(tick_labels, rotation=45, ha='right')
        
        fig.tight_layout()
        
        # 转换为base64
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=120, bbox_inches='tight')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        return img_base64
    
    @abstractmethod
    def _generate_prediction_timestamps(self, last_timestamp: datetime) -> pd.DatetimeIndex:
        """生成预测时间序列"""
        pass
    
    @abstractmethod
    def _filter_trading_hours(self, df: pd.DataFrame) -> pd.DataFrame:
        """过滤数据，仅保留交易时间的数据"""
        pass
    
    @abstractmethod
    def get_market_type(self) -> str:
        """获取市场类型"""
        pass
    
    @abstractmethod
    def get_data_source(self) -> str:
        """获取数据来源"""
        pass
    
    @abstractmethod
    def get_interval_display_name(self) -> str:
        """获取时间间隔显示名称"""
        pass
    
    @abstractmethod
    def get_validation_window(self) -> int:
        """获取回测验证窗口大小（需要预留的数据点数量）"""
        pass