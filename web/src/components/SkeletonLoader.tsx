import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const PredictionDetailSkeleton: React.FC = () => {
  return (
    <div className="card space-y-6">
      {/* 标题部分 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      {/* 更新时间 */}
      <Skeleton className="h-4 w-40" />

      {/* 预测指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        {[1, 2].map((index) => (
          <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const StockSelectorSkeleton: React.FC = () => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* 移动端 */}
      <div className="block xl:hidden mb-4">
        <Skeleton className="w-full h-12 rounded-lg" />
      </div>

      {/* 桌面端 */}
      <div className="hidden xl:block space-y-3">
        {[1, 2, 3].map((index) => (
          <div key={index} className="border-2 border-gray-200 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Skeleton className="w-3.5 h-3.5" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatsPanelSkeleton: React.FC = () => {
  return (
    <div className="card">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 rounded-full bg-white">
                <Skeleton className="w-5 h-5" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-8 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
