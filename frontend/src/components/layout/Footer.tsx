'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Twitter, 
  Github, 
  MessageCircle, 
  Send,
  Gem
} from 'lucide-react';

const footerLinks = {
  marketplace: [
    { label: 'All NFTs', href: '/market' },
    { label: 'Categories', href: '/categories' },
    { label: 'Auctions', href: '/auctions' },
    { label: 'Trending', href: '/trending' },
  ],
  account: [
    { label: 'Profile', href: '/profile' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'Watchlist', href: '/watchlist' },
    { label: 'Settings', href: '/settings' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/api' },
    { label: 'Community', href: '/community' },
    { label: 'Help Center', href: '/help' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: MessageCircle, href: 'https://discord.com', label: 'Discord' },
  { icon: Send, href: 'https://t.me', label: 'Telegram' },
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TON NFT</span>
            </Link>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              Discover, collect, and trade extraordinary NFTs on the TON blockchain. 
              The premier marketplace for digital collectibles.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} TON NFT Marketplace. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-sm hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
