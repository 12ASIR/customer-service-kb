import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export default function RouteListener() {
  const location = useLocation();
  useEffect(() => {
    const pageId = 'P-' + location.pathname.replace('/', '').toUpperCase();
    if (import.meta.env.DEV) {
      console.log('当前pageId:', pageId, ', pathname:', location.pathname, ', search:', location.search);
    }
    if (typeof window === 'object' && window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'chux-path-change',
        pageId: pageId,
        pathname: location.pathname,
        search: location.search,
      }, '*');
    }
  }, [location]);

  return <Outlet />;
}
