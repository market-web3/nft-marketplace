import { useState } from 'react'
import { Search, CheckCircle, XCircle, Clock, DollarSign, HandCoins } from 'lucide-react'
import toast from 'react-hot-toast'

const mockOffers = [
  { id: 'o1', nftName: 'Cosmic Wanderer #001', offerAmount: 20, from: 'Collector1', expiresIn: '2 hours', status: 'pending' },
  { id: 'o2', nftName: 'Digital Genesis', offerAmount: 35, from: 'ArtLover', expiresIn: '5 hours', status: 'pending' },
  { id: 'o3', nftName: 'Neon Cyberpunk #77', offerAmount: 15, from: 'GamerPro', expiresIn: '1 day', status: 'accepted' },
  { id: 'o4', nftName: 'Abstract Thoughts', offerAmount: 30, from: 'Buyer99', expiresIn: 'Expired', status: 'expired' },
]

export function OffersManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredOffers = mockOffers.filter((offer) => {
    const matchesSearch = offer.nftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.from.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAccept = (offerId: string) => {
    toast.success(`Offer ${offerId} accepted`)
  }

  const handleReject = (offerId: string) => {
    toast.success(`Offer ${offerId} rejected`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Offers Management</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage all offers on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Offers', value: '156', color: 'yellow' },
          { label: 'Accepted Today', value: '23', color: 'green' },
          { label: 'Total Volume', value: '5.2K TON', color: 'blue' },
          { label: 'Avg. Offer', value: '18.5 TON', color: 'purple' },
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
              placeholder="Search offers..."
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
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Offers Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">NFT</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Offer Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">From</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Expires</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{offer.nftName}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{offer.offerAmount} TON</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{offer.from}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{offer.expiresIn}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      offer.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' :
                      offer.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                      offer.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700'
                    }`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {offer.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(offer.id)}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Accept"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(offer.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
