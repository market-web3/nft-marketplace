'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Grid, List, Filter, Search,
  Wallet, ArrowUpRight, ArrowDownRight, Gift
} from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { TelegramGiftsWidget } from '@/components/telegram/TelegramGiftsWidget';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'wallet', label: 'In Wallet', count: 5 },
  { id: 'deposited', label: 'Deposited', count: 3 },
  { id: 'listed', label: 'Listed', count: 2 },
  { id: 'gifts', label: 'Telegram Gifts', count: 4 },
];

const mockNFTs = [
  {
    id: '1',
    name: 'Cosmic Wanderer #001',
    image: 'https://picsum.photos/400/400?random=1',
    price: 25.5,
    currency: 'TON',
    collection: 'Cosmic Series',
    likes: 42,
  },
  {
    id: '2',
    name: 'Digital Genesis #103',
    image: 'https://picsum.photos/400/400?random=2',
    price: 15.0,
    currency: 'TON',
    collection: 'Genesis Collection',
    likes: 28,
  },
  {
    id: '3',
    name: 'Abstract Mind #77',
    image: 'https://picsum.photos/400/400?random=3',
    price: 8.5,
    currency: 'TON',
    collection: 'Abstract Art',
    likes: 15,
  },
];

const mockGifts = [
  {
    id: 'gift1',
    name: 'Star Gift #1234',
    value: 10,
    status: 'deposited' as const,
    depositedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'gift2',
    name: 'Premium Box',
    value: 50,
    status: 'deposited' as const,
    depositedAt: '2024-01-14T15:30:00Z',
  },
  {
    id: 'gift3',
    name: 'Diamond Star',
    value: 25,
    status: 'deposited' as const,
    depositedAt: '2024-01-13T09:15:00Z',
  },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = () => {
    toast.success('Deposit initiated. Check Telegram bot for instructions.');
  };

  const handleWithdraw = (giftId: string) => {
    toast.success('Withdrawal request submitted. Admin will process it shortly.');
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            My Inventory
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your NFTs and Telegram gifts
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Telegram Gifts Widget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Telegram Gifts Widget */}
            <TelegramGiftsWidget
              gifts={mockGifts}
              isLoading={isLoading}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />

            {/* Quick Actions */}
            <div className="glass-card p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => toast.success('Deposit feature coming soon')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <ArrowDownRight className="w-5 h-5" />
                  <span className="font-medium">Deposit NFT</span>
                </button>
                <button 
                  onClick={() => toast.success('Withdrawal feature coming soon')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span className="font-medium">Withdraw NFT</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="glass-card p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total NFTs</span>
                  <span className="font-semibold text-slate-900 dark:text-white">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Listed</span>
                  <span className="font-semibold text-slate-900 dark:text-white">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">In Auctions</span>
                  <span className="font-semibold text-slate-900 dark:text-white">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telegram Gifts</span>
                  <span className="font-semibold text-slate-900 dark:text-white">4</span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Value</span>
                    <span className="font-bold text-slate-900 dark:text-white">345 TON</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            {/* Tabs & Controls */}
            <div className="glass-card mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 gap-4">
                {/* Tabs */}
                <div className="flex overflow-x-auto gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* View Toggle & Search */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-slate-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-slate-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {activeTab === 'gifts' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mockGifts.map((gift) => (
                      <motion.div
                        key={gift.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card overflow-hidden group cursor-pointer"
                      >
                        <div className="aspect-square bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-6xl">🎁</span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {gift.name}
                          </h4>
                          <p className="text-sm text-slate-500 mb-3">{gift.value} TON</p>
                          <button
                            onClick={() => handleWithdraw(gift.id)}
                            className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Withdraw
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : mockNFTs.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                    {mockNFTs.map((nft) => (
                      <NFTCard key={nft.id} {...nft} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No items found
                    </h3>
                    <p className="text-slate-500">
                      {activeTab === 'wallet' 
                        ? 'Your wallet NFTs will appear here'
                        : activeTab === 'deposited'
                        ? 'Deposited NFTs will appear here'
                        : 'Listed NFTs will appear here'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
