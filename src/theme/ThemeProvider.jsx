import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export function ThemeProvider({ children }) {
  const isDark = useThemeStore((s) => s.isDark);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      isDark ? '#0E0F14' : '#FDFAF4'
    );
  }, [isDark]);
  return children;
}
