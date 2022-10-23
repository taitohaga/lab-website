import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (import.meta.env.SSR) {
      return undefined;
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const t = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', t);
    setTheme(t);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    console.log(isMounted);
    setIsMounted(() => true);
  }, []);

  return isMounted ? (
    <div className="rounded-full w-8 h-8 bg-blue-300 dark:bg-blue-900">
      <button onClick={toggleTheme}>
        <span className="material-symbols-outlined text-white pt-[4px] pl-[4px]">
          {theme === 'light' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    </div>
  ) : (
    <></>
  );
}
