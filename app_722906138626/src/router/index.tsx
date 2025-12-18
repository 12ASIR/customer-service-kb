import { createHashRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import RouteListener from '../components/RouteListener';

import P_query from '../pages/p-query';
import P_add from '../pages/p-add';
import P_manage from '../pages/p-manage';
import P_detail from '../pages/p-detail';
import NotFoundPage from './NotFoundPage';
import ErrorPage from './ErrorPage';

// 使用 createBrowserRouter 创建路由实例
const router = createHashRouter([
  {
    path: '/',
    element: <RouteListener />,
    children: [
      {
        path: '/',
        element: <Navigate to='/query' replace={true} />,
      },
      {
        path: '/query',
        element: (
          <ErrorBoundary>
            <P_query />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/add',
        element: (
          <ErrorBoundary>
            <P_add />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/manage',
        element: (
          <ErrorBoundary>
            <P_manage />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/detail',
        element: (
          <ErrorBoundary>
            <P_detail />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ]
  }
]);

export default router;
