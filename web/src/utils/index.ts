import { clsx, type ClassValue } from 'clsx';

/**
 * 合并CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * 格式化数字为货币格式
 */
export function formatCurrency(value: number, currency = '¥'): string {
  return `${currency}${value.toFixed(2)}`;
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
