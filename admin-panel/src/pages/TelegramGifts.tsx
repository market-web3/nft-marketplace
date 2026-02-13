import { useState, useEffect } from 'react'
import { 
  Gift, Check, X, RefreshCw, Search, 
  Send, Loader2, Package, TrendingUp 
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface GiftItem {
  id: string
  name: string
  value: number
  status: 'deposited' | 'withdrawn' | 'pending' | 'pending_withdrawal'
  telegramId: string
  userId: string
  userUsername?: string
  depositedAt: string
  withdrawnAt?: string
}

export function TelegramGifts() {
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null)
  const [recipientId, setRecipientId] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchGifts()
  }, [])

  const fetchGifts = async () => {
    setIsLoading(true)
    try {
      // In production, this would be an API call
      const mockGifts: GiftItem[] = [
        {
          id: '1',
          name: 'Star Gift #1234',
          value: 10,
          status: 'deposited',
          telegramId: '123456789',
          userId: 'user1',
          userUsername: 'john_doe',
          depositedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          name: 'Premium Box',
          value: 50,
          status: 'pending_withdrawal',
          telegramId: '987654321',
          userId: 'user2',
          userUsername: 'jane_smith',
          depositedAt: '2024-01-14T15:30:00Z',
        },
      ]
      setGifts(mockGifts)
    } catch (error) {
      toast.error('Failed to fetch gifts')
    } finally {
      setIsLoading(false)
    }
  }

  const syncWithTelegram = async () => {
    setIsLoading(true)
    try {
      // API call to sync
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Sync completed')
      await fetchGifts()
    } catch (error) {
      toast.error('Sync failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendGift = async () => {
    if (!selectedGift || !recipientId) return
    
    setIsSending(true)
    try {
      // API call to send gift
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Gift sent to ${recipientId}`)
      setSelectedGift(null)
      setRecipientId('')
      await fetchGifts()
    } catch (error) {
      toast.error('Failed to send gift')
    } finally {
      setIsSending(false)
    }
  }

  const handleApproveWithdrawal = async (giftId: string) => {
    try {
      // API call to approve
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Withdrawal approved')
      await fetchGifts()
    } catch (error) {
      toast.error('Failed to approve')
    }
  }

  const handleRejectWithdrawal = async (giftId: string) => {
    try {
      // API call to reject
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Withdrawal rejected')
      await fetchGifts()
    } catch (error) {
      toast.error('Failed to reject')
    }
  }

  const filteredGifts = gifts.filter(gift => {
    const matchesSearch = 
      gift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.userUsername?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || gift.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: gifts.length,
    deposited: gifts.filter(g => g.status === 'deposited').length,
    pending: gifts.filter(g => g.status === 'pending_withdrawal').length,
    totalValue: gifts.reduce((sum, g) => sum + g.value, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Telegram Gifts</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage Telegram gift deposits and withdrawals</p>
        </div>
        <button
          onClick={syncWithTelegram}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sync with Telegram
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Gifts</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Deposited</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.deposited}</p>
            </div>
          </div>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Loader2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalValue} TON</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search gifts or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="deposited">Deposited</option>
          <option value="pending_withdrawal">Pending Withdrawal</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Gifts Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Gift</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Deposited</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredGifts.map((gift) => (
                <tr key={gift.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
                        🎁
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{gift.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {gift.userUsername || gift.telegramId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {gift.value} TON
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      gift.status === 'deposited' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      gift.status === 'pending_withdrawal' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {gift.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(gift.depositedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {gift.status === 'deposited' && (
                        <button
                          onClick={() => setSelectedGift(gift)}
                          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          title="Send Gift"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {gift.status === 'pending_withdrawal' && (
                        <>
                          <button
                            onClick={() => handleApproveWithdrawal(gift.id)}
                            className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(gift.id)}
                            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Gift Modal */}
      {selectedGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="admin-card p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Send Gift: {selectedGift.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Telegram ID
                </label>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter Telegram ID"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendGift}
                  disabled={!recipientId || isSending}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Gift
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedGift(null)
                    setRecipientId('')
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
