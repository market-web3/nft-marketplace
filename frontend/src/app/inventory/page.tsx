'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Download, 
  Upload, 
  Gift, 
  Search,
  Filter
} from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

const tabs = [
  { id: 'all', label: 'All Items', icon: Package },
  { id: 'deposited', label: 'Deposited', icon: Download },
  { id: 'listed', label: 'Listed', icon: Upload },
  { id: 'gifts', label: 'Telegram Gifts', icon: Gift },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              My Inventory
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your NFTs, deposits, and Telegram gifts
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDepositModalOpen(true)}
              icon={<Download className="w-4 h-4" />}
            >
              Deposit NFT
            </Button>
            <Button
              icon={<Upload className="w-4 h-4" />}
            >
              List for Sale
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Items', value: 24, color: 'blue' },
            { label: 'Deposited', value: 12, color: 'green' },
            { label: 'Listed', value: 8, color: 'purple' },
            { label: 'Gifts', value: 4, color: 'amber' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl p-4 border border-${stat.color}-200 dark:border-${stat.color}-800`}
            >
              <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.value}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search your inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pb-12"
        >
          {activeTab === 'gifts' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                >
                  <div className="aspect-square bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Gift className="w-16 h-16 text-white" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Telegram Gift #{i}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Received from @user{i}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" fullWidth>
                        Withdraw
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <NFTCard
                  key={i}
                  nft={{
                    id: `inventory-${i}`,
                    name: `Inventory NFT #${i}`,
                    imageUrl: `https://picsum.photos/400/300?random=${i + 200}`,
                    price: activeTab === 'listed' ? 1500000000 * i : undefined,
                    status: activeTab === 'listed' ? 'listed' : 'active',
                    likes: 5 * i,
                    owner: {
                      walletAddress: 'EQD...1234',
                    },
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Deposit NFT"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to deposit
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
              <li>Copy the marketplace deposit address</li>
              <li>Send your NFT to this address from your wallet</li>
              <li>Wait for confirmation (usually 1-2 minutes)</li>
              <li>Your NFT will appear in your deposited items</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Deposit Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value="EQCkW2Ucbl0Gw3P8mT..."
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText('EQCkW2Ucbl0Gw3P8mT...')}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsDepositModalOpen(false)}
            >
              Cancel
            </Button>
            <Button fullWidth>
              I&apos;ve Sent the NFT
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
