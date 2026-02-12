'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Copy, ExternalLink, Edit3, Grid, Heart, 
  Activity, Settings, Wallet, Award
} from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'created', label: 'Created', icon: Grid },
  { id: 'owned', label: 'Owned', icon: Wallet },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'favorites', label: 'Favorites', icon: Heart },
];

const mockCreatedNFTs = [
  { id: 'c1', name: 'My Art #1', image: '/nfts/1.jpg', price: 10, currency: 'TON', creator: { name: 'You', avatar: '/a/me.jpg', verified: true }, likes: 45, views: 234, category: 'Art' },
  { id: 'c2', name: 'My Art #2', image: '/nfts/2.jpg', price: 15, currency: 'TON', creator: { name: 'You', avatar: '/a/me.jpg', verified: true }, likes: 67, views: 456, category: 'Art' },
];

const mockActivity = [
  { type: 'buy', item: 'Cosmic Wanderer #001', price: 25.5, date: '2 hours ago' },
  { type: 'sell', item: 'Digital Genesis', price: 42, date: '1 day ago' },
  { type: 'bid', item: 'Legendary Dragon #001', price: 150, date: '2 days ago' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('created');
  const [isEditing, setIsEditing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();

  const copyAddress = () => {
    if (tonConnectUI.account?.address) {
      navigator.clipboard.writeText(tonConnectUI.account.address);
      toast.success('Address copied to clipboard');
    }
  };

  if (!tonConnectUI.connected) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Connect your TON wallet to view your profile, track your activity, and manage your NFTs
            </p>
            <TonConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

  const address = tonConnectUI.account?.address || '';
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Cover Image */}
      <div className="h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative -mt-20 mb-8"
        >
          <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-white dark:border-slate-900 shadow-xl" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Collector #001
                </h1>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <code className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
                    {shortAddress}
                  </code>
                  <button 
                    onClick={copyAddress}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a 
                    href={`https://tonscan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              {[
                { label: 'Volume', value: '125.5 TON' },
                { label: 'NFTs', value: '12' },
                { label: 'Followers', value: '234' },
                { label: 'Following', value: '89' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
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

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === 'created' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockCreatedNFTs.map((nft, index) => (
                <motion.div
                  key={nft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NFTCard nft={nft} />
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="glass-card overflow-hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {mockActivity.map((item, index) => (
                  <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.type === 'buy' ? 'bg-green-100 text-green-600' :
                        item.type === 'sell' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {item.type === 'buy' ? 'B' : item.type === 'sell' ? 'S' : 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.type === 'buy' ? 'Bought' : item.type === 'sell' ? 'Sold' : 'Bid on'} {item.item}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.date}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.type === 'buy' ? '-' : '+'}{item.price} TON
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
