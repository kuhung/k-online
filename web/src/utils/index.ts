import { clsx, type ClassValue } from 'clsx';
import { MarketType, type MarketInfo } from '@/types';

/**
 * 合并CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 验证日期字符串是否有效
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateString: string): string {
  try {
    if (!isValidDate(dateString)) {
      throw new Error('Invalid date');
    }
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Shanghai'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '数据更新时间未知';
  }
}

/**
 * 标准化UTC日期字符串
 */
export function normalizeUtcDate(dateString: string): string {
  try {
    if (!isValidDate(dateString)) {
      throw new Error('Invalid date');
    }
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.warn('Date normalization error:', error);
    return new Date().toISOString(); // 返回当前时间作为后备
  }
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: string): string {
  // 如果已经包含%符号，直接返回
  if (value.includes('%')) {
    return value;
  }
  // 否则添加%符号
  return `${value}%`;
}

/**
 * 获取预测方向的颜色类名
 */
export function getDirectionColor(direction: 'Up' | 'Down'): string {
  return direction === 'Up' ? 'text-green-600' : 'text-red-600';
}

/**
 * 获取预测方向的图标
 */
export function getDirectionIcon(direction: 'Up' | 'Down'): string {
  return direction === 'Up' ? '↗' : '↘';
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否为有效的Base64图片数据
 */
export function isValidBase64Image(base64String: string): boolean {
  try {
    // 检查是否以data:image开头或者是纯base64字符串
    const isDataUrl = base64String.startsWith('data:image/');
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64String);
    
    return isDataUrl || (isBase64 && base64String.length > 0);
  } catch {
    return false;
  }
}

/**
 * 格式化Base64图片数据URL
 */
export function formatImageDataUrl(base64String: string): string {
  if (base64String.startsWith('data:image/')) {
    return base64String;
  }
  return `data:image/png;base64,${base64String}`;
}

/**
 * 根据标的代码识别市场类型
 */
export function getMarketType(symbol: string): MarketType {
  // 加密货币通常以USDT结尾
  if (symbol.endsWith('USDT')) {
    return MarketType.CRYPTO;
  }
  // 股指通常是纯数字代码
  if (/^\d+$/.test(symbol)) {
    return MarketType.INDEX;
  }
  // 默认返回加密货币类型
  return MarketType.CRYPTO;
}

/**
 * 获取市场信息
 */
export function getMarketInfo(marketType: MarketType): MarketInfo {
  const marketInfoMap: Record<MarketType, MarketInfo> = {
    [MarketType.CRYPTO]: {
      type: MarketType.CRYPTO,
      name: '加密货币市场',
      icon: '₿',
      description: '数字资产交易市场'
    },
    [MarketType.INDEX]: {
      type: MarketType.INDEX,
      name: '股指市场',
      icon: '📈',
      description: '股票指数市场'
    }
  };
  
  return marketInfoMap[marketType];
}

/**
 * 按市场类型分组预测数据
 */
export function groupPredictionsByMarket(predictions: Record<string, any>): Record<MarketType, Record<string, any>> {
  const grouped: Record<MarketType, Record<string, any>> = {
    [MarketType.CRYPTO]: {},
    [MarketType.INDEX]: {}
  };

  Object.entries(predictions).forEach(([symbol, prediction]) => {
    const marketType = getMarketType(symbol);
    grouped[marketType][symbol] = {
      ...prediction,
      market_type: marketType
    };
  });

  return grouped;
}
