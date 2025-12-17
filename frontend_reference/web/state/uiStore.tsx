import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';

interface UIState {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const UIStoreContext = createContext<UIState | undefined>(undefined);

export const UIStoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}): JSX.Element => {
  const [isSidebarOpen, setOpen] = useState(false);
  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const toggleSidebar = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
  }, [isSidebarOpen]);
  return (
    <UIStoreContext.Provider
      value={{ isSidebarOpen, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </UIStoreContext.Provider>
  );
};

export const useUIStore = () => {
  const ctx = useContext(UIStoreContext);
  if (!ctx) throw new Error('useUIStore must be used within UIStoreProvider');
  return ctx;
};
