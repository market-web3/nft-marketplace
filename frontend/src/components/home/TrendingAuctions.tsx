'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, Flame } from 'lucide-react';
import { AuctionCard } from '@/components/common/AuctionCard';

const trendingAuctions = [
  {
    id: 'a1',
    name: 'Legendary Dragon #001',
    image: '/nfts/dragon.jpg',
    currentBid: 150,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 3,
    bidCount: 23,
    creator: { name: 'Dragon Studio', avatar: '/avatars/5.jpg', verified: true },
    minBidIncrement: 5,
  },
  {
    id: 'a2',
    name: 'Golden Crown Supreme',
    image: '/nfts/crown.jpg',
    currentBid: 89.5,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 7,
    bidCount: 15,
    creator: { name: 'Royal Arts', avatar: '/avatars/6.jpg', verified: true },
    minBidIncrement: 2.5,
  },
  {
    id: 'a3',
    name: 'Crypto Punk TON Edition',
    image: '/nfts/punk.jpg',
    currentBid: 210,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 2,
    bidCount: 45,
    creator: { name: 'Punk Labs', avatar: '/avatars/7.jpg', verified: true },
    minBidIncrement: 10,
  },
  {
    id: 'a4',
    name: 'Metaverse Land Plot #445',
    image: '/nfts/land.jpg',
    currentBid: 340,
    currency: 'TON',
    endTime: Date.now() + 86400000 * 5,
    bidCount: 32,
    creator: { name: 'Meta Estates', avatar: '/avatars/8.jpg', verified: false },
    minBidIncrement: 15,
  },
];

export function TrendingAuctions() {
  return (
    <section className="py-20 bg-gradient-to-b from-transparent via-blue-50/50 to-transparent dark:via-blue-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Trending Auctions
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Live auctions ending soon - bid now!
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/auctions">
              <motion.button
                whileHover={{ x: 5 }}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                All Auctions
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingAuctions.map((auction, index) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AuctionCard auction={auction} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
