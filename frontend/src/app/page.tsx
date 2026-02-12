'use client';

import { Hero } from '@/components/hero';
import { FeaturedNFTs } from '@/components/featured-nfts';
import { Categories } from '@/components/categories';
import { Stats } from '@/components/stats';
import { HowItWorks } from '@/components/how-it-works';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Stats />
      <FeaturedNFTs />
      <Categories />
      <HowItWorks />
    </main>
  );
}
