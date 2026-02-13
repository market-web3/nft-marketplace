'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800" />
    );
  }

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;

        return (
          <motion.button
            key={t.id}
            onClick={() => setTheme(t.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-2 rounded-md transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t.label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
          </motion.button>
        );
      })}
    </div>
  );
}
