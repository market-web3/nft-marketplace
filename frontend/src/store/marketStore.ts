import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NFT {
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
}

interface Auction {
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
}

interface UserProfile {
  address: string;
  name: string;
  avatar: string;
  bio: string;
  joinedAt: string;
  totalVolume: number;
  nftsOwned: number;
  nftsCreated: number;
  followers: number;
  following: number;
}

interface MarketState {
  // User data
  user: UserProfile | null;
  isConnected: boolean;
  notifications: number;
  
  // NFTs
  featuredNFTs: NFT[];
  allNFTs: NFT[];
  userNFTs: NFT[];
  
  // Auctions
  activeAuctions: Auction[];
  userBids: Auction[];
  
  // Filters
  selectedCategory: string | null;
  priceRange: { min: number; max: number } | null;
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setIsConnected: (connected: boolean) => void;
  setNotifications: (count: number) => void;
  setSelectedCategory: (category: string | null) => void;
  setPriceRange: (range: { min: number; max: number } | null) => void;
  setSortBy: (sort: 'price_asc' | 'price_desc' | 'newest' | 'popular') => void;
  addNotification: () => void;
  clearNotifications: () => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isConnected: false,
      notifications: 0,
      featuredNFTs: [],
      allNFTs: [],
      userNFTs: [],
      activeAuctions: [],
      userBids: [],
      selectedCategory: null,
      priceRange: null,
      sortBy: 'newest',

      // Actions
      setUser: (user) => set({ user }),
      setIsConnected: (connected) => set({ isConnected: connected }),
      setNotifications: (count) => set({ notifications: count }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setPriceRange: (range) => set({ priceRange: range }),
      setSortBy: (sort) => set({ sortBy: sort }),
      addNotification: () => set((state) => ({ notifications: state.notifications + 1 })),
      clearNotifications: () => set({ notifications: 0 }),
    }),
    {
      name: 'market-storage',
      partialize: (state) => ({
        user: state.user,
        selectedCategory: state.selectedCategory,
        sortBy: state.sortBy,
      }),
    }
  )
);
