import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Pay } from './pages/Pay'
import { Dashboard } from './pages/Dashboard'
import { getDevWallet } from './utils/xrplManager' 

function App() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(false)

  // Global Connect Handler
  const handleConnect = async () => {
    setLoading(true)
    try {
      const _wallet = await getDevWallet()
      setWallet(_wallet)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen pb-20 bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white">
        
        {/* Pass loading state so Navbar can show a spinner if needed */}
        <Navbar onConnect={handleConnect} walletAddress={wallet?.address} />

        {/* Temporary Navigation for Devs */}
        <nav className="fixed bottom-6 right-6 flex gap-3 z-50">
          <Link to="/pay" className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold shadow-xl transition">
            Create Payment
          </Link>
          <Link to="/dashboard" className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold shadow-xl transition">
            Freelancer Dash
          </Link>
        </nav>

        <Routes>
          {/* Default to Pay Page */}
          <Route path="/" element={<Pay wallet={wallet} onConnect={handleConnect} />} />
          <Route path="/pay" element={<Pay wallet={wallet} onConnect={handleConnect} />} />
          <Route path="/dashboard" element={<Dashboard wallet={wallet} />} />
        </Routes>

      </div>
    </BrowserRouter>
  )
}

export default App