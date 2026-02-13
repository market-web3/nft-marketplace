'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  count?: number;
  variant?: 'card' | 'list' | 'detail';
}

export function LoadingSkeleton({ count = 4, variant = 'card' }: LoadingSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-center space-x-4 animate-pulse"
          >
            <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            </div>
            <div className="w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"
        />
        <div className="space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
