import { useState } from 'react'
import { Search, Filter, Clock, Play, Square, MoreHorizontal, TrendingUp, Gavel } from 'lucide-react'
import toast from 'react-hot-toast'

const mockAuctions = [
  { id: 'a1', name: 'Legendary Dragon #001', currentBid: 150, startPrice: 50, bids: 23, status: 'active', endTime: '2024-02-15', creator: 'DragonStudio' },
  { id: 'a2', name: 'Golden Crown Supreme', currentBid: 89.5, startPrice: 30, bids: 15, status: 'active', endTime: '2024-02-20', creator: 'RoyalArts' },
  { id: 'a3', name: 'Crypto Punk TON Edition', currentBid: 210, startPrice: 100, bids: 45, status: 'ended', endTime: '2024-01-10', creator: 'PunkLabs' },
  { id: 'a4', name: 'Metaverse Land Plot #445', currentBid: 340, startPrice: 200, bids: 32, status: 'pending', endTime: '2024-02-25', creator: 'MetaEstates' },
]

export function AuctionManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredAuctions = mockAuctions.filter((auction) => {
    const matchesSearch = auction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         auction.creator.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || auction.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStartAuction = (auctionId: string) => {
    toast.success(`Auction ${auctionId} started successfully`)
  }

  const handleEndAuction = (auctionId: string) => {
    toast.success(`Auction ${auctionId} ended successfully`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auction Management</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage all auctions on the platform</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="admin-btn-primary flex items-center gap-2"
        >
          <Gavel className="w-4 h-4" />
          Create Auction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Auctions', value: '89', color: 'green' },
          { label: 'Total Volume', value: '12.5K TON', color: 'blue' },
          { label: 'Total Bids', value: '2,456', color: 'purple' },
          { label: 'Avg. Duration', value: '14 days', color: 'orange' },
        ].map((stat, index) => (
          <div key={index} className="admin-card p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input w-full pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      </div>

      {/* Auctions Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Auction</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Start Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Current Bid</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Bids</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">End Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredAuctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500" />
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white block">{auction.name}</span>
                        <span className="text-sm text-slate-500">{auction.creator}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{auction.startPrice} TON</td>
                  <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{auction.currentBid} TON</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{auction.bids}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{auction.endTime}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      auction.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                      auction.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700'
                    }`}>
                      {auction.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {auction.status === 'pending' && (
                        <button
                          onClick={() => handleStartAuction(auction.id)}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Start Auction"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {auction.status === 'active' && (
                        <button
                          onClick={() => handleEndAuction(auction.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="End Auction"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="View Details">
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
