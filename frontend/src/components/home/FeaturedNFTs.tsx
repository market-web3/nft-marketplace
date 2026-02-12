'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Heart, Eye } from 'lucide-react';
import { NFTCard } from '@/components/common/NFTCard';
import { useMarketStore } from '@/store/marketStore';

const featuredNFTs = [
  {
    id: '1',
    name: 'Cosmic Wanderer #001',
    image: '/nfts/cosmic-1.jpg',
    price: 25.5,
    currency: 'TON',
    creator: { name: 'Cosmic Arts', avatar: '/avatars/1.jpg', verified: true },
    likes: 234,
    views: 1205,
    category: 'Art',
  },
  {
    id: '2',
    name: 'Digital Genesis',
    image: '/nfts/genesis.jpg',
    price: 42.0,
    currency: 'TON',
    creator: { name: 'Pixel Master', avatar: '/avatars/2.jpg', verified: true },
    likes: 189,
    views: 892,
    category: 'Art',
  },
  {
    id: '3',
    name: 'Neon Cyberpunk #77',
    image: '/nfts/cyber.jpg',
    price: 18.25,
    currency: 'TON',
    creator: { name: 'Cyber Labs', avatar: '/avatars/3.jpg', verified: false },
    likes: 156,
    views: 743,
    category: 'Gaming',
  },
  {
    id: '4',
    name: 'Abstract Thoughts',
    image: '/nfts/abstract.jpg',
    price: 35.0,
    currency: 'TON',
    creator: { name: 'ArtFlow', avatar: '/avatars/4.jpg', verified: true },
    likes: 312,
    views: 1567,
    category: 'Art',
  },
];

export function FeaturedNFTs() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Featured NFTs
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Handpicked digital collectibles from top creators
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/market">
              <motion.button
                whileHover={{ x: 5 }}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                View All
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredNFTs.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <NFTCard nft={nft} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
