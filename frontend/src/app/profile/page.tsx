'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Wallet, Package, Heart, 
  Settings, Bell, Link, ExternalLink,
  Edit3, Copy, CheckCircle, LogOut,
  Telegram
} from 'lucide-react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { TelegramConnect } from '@/components/telegram/TelegramConnect';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'nfts', label: 'My NFTs', icon: Package },
  { id: 'activity', label: 'Activity', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const stats = [
  { label: 'Total NFTs', value: '12', icon: Package },
  { label: 'Listed', value: '3', icon: Wallet },
  { label: 'Favorites', value: '8', icon: Heart },
  { label: 'Volume', value: '245 TON', icon: Wallet },
];

const recentActivity = [
  { type: 'sale', item: 'Cosmic Wanderer #001', price: '25 TON', time: '2 hours ago' },
  { type: 'purchase', item: 'Digital Dragon', price: '45 TON', time: '1 day ago' },
  { type: 'listing', item: 'Abstract Art #42', price: '15 TON', time: '2 days ago' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showTelegramConnect, setShowTelegramConnect] = useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('EQD...8X2A');
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTelegramConnect = (telegramId: string) => {
    setIsTelegramConnected(true);
    setShowTelegramConnect(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                JD
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
              >
                <Edit3 className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                John Doe
              </h1>
              <p className="text-slate-500 dark:text-slate-400">@johndoe</p>
              
              {/* Wallet Address */}
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                  EQD...8X2A
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                <button
                  onClick={() => setShowTelegramConnect(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isTelegramConnected
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Telegram className="w-4 h-4" />
                  {isTelegramConnected ? 'Telegram Connected' : 'Connect Telegram'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <TonConnectButton />
              <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm">
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="glass-card">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                            activity.type === 'purchase' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {activity.type === 'sale' ? '↓' : activity.type === 'purchase' ? '↑' : '📋'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{activity.item}</p>
                            <p className="text-sm text-slate-500">{activity.time}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {activity.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'nfts' && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">Your NFTs will appear here</p>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">Full activity history will appear here</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    defaultValue="johndoe"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Telegram Connect Modal */}
      <TelegramConnect
        isOpen={showTelegramConnect}
        onClose={() => setShowTelegramConnect(false)}
        onConnect={handleTelegramConnect}
      />
    </div>
  );
}
