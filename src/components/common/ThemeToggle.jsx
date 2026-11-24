
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Sync with theme changes made elsewhere (Profile page)
  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('theme-changed', syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener('theme-changed', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains('dark');

    root.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');

    setIsDark(nextDark);
    window.dispatchEvent(new Event('theme-changed'));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
