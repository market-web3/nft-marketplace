'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Gift, ArrowUpRight, Eye, Filter, Grid3X3, List } from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { useMarketStore } from '@/store/marketStore';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';

const tabs = [
  { id: 'owned', label: 'My NFTs', icon: Package },
  { id: 'deposited', label: 'Deposited', icon: ArrowUpRight },
  { id: 'gifts', label: 'Telegram Gifts', icon: Gift },
];

const mockOwnedNFTs = [
  { id: '1', name: 'Cosmic Wanderer #001', image: '/nfts/1.jpg', price: 25.5, currency: 'TON', creator: { name: 'Cosmic Arts', avatar: '/a/1.jpg', verified: true }, likes: 234, views: 1205, category: 'Art' },
  { id: '3', name: 'Neon Cyberpunk #77', image: '/nfts/3.jpg', price: 18.25, currency: 'TON', creator: { name: 'Cyber Labs', avatar: '/a/3.jpg', verified: false }, likes: 156, views: 743, category: 'Gaming' },
  { id: '5', name: 'Music Beats #42', image: '/nfts/5.jpg', price: 12.5, currency: 'TON', creator: { name: 'BeatMaker', avatar: '/a/5.jpg', verified: true }, likes: 98, views: 456, category: 'Music' },
];

const mockGifts = [
  { id: 'g1', name: 'Star Gift #1234', image: '/gifts/star.jpg', price: 5, currency: 'TON', creator: { name: 'Telegram', avatar: '/a/tg.jpg', verified: true }, likes: 56, views: 234, category: 'Collectibles' },
  { id: 'g2', name: 'Rocket Gift #567', image: '/gifts/rocket.jpg', price: 8, currency: 'TON', creator: { name: 'Telegram', avatar: '/a/tg.jpg', verified: true }, likes: 89, views: 567, category: 'Collectibles' },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('owned');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isConnected } = useMarketStore();
  const [tonConnectUI] = useTonConnectUI();

  const getNFTsForTab = () => {
    switch (activeTab) {
      case 'owned':
        return mockOwnedNFTs;
      case 'gifts':
        return mockGifts;
      default:
        return [];
    }
  };

  if (!isConnected && !tonConnectUI.connected) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Connect your TON wallet to view your NFT inventory, manage deposits, and see your Telegram gifts
            </p>
            <TonConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

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
            My Inventory
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your NFTs, deposits, and Telegram gifts
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total NFTs', value: '12', color: 'blue' },
            { label: 'Total Value', value: '56.25 TON', color: 'green' },
            { label: 'Deposited', value: '3', color: 'purple' },
            { label: 'Gifts', value: '2', color: 'orange' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Filters & View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <span className="text-slate-600 dark:text-slate-400">
              {getNFTsForTab().length} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Filter className="w-5 h-5" />
            </button>
            <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* NFT Grid */}
        {activeTab === 'gifts' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Telegram Gifts</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  These are off-chain Telegram gifts that can be withdrawn to your Telegram account or traded on the marketplace
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          layout
          className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {getNFTsForTab().map((nft, index) => (
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

        {getNFTsForTab().length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No items found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {activeTab === 'gifts' 
                ? 'You don\'t have any Telegram gifts yet'
                : 'You don\'t have any NFTs in this category'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
