'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, Verified } from 'lucide-react';
import { useState } from 'react';

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    image: string;
    price: number;
    currency: string;
    creator: {
      name: string;
      avatar: string;
      verified: boolean;
    };
    likes: number;
    views: number;
    category: string;
  };
}

export function NFTCard({ nft }: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(nft.likes);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <Link href={`/nft/${nft.id}`}>
      <motion.div
        whileHover={{ y: -8 }}
        className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
          
          {/* Placeholder gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500`} />
          
          {/* Actions Overlay */}
          <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm">
              {nft.category}
            </span>
          </div>

          {/* Views */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 text-white text-sm">
            <Eye className="w-4 h-4" />
            {nft.views.toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Creator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {nft.creator.name}
            </span>
            {nft.creator.verified && (
              <Verified className="w-4 h-4 text-blue-500" />
            )}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 truncate">
            {nft.name}
          </h3>

          {/* Price & Likes */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Price</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {nft.price} {nft.currency}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Likes</p>
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {likeCount}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
