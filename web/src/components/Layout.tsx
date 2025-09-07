import React from 'react';
import { TrendingUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">K-Online</h1>
                <p className="text-sm text-gray-600">K线预测平台</p>
              </div>
            </div>
            <a 
              href="https://quantfull.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Powered by Quantfull.com
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="fade-in">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2025 K-Online by Quantfull.com. All rights reserved.</p>
            <p className="mt-2 text-xs text-gray-500">
              本系统基于开源机器学习算法和公开数据进行K线预测，所有预测窗口为历史数据，仅供学习交流。不涉及对未来的预测，不构成任何投资建议。预测结果可能存在误差，实际市场表现可能与预测结果存在显著差异。用户应独立判断并承担投资风险，本平台不对任何投资决策及结果负责。投资有风险，入市需谨慎，建议用户充分了解相关风险并咨询专业投资顾问。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
