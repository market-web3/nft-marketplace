'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Telegram, X, Check, Copy, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface TelegramConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (telegramId: string) => void;
}

export function TelegramConnect({ isOpen, onClose, onConnect }: TelegramConnectProps) {
  const [step, setStep] = useState<'intro' | 'code' | 'verify' | 'success'>('intro');
  const [linkingCode, setLinkingCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateCode = async () => {
    setIsLoading(true);
    try {
      // In production, this would call your backend API
      const response = await axios.post('/api/auth/telegram/generate-code');
      setLinkingCode(response.data.code);
      setStep('code');
    } catch (error) {
      toast.error('Failed to generate code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/telegram/verify', {
        code: inputCode,
      });
      
      if (response.data.success) {
        setStep('success');
        onConnect?.(response.data.telegramId);
        toast.success('Telegram connected successfully!');
      } else {
        toast.error('Invalid code');
      }
    } catch (error) {
      toast.error('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(linkingCode);
    toast.success('Code copied to clipboard!');
  };

  const reset = () => {
    setStep('intro');
    setLinkingCode('');
    setInputCode('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={reset}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="glass-card p-6 m-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Telegram className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Connect Telegram
                    </h3>
                    <p className="text-sm text-slate-500">Link your Telegram account</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {step === 'intro' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Connect your Telegram to receive notifications about your NFTs, 
                        auctions, and gifts. You can also deposit and withdraw Telegram gifts.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-xs font-bold">1</div>
                        Start our Telegram bot
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-xs font-bold">2</div>
                        Get your linking code
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-xs font-bold">3</div>
                        Enter the code here
                      </div>
                    </div>

                    <button
                      onClick={generateCode}
                      disabled={isLoading}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Telegram className="w-5 h-5" />
                          Connect Telegram
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {step === 'code' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Your linking code. Send this to our Telegram bot or enter it on the website:
                      </p>
                      
                      <div className="relative">
                        <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-wider bg-slate-100 dark:bg-slate-800 py-4 rounded-xl">
                          {linkingCode}
                        </div>
                        <button
                          onClick={copyCode}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Copy className="w-5 h-5 text-slate-500" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                        Or start the bot directly:
                      </p>
                      <a
                        href={`https://t.me/YourNFTMarketplaceBot?start=link_${linkingCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Telegram className="w-4 h-4" />
                        Open Telegram Bot
                      </a>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('verify')}
                        className="flex-1 btn-primary"
                      >
                        I've Connected
                      </button>
                      <button
                        onClick={() => setStep('intro')}
                        className="btn-secondary"
                      >
                        Back
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'verify' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Enter the code you received from Telegram:
                    </p>
                    
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., ABC123)"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-2xl font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />

                    <button
                      onClick={verifyCode}
                      disabled={inputCode.length !== 6 || isLoading}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify Code'
                      )}
                    </button>

                    <button
                      onClick={() => setStep('code')}
                      className="w-full btn-secondary"
                    >
                      Back
                    </button>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      Successfully Connected!
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Your Telegram account is now linked. You can now receive notifications 
                      and manage your gifts directly from Telegram.
                    </p>
                    <button
                      onClick={reset}
                      className="btn-primary"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
