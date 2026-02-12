'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Palette, Gamepad2, Music, Camera, 
  Sparkles, Trophy, BookOpen, MoreHorizontal 
} from 'lucide-react';

const categories = [
  { icon: Palette, label: 'Art', count: 2340, color: 'from-pink-500 to-rose-500' },
  { icon: Gamepad2, label: 'Gaming', count: 1850, color: 'from-violet-500 to-purple-500' },
  { icon: Music, label: 'Music', count: 920, color: 'from-cyan-500 to-blue-500' },
  { icon: Camera, label: 'Photography', count: 1450, color: 'from-emerald-500 to-teal-500' },
  { icon: Sparkles, label: 'Collectibles', count: 3120, color: 'from-amber-500 to-orange-500' },
  { icon: Trophy, label: 'Sports', count: 780, color: 'from-red-500 to-pink-500' },
  { icon: BookOpen, label: 'Books', count: 450, color: 'from-indigo-500 to-violet-500' },
  { icon: MoreHorizontal, label: 'More', count: 1230, color: 'from-slate-500 to-slate-600' },
];

export function CategoriesSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Browse by Category
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explore NFTs across different categories and find your next digital treasure
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link href={`/market?category=${category.label.toLowerCase()}`}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card p-6 cursor-pointer group"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {category.label}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {category.count.toLocaleString()} items
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
