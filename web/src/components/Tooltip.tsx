import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/utils';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  className?: string;
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'auto', // 默认位置改为自动判断
  className,
  maxWidth = 'max-w-[calc(100vw-2rem)] sm:max-w-xs' // 默认宽度改为响应式，确保在小屏幕上不会超出视口
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [actualPosition, setActualPosition] = useState(position);

  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const handlePositioning = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;
      if (newPosition === 'auto') newPosition = 'top'; // 自动模式下先默认顶部

      // 检查右侧溢出
      if (triggerRect.right + tooltipRect.width + 12 > viewportWidth && newPosition === 'right') {
        newPosition = 'left';
      }
      // 检查左侧溢出
      if (triggerRect.left - tooltipRect.width - 12 < 0 && newPosition === 'left') {
        newPosition = 'right';
      }
      // 检查顶部溢出
      if (triggerRect.top - tooltipRect.height - 12 < 0 && newPosition === 'top') {
        newPosition = 'bottom';
      }
      // 检查底部溢出
      if (triggerRect.bottom + tooltipRect.height + 12 > viewportHeight && newPosition === 'bottom') {
        newPosition = 'top';
      }
      
      // 对于小屏幕，优先考虑顶部/底部，并尝试居中以避免水平溢出
      if (viewportWidth < 640) { // Tailwind 的 sm 断点是 640px
        if (newPosition === 'left' || newPosition === 'right') {
            newPosition = 'top'; // 移动端优先顶部/底部
        }
        // 如果顶部/底部仍然水平溢出，则尝试调整
        if (tooltipRect.left < 0) { // 如果左侧超出屏幕
          newPosition = 'right'; // 尝试推向右侧（相对于触发器）
        } else if (tooltipRect.right > viewportWidth) { // 如果右侧超出屏幕
          newPosition = 'left'; // 尝试推向左侧（相对于触发器）
        }
      }
      setActualPosition(newPosition);
    };

    handlePositioning();
    window.addEventListener('resize', handlePositioning);
    return () => window.removeEventListener('resize', handlePositioning);
  }, [isVisible, position, maxWidth]);

  const positionClasses = {
    top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-3 left-1/2 -translate-x-1/2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
    right: 'left-full ml-3 top-1/2 -translate-y-1/2',
    auto: 'bottom-full mb-3 left-1/2 -translate-x-1/2' // 自动模式的默认 fallback
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900/95',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900/95',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900/95',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900/95',
    auto: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900/95' // 自动模式的默认 fallback
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div ref={triggerRef} className="inline-block">{children}</div>
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700',
            maxWidth,
            positionClasses[actualPosition],
            className
          )}>
          {content}
          <div className={cn('absolute w-0 h-0 border-4', arrowClasses[actualPosition])} />
        </div>
      )}
    </div>
  );
};

// 预定义的指标解释内容 (用户已简化)
export const MetricExplanations = {
  upside_probability: {
    title: "上涨概率",
    description: (
      <div className="space-y-1.5 text-left w-72">
        <div className="font-medium text-white text-xs">指标说明</div>
        <div className="text-xs text-gray-300 leading-relaxed">
          通过模型生成多个预测结果，计算最终预测价格高于当前价格的样本比例
        </div>
      </div>
    )
  },
  volatility_amplification: {
    title: "波动放大率",
    description: (
      <div className="space-y-1.5 text-left w-72">
        <div className="font-medium text-white text-xs">指标说明</div>
        <div className="text-xs text-gray-300 leading-relaxed">
          比较预测期间波动率与历史波动率，计算预测波动率超过历史水平的概率
        </div>
      </div>
    )
  }
};
