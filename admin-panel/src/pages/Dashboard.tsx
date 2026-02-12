import { useEffect, useState } from 'react'
import { 
  TrendingUp, Users, Image, DollarSign, 
  Activity, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const stats = [
  { label: 'Total Revenue', value: '1,245.5 TON', change: '+12.5%', isPositive: true, icon: DollarSign, color: 'green' },
  { label: 'Total NFTs', value: '3,456', change: '+8.2%', isPositive: true, icon: Image, color: 'blue' },
  { label: 'Active Users', value: '1,234', change: '+15.3%', isPositive: true, icon: Users, color: 'purple' },
  { label: 'Active Auctions', value: '89', change: '-2.1%', isPositive: false, icon: Activity, color: 'orange' },
]

const salesData = [
  { name: 'Mon', sales: 12, volume: 45 },
  { name: 'Tue', sales: 19, volume: 78 },
  { name: 'Wed', sales: 15, volume: 62 },
  { name: 'Thu', sales: 25, volume: 98 },
  { name: 'Fri', sales: 32, volume: 145 },
  { name: 'Sat', sales: 28, volume: 125 },
  { name: 'Sun', sales: 35, volume: 165 },
]

const recentActivity = [
  { type: 'sale', item: 'Cosmic Wanderer #001', price: '25.5 TON', user: 'User123', time: '2 min ago' },
  { type: 'auction', item: 'Legendary Dragon', bid: '150 TON', user: 'Collector99', time: '5 min ago' },
  { type: 'offer', item: 'Digital Genesis', offer: '42 TON', user: 'ArtLover', time: '12 min ago' },
  { type: 'gift', item: 'Star Gift #1234', action: 'Deposited', user: 'TelegramUser', time: '15 min ago' },
]

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setLastUpdated(new Date())
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="admin-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Sales Volume (7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Daily Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-card">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {recentActivity.map((activity, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                  activity.type === 'auction' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'offer' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {activity.type[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{activity.item}</p>
                  <p className="text-sm text-slate-500">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {activity.price && (
                  <p className="font-semibold text-slate-900 dark:text-white">{activity.price}</p>
                )}
                {activity.bid && (
                  <p className="font-semibold text-blue-600">Bid: {activity.bid}</p>
                )}
                {activity.offer && (
                  <p className="font-semibold text-purple-600">Offer: {activity.offer}</p>
                )}
                {activity.action && (
                  <p className="font-semibold text-orange-600">{activity.action}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
