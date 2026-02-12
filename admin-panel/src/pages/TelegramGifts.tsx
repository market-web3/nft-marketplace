import { useState } from 'react'
import { Send, Download, RefreshCw, CheckCircle, XCircle, Gift, User } from 'lucide-react'
import toast from 'react-hot-toast'

const mockGifts = [
  { id: 'g1', name: 'Star Gift #1234', sender: '@user1', status: 'deposited', value: 5, date: '2024-01-15' },
  { id: 'g2', name: 'Rocket Gift #567', sender: '@user2', status: 'withdrawn', value: 8, date: '2024-01-14' },
  { id: 'g3', name: 'Heart Gift #890', sender: '@user3', status: 'pending', value: 3, date: '2024-01-13' },
  { id: 'g4', name: 'Star Gift #5678', sender: '@user4', status: 'deposited', value: 5, date: '2024-01-12' },
]

const pendingWithdrawals = [
  { id: 'w1', giftName: 'Star Gift #999', recipient: '@collector1', requestDate: '2024-01-15' },
  { id: 'w2', giftName: 'Rocket Gift #333', recipient: '@collector2', requestDate: '2024-01-14' },
]

export function TelegramGifts() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSync = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      toast.success('Gifts synchronized with Telegram')
    }, 1500)
  }

  const handleApproveWithdrawal = (id: string) => {
    toast.success(`Withdrawal ${id} approved and sent`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Telegram Gifts</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage off-chain Telegram NFT gifts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={isProcessing}
            className="admin-btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            Sync with Telegram
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Gifts', value: '1,234', color: 'blue' },
          { label: 'Deposited', value: '892', color: 'green' },
          { label: 'Withdrawn', value: '312', color: 'purple' },
          { label: 'Pending', value: '30', color: 'orange' },
        ].map((stat, index) => (
          <div key={index} className="admin-card p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Withdrawals */}
      <div className="admin-card">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-500" />
            Pending Withdrawals
          </h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {pendingWithdrawals.map((withdrawal) => (
            <div key={withdrawal.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{withdrawal.giftName}</p>
                  <p className="text-sm text-slate-500">To: {withdrawal.recipient}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{withdrawal.requestDate}</span>
                <button
                  onClick={() => handleApproveWithdrawal(withdrawal.id)}
                  className="admin-btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          ))}
          {pendingWithdrawals.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No pending withdrawals
            </div>
          )}
        </div>
      </div>

      {/* All Gifts */}
      <div className="admin-card overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All Gifts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Gift</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Sender</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockGifts.map((gift) => (
                <tr key={gift.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{gift.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{gift.sender}</td>
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{gift.value} TON</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      gift.status === 'deposited' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                      gift.status === 'withdrawn' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                    }`}>
                      {gift.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{gift.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How it Works */}
      <div className="admin-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">How Telegram Gifts Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Deposit</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Users send gifts from Telegram to the marketplace bot. The gift is added to their inventory.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Trade</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Users can list gifts on the marketplace or trade them with other users.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Withdraw</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                When a user requests withdrawal, the admin sends the gift back via Telegram.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
