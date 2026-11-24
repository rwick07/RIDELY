// src/router/index.js
import React, { createContext, useContext, useEffect, useState } from 'react';

// Context to hold the current pathname
const RouterContext = createContext({ pathname: '/', navigate: () => {} });

export const BrowserRouter = ({ children }) => {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to) => {
    if (to !== pathname) {
      window.history.pushState({}, '', to);
      setPathname(to);
    }
  };

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Routes = ({ children }) => <>{children}</>;

export const Route = ({ path, element }) => {
  const { pathname } = useContext(RouterContext);
  // simple exact match; support wildcard "*" for catch‑all
  const match = path === pathname || path === '*';
  return match ? element : null;
};

export const Navigate = ({ to, replace = false }) => {
  const { navigate } = useContext(RouterContext);
  useEffect(() => {
    navigate(to);
  }, [to]);
  return null;
};

export const Link = ({ to, children, ...rest }) => {
  const { navigate } = useContext(RouterContext);
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};

// Hook equivalents for convenience
export const useNavigate = () => {
  const { navigate } = useContext(RouterContext);
  return navigate;
};

export const useLocation = () => useContext(RouterContext);
