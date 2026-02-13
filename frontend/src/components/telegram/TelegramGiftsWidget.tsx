'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ExternalLink, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Gift {
  id: string;
  name: string;
  value: number;
  status: 'deposited' | 'withdrawn' | 'pending';
  depositedAt: string;
}

interface TelegramGiftsWidgetProps {
  gifts: Gift[];
  isLoading?: boolean;
  onDeposit?: () => void;
  onWithdraw?: (giftId: string) => void;
}

export function TelegramGiftsWidget({ 
  gifts, 
  isLoading = false, 
  onDeposit, 
  onWithdraw 
}: TelegramGiftsWidgetProps) {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  
  const depositedGifts = gifts.filter(g => g.status === 'deposited');
  const totalValue = depositedGifts.reduce((sum, g) => sum + g.value, 0);

  const handleWithdraw = (giftId: string) => {
    setSelectedGift(giftId);
    onWithdraw?.(giftId);
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Telegram Gifts</h3>
              <p className="text-sm text-slate-500">{depositedGifts.length} gifts • {totalValue.toFixed(2)} TON</p>
            </div>
          </div>
          <button
            onClick={onDeposit}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title="Deposit Gift"
          >
            <ArrowDownRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gifts List */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : depositedGifts.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Gift className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No gifts deposited yet</p>
            <button
              onClick={onDeposit}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              Deposit your first gift
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {depositedGifts.map((gift) => (
              <motion.div
                key={gift.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
                    🎁
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{gift.name}</p>
                    <p className="text-xs text-slate-500">{gift.value} TON</p>
                  </div>
                </div>
                <button
                  onClick={() => handleWithdraw(gift.id)}
                  disabled={selectedGift === gift.id}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all"
                  title="Withdraw to Telegram"
                >
                  {selectedGift === gift.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <a
          href="https://t.me/YourNFTMarketplaceBot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Open Telegram Bot
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
