import { useEffect } from 'react';
import { AppRouter } from './router/AppRouter';
import { useUIStore } from './store/uiStore';

export default function App() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return <AppRouter />;
}
