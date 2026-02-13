'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';

const sortOptions = [
  { value: 'createdAt_desc', label: 'Recently Listed' },
  { value: 'createdAt_asc', label: 'Oldest Listed' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'views_desc', label: 'Most Viewed' },
  { value: 'likes_desc', label: 'Most Liked' },
];

export default function MarketPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoadingCategories,
  } = useMarketplaceStore();

  // Mock NFT data - would be fetched from API
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setNfts([
        {
          id: '1',
          name: 'Cosmic Explorer #001',
          imageUrl: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
          price: 1500000000,
          status: 'listed',
          likes: 42,
          owner: {
            username: 'crypto_whale',
            walletAddress: 'EQD...1234',
          },
          listingType: 'fixed',
        },
        {
          id: '2',
          name: 'Digital Dreamscape',
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
          price: 2300000000,
          status: 'listed',
          likes: 128,
          owner: {
            walletAddress: 'EQA...5678',
          },
          listingType: 'auction',
          expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
        },
        {
          id: '3',
          name: 'Neon Genesis',
          imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400',
          price: 890000000,
          status: 'listed',
          likes: 67,
          owner: {
            username: 'nft_collector',
            walletAddress: 'EQB...9012',
          },
          listingType: 'fixed',
        },
        {
          id: '4',
          name: 'Abstract Harmony',
          imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400',
          price: 4500000000,
          status: 'listed',
          likes: 234,
          owner: {
            walletAddress: 'EQC...3456',
          },
          listingType: 'auction',
          expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        },
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    // Re-sort NFTs
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Explore NFTs
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Discover, collect, and trade extraordinary digital collectibles on TON
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-16 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search NFTs, collections, or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  isFilterOpen
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 pr-10 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>

              {/* View Mode */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <motion.div
            initial={false}
            animate={{ height: isFilterOpen ? 'auto' : 0, opacity: isFilterOpen ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="py-4 border-t border-slate-200 dark:border-slate-700 mt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* NFT Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingSkeleton count={8} />
        ) : nfts.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {nfts.map((nft, index) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NFTCard nft={nft} variant={viewMode === 'list' ? 'compact' : 'default'} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No NFTs found
            </h3>
            <p className="text-slate-500">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
