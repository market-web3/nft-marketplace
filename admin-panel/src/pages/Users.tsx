import { useState } from 'react'
import { Search, User, Ban, CheckCircle, Mail, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const mockUsers = [
  { id: 'u1', name: 'John Doe', email: 'john@example.com', wallet: 'EQ...1234', nfts: 12, volume: 125.5, status: 'active', joined: '2024-01-01' },
  { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', wallet: 'EQ...5678', nfts: 8, volume: 89.2, status: 'active', joined: '2024-01-05' },
  { id: 'u3', name: 'Bob Wilson', email: 'bob@example.com', wallet: 'EQ...9012', nfts: 3, volume: 12.5, status: 'banned', joined: '2024-01-10' },
  { id: 'u4', name: 'Alice Brown', email: 'alice@example.com', wallet: 'EQ...3456', nfts: 25, volume: 456.8, status: 'active', joined: '2023-12-20' },
]

export function Users() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.wallet.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleBan = (userId: string) => {
    toast.success(`User ${userId} banned`)
  }

  const handleUnban = (userId: string) => {
    toast.success(`User ${userId} unbanned`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage platform users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '3,456', color: 'blue' },
          { label: 'Active', value: '3,234', color: 'green' },
          { label: 'Banned', value: '23', color: 'red' },
          { label: 'New Today', value: '45', color: 'purple' },
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
              placeholder="Search users..."
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
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Wallet</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">NFTs</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Volume</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white block">{user.name}</span>
                        <span className="text-sm text-slate-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">{user.wallet}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{user.nfts}</td>
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{user.volume} TON</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{user.joined}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="View">
                        <User className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Email">
                        <Mail className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleBan(user.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Ban"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnban(user.id)}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Unban"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
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
