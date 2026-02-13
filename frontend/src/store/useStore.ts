/**
 * Global State Store
 * Zustand store for managing app state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
}

interface NFT {
  id: string;
  address: string;
  name: string;
  description?: string;
  imageUrl: string;
  price?: number;
  category?: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    username?: string;
    avatarUrl?: string;
    walletAddress: string;
  };
  status: 'active' | 'listed' | 'sold';
  likes: number;
  views: number;
}

interface CartItem {
  nft: NFT;
  quantity: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface StoreState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (nft: NFT) => void;
  removeFromCart: (nftId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: () => number;

  // UI State
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Filters
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy: 'price' | 'createdAt' | 'views' | 'likes';
    sortOrder: 'asc' | 'desc';
  };
  setFilters: (filters: Partial<StoreState['filters']>) => void;
  resetFilters: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // Cart
      cart: [],
      addToCart: (nft) => {
        const { cart } = get();
        const existing = cart.find((item) => item.nft.id === nft.id);
        
        if (existing) {
          return;
        }

        set({ cart: [...cart, { nft, quantity: 1 }] });
      },
      removeFromCart: (nftId) => {
        set({ cart: get().cart.filter((item) => item.nft.id !== nftId) });
      },
      clearCart: () => set({ cart: [] }),
      cartTotal: () => {
        return get().cart.reduce((total, item) => {
          return total + (item.nft.price || 0) * item.quantity;
        }, 0);
      },

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Math.random().toString(36).substring(7),
          read: false,
        };
        set({ notifications: [newNotification, ...get().notifications] });
      },
      markNotificationRead: (id) => {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        });
      },
      clearNotifications: () => set({ notifications: [] }),
      unreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      // UI State
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      sidebarOpen: true,
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      // Filters
      filters: {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      setFilters: (newFilters) => {
        set({ filters: { ...get().filters, ...newFilters } });
      },
      resetFilters: () => {
        set({
          filters: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        });
      },
    }),
    {
      name: 'nft-marketplace-storage',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        cart: state.cart,
        filters: state.filters,
      }),
    }
  )
);
