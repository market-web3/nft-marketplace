'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gavel, 
  Clock, 
  TrendingUp,
  Users,
  Flame
} from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDistanceToNow } from 'date-fns';

const stats = [
  { label: 'Active Auctions', value: 128, icon: Gavel, color: 'blue' },
  { label: 'Total Volume', value: '45.2K TON', icon: TrendingUp, color: 'green' },
  { label: 'Bidders Today', value: 342, icon: Users, color: 'purple' },
  { label: 'Ending Soon', value: 12, icon: Clock, color: 'amber' },
];

export default function AuctionsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuctions([
        {
          id: '1',
          name: 'Cosmic Explorer #001',
          imageUrl: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
          price: 1500000000,
          status: 'listed',
          likes: 42,
          owner: { walletAddress: 'EQD...1234' },
          listingType: 'auction',
          expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
          highestBid: 2300000000,
          bidCount: 8,
        },
        {
          id: '2',
          name: 'Digital Dreamscape',
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
          price: 1000000000,
          status: 'listed',
          likes: 128,
          owner: { walletAddress: 'EQA...5678' },
          listingType: 'auction',
          expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
          highestBid: 4500000000,
          bidCount: 15,
        },
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              NFT Auctions
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Bid on exclusive digital collectibles and win rare NFTs
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-300`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="sticky top-16 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4">
            {['active', 'ending-soon', 'completed', 'my-bids'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Auction Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NFTCard nft={auction} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
