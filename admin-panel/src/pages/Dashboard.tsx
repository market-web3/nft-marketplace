import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Image,
  Gavel,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Volume',
    value: '12,450 TON',
    change: '+23%',
    trend: 'up',
    icon: DollarSign,
    color: 'blue',
  },
  {
    title: 'Total Users',
    value: '2,847',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'green',
  },
  {
    title: 'NFTs Listed',
    value: '1,234',
    change: '+8%',
    trend: 'up',
    icon: Image,
    color: 'purple',
  },
  {
    title: 'Active Auctions',
    value: '89',
    change: '-3%',
    trend: 'down',
    icon: Gavel,
    color: 'amber',
  },
];

const recentActivity = [
  { type: 'sale', nft: 'Cosmic Explorer #001', amount: '2.5 TON', time: '2 min ago', user: '0x1234...5678' },
  { type: 'listing', nft: 'Digital Dreamscape', amount: '1.8 TON', time: '5 min ago', user: '0x8765...4321' },
  { type: 'bid', nft: 'Abstract Harmony', amount: '3.2 TON', time: '12 min ago', user: '0xabcd...efgh' },
  { type: 'deposit', nft: 'Neon Genesis', amount: '-', time: '15 min ago', user: '0x9876...5432' },
];

export function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of your marketplace</p>
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className={`flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  {stat.change}
                </span>
                <span className="text-sm text-slate-400 ml-2">vs last week</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Volume Trend
          </h3>
          <div className="h-64 bg-slate-100 dark:bg-slate-700/50 rounded-xl flex items-center justify-center">
            <p className="text-slate-400">Chart placeholder</p>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activity.type === 'sale' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                  activity.type === 'listing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  activity.type === 'bid' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                }`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}: {activity.nft}
                  </p>
                  <p className="text-sm text-slate-500">{activity.user}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900 dark:text-white">{activity.amount}</p>
                  <p className="text-sm text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pending Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Pending Approvals
          </h3>
          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">
            5 pending
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-medium">NFT</th>
                <th className="pb-3 font-medium">Seller</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Listed</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        NFT #{i}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-400">0x1234...{i}</td>
                  <td className="py-4 text-slate-900 dark:text-white font-medium">{i * 1.5} TON</td>
                  <td className="py-4 text-slate-500">{i} hours ago</td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                        Approve
                      </button>
                      <button className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
