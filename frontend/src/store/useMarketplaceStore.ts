/**
 * Marketplace State Store
 * Manages marketplace-specific state
 */

import { create } from 'zustand';

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  totalNfts: number;
}

interface Stats {
  totalVolume: number;
  totalTrades: number;
  activeListings: number;
  totalNfts: number;
  volume24h: number;
}

interface MarketplaceState {
  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;

  // Stats
  stats: Stats | null;
  setStats: (stats: Stats) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;

  // Featured & Trending
  featuredNFTs: any[];
  setFeaturedNFTs: (nfts: any[]) => void;
  trendingNFTs: any[];
  setTrendingNFTs: (nfts: any[]) => void;

  // Loading states
  isLoadingCategories: boolean;
  setIsLoadingCategories: (loading: boolean) => void;
  isLoadingStats: boolean;
  setIsLoadingStats: (loading: boolean) => void;

  // Refresh
  lastRefresh: number;
  refresh: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),
  selectedCategory: null,
  setSelectedCategory: (id) => set({ selectedCategory: id }),

  // Stats
  stats: null,
  setStats: (stats) => set({ stats }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),

  // Featured & Trending
  featuredNFTs: [],
  setFeaturedNFTs: (nfts) => set({ featuredNFTs: nfts }),
  trendingNFTs: [],
  setTrendingNFTs: (nfts) => set({ trendingNFTs: nfts }),

  // Loading states
  isLoadingCategories: false,
  setIsLoadingCategories: (loading) => set({ isLoadingCategories: loading }),
  isLoadingStats: false,
  setIsLoadingStats: (loading) => set({ isLoadingStats: loading }),

  // Refresh
  lastRefresh: Date.now(),
  refresh: () => set({ lastRefresh: Date.now() }),
}));
