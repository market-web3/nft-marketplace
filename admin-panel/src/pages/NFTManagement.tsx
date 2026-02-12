import { useState } from 'react'
import { Search, Filter, MoreHorizontal, CheckCircle, XCircle, Eye, Edit, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const mockNFTs = [
  { id: '1', name: 'Cosmic Wanderer #001', price: 25.5, category: 'Art', creator: 'Artist1', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: 'Digital Genesis', price: 42, category: 'Art', creator: 'Artist2', status: 'active', createdAt: '2024-01-14' },
  { id: '3', name: 'Neon Cyberpunk #77', price: 18.25, category: 'Gaming', creator: 'Gamer1', status: 'pending', createdAt: '2024-01-13' },
  { id: '4', name: 'Abstract Thoughts', price: 35, category: 'Art', creator: 'Artist3', status: 'sold', createdAt: '2024-01-12' },
  { id: '5', name: 'Gaming Asset #001', price: 12.5, category: 'Gaming', creator: 'Dev1', status: 'active', createdAt: '2024-01-11' },
]

export function NFTManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([])
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<any>(null)

  const filteredNFTs = mockNFTs.filter((nft) => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.creator.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || nft.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApprove = (nft: any) => {
    setSelectedNFT(nft)
    setIsApproveModalOpen(true)
  }

  const confirmApprove = () => {
    toast.success(`NFT "${selectedNFT.name}" approved successfully`)
    setIsApproveModalOpen(false)
    setSelectedNFT(null)
  }

  const handleDelete = (nftId: string) => {
    if (confirm('Are you sure you want to delete this NFT?')) {
      toast.success('NFT deleted successfully')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">NFT Management</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage all NFTs on the platform</p>
        </div>
        <button className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create NFT
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search NFTs..."
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
            <option value="sold">Sold</option>
          </select>
          <button className="admin-btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* NFT Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">NFT</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Creator</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredNFTs.map((nft) => (
                <tr key={nft.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500" />
                      <span className="font-medium text-slate-900 dark:text-white">{nft.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{nft.category}</td>
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{nft.price} TON</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{nft.creator}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      nft.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                      nft.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700'
                    }`}>
                      {nft.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {nft.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(nft)}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(nft.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Approve NFT</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to approve <strong>{selectedNFT?.name}</strong>?
              This will make the NFT visible on the marketplace.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="flex-1 admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="flex-1 admin-btn-primary"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
