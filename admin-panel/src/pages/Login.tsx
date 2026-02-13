import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff, Gem } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/25">
            <Gem className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TON NFT Admin</h1>
          <p className="text-slate-400">Connect your wallet to access the admin panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <button
            onClick={() => setShowConnectModal(true)}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Connect TON Wallet
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              By connecting, you agree to the{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
            </p>
          </div>
        </div>

        {/* Supported Wallets */}
        <div className="mt-8">
          <p className="text-center text-sm text-slate-500 mb-4">Supported Wallets</p>
          <div className="flex justify-center gap-4">
            {['Tonkeeper', 'TON Hub', 'OpenMask'].map((wallet) => (
              <div
                key={wallet}
                className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10"
                title={wallet}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Connect Wallet</h3>
            <p className="text-slate-400 mb-6">
              Choose your preferred wallet to connect to the admin panel.
            </p>
            
            <div className="space-y-3">
              {['Tonkeeper', 'TON Hub', 'OpenMask'].map((wallet) => (
                <button
                  key={wallet}
                  onClick={handleConnect}
                  className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg" />
                  <span className="font-medium text-white">{wallet}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowConnectModal(false)}
              className="w-full mt-4 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
