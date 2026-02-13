'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    imageUrl: string;
    price?: number;
    status: string;
    likes: number;
    owner: {
      username?: string;
      avatarUrl?: string;
      walletAddress: string;
    };
    listingType?: 'fixed' | 'auction';
    expiresAt?: string;
  };
  variant?: 'default' | 'compact';
}

export function NFTCard({ nft, variant = 'default' }: NFTCardProps) {
  const isCompact = variant === 'compact';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
    >
      <Link href={`/nft/${nft.id}`}>
        {/* Image Container */}
        <div className={`relative ${isCompact ? 'aspect-square' : 'aspect-[4/3]'} overflow-hidden`}>
          <Image
            src={nft.imageUrl}
            alt={nft.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Type Badge */}
          {nft.listingType && (
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
              nft.listingType === 'auction' 
                ? 'bg-amber-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              {nft.listingType === 'auction' ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Auction
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Buy Now
                </span>
              )}
            </div>
          )}

          {/* Likes */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              // Handle like
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-slate-900/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </motion.button>

          {/* Price Overlay */}
          {nft.price && (
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Current Price</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {(nft.price / 1e9).toFixed(2)} TON
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-4 ${isCompact ? 'p-3' : ''}`}>
          <h3 className={`font-semibold text-slate-900 dark:text-white truncate ${
            isCompact ? 'text-sm' : 'text-base'
          }`}>
            {nft.name}
          </h3>

          {!isCompact && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {nft.owner.username || 
                    `${nft.owner.walletAddress.slice(0, 6)}...${nft.owner.walletAddress.slice(-4)}`}
                </span>
              </div>
              <span className="text-sm text-slate-400">
                {nft.likes} likes
              </span>
            </div>
          )}

          {/* Auction Timer */}
          {nft.listingType === 'auction' && nft.expiresAt && (
            <div className="mt-3 flex items-center text-amber-600 dark:text-amber-400 text-sm">
              <Clock className="w-4 h-4 mr-1" />
              Ends {formatDistanceToNow(new Date(nft.expiresAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
