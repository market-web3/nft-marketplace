'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Grid3X3, 
  Heart, 
  History,
  Settings,
  Edit3
} from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { Button } from '@/components/common/Button';

const tabs = [
  { id: 'owned', label: 'Owned', icon: Grid3X3 },
  { id: 'created', label: 'Created', icon: Edit3 },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'activity', label: 'Activity', icon: History },
];

const mockUser = {
  username: 'crypto_artist',
  walletAddress: 'EQD...1234',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  bio: 'Digital artist and NFT collector on TON blockchain',
  joinedAt: '2024-01-15',
  stats: {
    totalNfts: 42,
    totalSales: 15,
    totalVolume: 12500000000,
    followers: 1289,
    following: 456,
  },
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('owned');
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(mockUser.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Cover */}
      <div className="h-64 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                <Image
                  src={mockUser.avatarUrl}
                  alt={mockUser.username}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-slate-800" />
            </motion.div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {mockUser.username}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleCopyAddress}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    {mockUser.walletAddress}
                    <Copy className="w-3 h-3" />
                  </button>
                  {copied && (
                    <span className="text-sm text-green-600">Copied!</span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
                  {mockUser.bio}
                </p>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 pb-2"
            >
              <Button variant="outline" icon={<Settings className="w-4 h-4" />}>
                Edit Profile
              </Button>
              <Button icon={<ExternalLink className="w-4 h-4" />}>
                Share
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {[
            { label: 'NFTs', value: mockUser.stats.totalNfts },
            { label: 'Sales', value: mockUser.stats.totalSales },
            { label: 'Volume', value: `${(mockUser.stats.totalVolume / 1e9).toFixed(1)} TON` },
            { label: 'Followers', value: mockUser.stats.followers.toLocaleString() },
            { label: 'Following', value: mockUser.stats.following.toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700"
            >
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-12"
        >
          {activeTab === 'owned' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Mock owned NFTs */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <NFTCard
                  key={i}
                  nft={{
                    id: `owned-${i}`,
                    name: `My NFT #${i}`,
                    imageUrl: `https://picsum.photos/400/300?random=${i}`,
                    price: 1000000000 * i,
                    status: 'active',
                    likes: 10 * i,
                    owner: {
                      walletAddress: mockUser.walletAddress,
                    },
                  }}
                />
              ))}
            </div>
          )}

          {activeTab === 'created' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3].map((i) => (
                <NFTCard
                  key={i}
                  nft={{
                    id: `created-${i}`,
                    name: `Created NFT #${i}`,
                    imageUrl: `https://picsum.photos/400/300?random=${i + 100}`,
                    price: 2000000000 * i,
                    status: 'listed',
                    likes: 25 * i,
                    owner: {
                      walletAddress: mockUser.walletAddress,
                    },
                  }}
                />
              ))}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                No favorites yet
              </h3>
              <p className="text-slate-500 mt-2">
                NFTs you like will appear here
              </p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-center gap-4 border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Listed NFT for sale
                    </p>
                    <p className="text-sm text-slate-500">
                      2 hours ago
                    </p>
                  </div>
                  <span className="text-green-600 font-medium">+2.5 TON</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
