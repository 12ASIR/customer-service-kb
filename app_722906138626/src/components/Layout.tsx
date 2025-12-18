import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? styles.menuItemActive : `${styles.menuItemHover} text-text-secondary`;
  };

  return (
    <div className={styles.pageWrapper}>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-button rounded-lg flex items-center justify-center">
              <i className="fas fa-question-circle text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-text-primary">售后问题知识库</h1>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-text-secondary">广州轩博网络科技有限公司</span>
          </div>
        </div>
      </header>

      <aside className={`fixed left-0 top-16 bottom-0 ${isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded} bg-white/80 backdrop-blur-md border-r border-gray-200/50 z-40 transition-all duration-300`}>
        <div className="p-4">
          <button 
            onClick={handleSidebarToggle}
            className="w-full flex items-center justify-center p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors mb-4"
          >
            <i className="fas fa-bars"></i>
          </button>
          
          <nav className="space-y-2">
            <Link 
              to="/query" 
              className={`flex items-center space-x-3 p-3 rounded-lg ${isActive('/query')} transition-all`}
            >
              <i className="fas fa-search text-lg w-5"></i>
              {!isSidebarCollapsed && <span>问题查询</span>}
            </Link>
            <Link 
              to="/manage" 
              className={`flex items-center space-x-3 p-3 rounded-lg ${isActive('/manage')} transition-all`}
            >
              <i className="fas fa-database text-lg w-5"></i>
              {!isSidebarCollapsed && <span>知识库明细</span>}
            </Link>
            <Link 
              to="/add" 
              className={`flex items-center space-x-3 p-3 rounded-lg ${isActive('/add')} transition-all`}
            >
              <i className="fas fa-plus-circle text-lg w-5"></i>
              {!isSidebarCollapsed && <span>新增问题</span>}
            </Link>
          </nav>
        </div>
      </aside>

      <main className={`${isSidebarCollapsed ? styles.mainContentCollapsed : styles.mainContentExpanded} pt-16 min-h-screen transition-all duration-300`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
