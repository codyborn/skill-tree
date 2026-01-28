'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load theme on mount
    const savedTheme = localStorage.getItem('skill_tree_theme');
    const theme = savedTheme === 'light' ? 'light' : 'dark'; // Default to dark
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return <>{children}</>;
}
