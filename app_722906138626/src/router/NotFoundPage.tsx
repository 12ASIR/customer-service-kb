// src/pages/NotFoundPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        {/* 404 图标/文字 */}
        <h1 className="text-9xl font-black text-gray-200">404</h1>
        
        <div className="mt-[-4rem] mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            页面未找到
          </h2>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            抱歉，您访问的页面不存在或已被移除。
            <br />
            请检查链接是否正确，或返回首页继续操作。
          </p>
        </div>

        {/* 操作按钮组 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            返回上一页
          </button>

          <button
            onClick={() => navigate('/query')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-button text-white font-medium shadow-lg hover:shadow-xl hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <i className="fas fa-home mr-2"></i>
            回到首页
          </button>
        </div>
      </div>
      
      {/* 底部装饰 */}
      <div className="absolute bottom-8 text-sm text-gray-400">
        Customer Service Knowledge Base
      </div>
    </div>
  );
};

export default NotFoundPage;