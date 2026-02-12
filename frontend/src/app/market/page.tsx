'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid3X3, LayoutList, SlidersHorizontal } from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { useMarketStore } from '@/store/marketStore';

const categories = ['All', 'Art', 'Gaming', 'Music', 'Photography', 'Collectibles', 'Sports'];

const mockNFTs = [
  { id: '1', name: 'Cosmic Wanderer #001', image: '/nfts/1.jpg', price: 25.5, currency: 'TON', creator: { name: 'Cosmic Arts', avatar: '/a/1.jpg', verified: true }, likes: 234, views: 1205, category: 'Art' },
  { id: '2', name: 'Digital Genesis', image: '/nfts/2.jpg', price: 42, currency: 'TON', creator: { name: 'Pixel Master', avatar: '/a/2.jpg', verified: true }, likes: 189, views: 892, category: 'Art' },
  { id: '3', name: 'Neon Cyberpunk #77', image: '/nfts/3.jpg', price: 18.25, currency: 'TON', creator: { name: 'Cyber Labs', avatar: '/a/3.jpg', verified: false }, likes: 156, views: 743, category: 'Gaming' },
  { id: '4', name: 'Abstract Thoughts', image: '/nfts/4.jpg', price: 35, currency: 'TON', creator: { name: 'ArtFlow', avatar: '/a/4.jpg', verified: true }, likes: 312, views: 1567, category: 'Art' },
  { id: '5', name: 'Music Beats #42', image: '/nfts/5.jpg', price: 12.5, currency: 'TON', creator: { name: 'BeatMaker', avatar: '/a/5.jpg', verified: true }, likes: 98, views: 456, category: 'Music' },
  { id: '6', name: 'Sports Legend', image: '/nfts/6.jpg', price: 89, currency: 'TON', creator: { name: 'Sports NFT', avatar: '/a/6.jpg', verified: true }, likes: 445, views: 2341, category: 'Sports' },
  { id: '7', name: 'Photography Gold', image: '/nfts/7.jpg', price: 28, currency: 'TON', creator: { name: 'PhotoArt', avatar: '/a/7.jpg', verified: false }, likes: 167, views: 892, category: 'Photography' },
  { id: '8', name: 'Rare Collectible #001', image: '/nfts/8.jpg', price: 150, currency: 'TON', creator: { name: 'Collectors', avatar: '/a/8.jpg', verified: true }, likes: 523, views: 3421, category: 'Collectibles' },
];

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { sortBy, setSortBy } = useMarketStore();

  const filteredNFTs = mockNFTs.filter((nft) => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || nft.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            NFT Marketplace
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Discover and collect extraordinary digital assets
          </p>
        </motion.div>

        {/* Search and Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search NFTs, creators, or collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredNFTs.length}</span> results
          </p>
        </div>

        {/* NFT Grid */}
        <motion.div
          layout
          className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {filteredNFTs.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NFTCard nft={nft} />
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredNFTs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No NFTs found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
