'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Flame, Gavel, Verified } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuctionCardProps {
  auction: {
    id: string;
    name: string;
    image: string;
    currentBid: number;
    currency: string;
    endTime: number;
    bidCount: number;
    creator: {
      name: string;
      avatar: string;
      verified: boolean;
    };
    minBidIncrement: number;
  };
}

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime - Date.now();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1">
      <div className="countdown-box">
        {formatNumber(timeLeft.days)}
      </div>
      <span className="text-slate-400">:</span>
      <div className="countdown-box">
        {formatNumber(timeLeft.hours)}
      </div>
      <span className="text-slate-400">:</span>
      <div className="countdown-box">
        {formatNumber(timeLeft.minutes)}
      </div>
      <span className="text-slate-400">:</span>
      <div className="countdown-box">
        {formatNumber(timeLeft.seconds)}
      </div>
    </div>
  );
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const isEndingSoon = auction.endTime - Date.now() < 86400000; // Less than 24 hours

  return (
    <Link href={`/auction/${auction.id}`}>
      <motion.div
        whileHover={{ y: -8 }}
        className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500" />
          
          {/* Live Badge */}
          <div className="absolute top-3 left-3 z-20">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </motion.div>
          </div>

          {/* Ending Soon Badge */}
          {isEndingSoon && (
            <div className="absolute top-3 right-3 z-20">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-medium">
                <Flame className="w-3 h-3" />
                Ending Soon
              </div>
            </div>
          )}

          {/* Timer Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <CountdownTimer endTime={auction.endTime} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Creator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {auction.creator.name}
            </span>
            {auction.creator.verified && (
              <Verified className="w-4 h-4 text-blue-500" />
            )}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 truncate">
            {auction.name}
          </h3>

          {/* Bid Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Bid</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {auction.currentBid} {auction.currency}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bids</p>
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <Gavel className="w-4 h-4" />
                {auction.bidCount}
              </p>
            </div>
          </div>

          {/* Bid Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            Place Bid (+{auction.minBidIncrement} {auction.currency})
          </motion.button>
        </div>
      </motion.div>
    </Link>
  );
}
