'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock } from 'lucide-react';
import { AuctionCard } from '@/components/common/AuctionCard';

const categories = ['All', 'Art', 'Gaming', 'Music', 'Photography', 'Collectibles'];

const mockAuctions = [
  {
    id: 'a1',
    name: 'Legendary Dragon #001',
    image: '/nfts/dragon.jpg',
    currentBid: 150,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 3,
    bidCount: 23,
    creator: { name: 'Dragon Studio', avatar: '/avatars/5.jpg', verified: true },
    minBidIncrement: 5,
  },
  {
    id: 'a2',
    name: 'Golden Crown Supreme',
    image: '/nfts/crown.jpg',
    currentBid: 89.5,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 7,
    bidCount: 15,
    creator: { name: 'Royal Arts', avatar: '/avatars/6.jpg', verified: true },
    minBidIncrement: 2.5,
  },
  {
    id: 'a3',
    name: 'Crypto Punk TON Edition',
    image: '/nfts/punk.jpg',
    currentBid: 210,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 2,
    bidCount: 45,
    creator: { name: 'Punk Labs', avatar: '/avatars/7.jpg', verified: true },
    minBidIncrement: 10,
  },
  {
    id: 'a4',
    name: 'Metaverse Land Plot #445',
    image: '/nfts/land.jpg',
    currentBid: 340,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 5,
    bidCount: 32,
    creator: { name: 'Meta Estates', avatar: '/avatars/8.jpg', verified: false },
    minBidIncrement: 15,
  },
];

export default function AuctionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Live Auctions
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Bid on exclusive NFTs and win unique digital collectibles
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search auctions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockAuctions.map((auction, index) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AuctionCard auction={auction} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
