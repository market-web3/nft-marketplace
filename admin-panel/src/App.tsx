import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './pages/Dashboard'
import { NFTManagement } from './pages/NFTManagement'
import { AuctionManagement } from './pages/AuctionManagement'
import { OffersManagement } from './pages/OffersManagement'
import { TelegramGifts } from './pages/TelegramGifts'
import { Users } from './pages/Users'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onLogout={() => setIsAuthenticated(false)}
        />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nfts" element={<NFTManagement />} />
            <Route path="/auctions" element={<AuctionManagement />} />
            <Route path="/offers" element={<OffersManagement />} />
            <Route path="/gifts" element={<TelegramGifts />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
