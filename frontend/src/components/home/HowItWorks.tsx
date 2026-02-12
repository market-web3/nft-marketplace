'use client';

import { motion } from 'framer-motion';
import { Wallet, Search, Tag, HandCoins } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Connect Wallet',
    description: 'Link your TON wallet with one click using TonConnect',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Search,
    title: 'Discover NFTs',
    description: 'Browse through thousands of unique digital collectibles',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Tag,
    title: 'Buy or Bid',
    description: 'Purchase at fixed price or participate in auctions',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: HandCoins,
    title: 'Earn & Trade',
    description: 'Sell your NFTs and earn TON from your creations',
    color: 'from-emerald-500 to-teal-500',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Get started with TON NFT Marketplace in just a few simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm z-10">
                {index + 1}
              </div>
              
              <motion.div
                whileHover={{ y: -10 }}
                className="glass-card p-8 text-center h-full"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </motion.div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-700" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
