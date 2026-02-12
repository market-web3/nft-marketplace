'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Users, ShoppingBag, TrendingUp, Gem } from 'lucide-react';

const stats = [
  { icon: ShoppingBag, label: 'Total Volume', value: 125000, prefix: 'TON ', suffix: '', decimals: 0 },
  { icon: Gem, label: 'NFTs Listed', value: 15420, prefix: '', suffix: '+', decimals: 0 },
  { icon: Users, label: 'Active Users', value: 8500, prefix: '', suffix: '+', decimals: 0 },
  { icon: TrendingUp, label: 'Floor Price', value: 15.5, prefix: 'TON ', suffix: '', decimals: 1 },
];

function AnimatedCounter({ value, prefix, suffix, decimals }: { value: number; prefix: string; suffix: string; decimals: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (decimals === 0) {
      return Math.round(latest).toLocaleString();
    }
    return latest.toFixed(decimals);
  });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: 'easeOut',
    });

    const unsubscribe = rounded.on('change', (v) => {
      setDisplayValue(String(v));
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  return (
    <span>
      {prefix}{displayValue}{suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-card p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                <AnimatedCounter 
                  value={stat.value} 
                  prefix={stat.prefix} 
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
