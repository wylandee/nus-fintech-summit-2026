import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { NavBarPro } from './components/NavBarPro'
import { Pay } from './pages/Pay'
import { Dashboard } from './pages/Dashboard'
import { ClientDashboard } from './pages/ClientDashboard'
import { Login } from './pages/login'

function App() {
  const [wallet, setWallet] = useState(null)

  // 🚪 THE GATEKEEPER
  // If user is not logged in, ONLY show the Login Page
  if (!wallet) {
    return <Login setWallet={setWallet} />
  }

  // Once logged in, show the full application
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white font-sans pb-20">
        
        {/* Pass wallet to Navbar so it shows the address/logout */}
        <NavBarPro 
          wallet={wallet} 
          setWallet={setWallet} // Passing this allows "Logout" (setting wallet to null)
        />

        <div className="pt-20">
          <Routes>
            {/* Default to Dashboard on Login */}
            <Route path="/" element={<Dashboard wallet={wallet} />} />
            <Route path="/dashboard" element={<Dashboard wallet={wallet} />} />
            <Route path="/client" element={<ClientDashboard wallet={wallet} />} /> {/* 👈 New Route */}
            <Route path="/pay" element={<Pay wallet={wallet} />} />
          </Routes>
        </div>

        {/* Floating Nav for Demo purposes */}
        <nav className="fixed bottom-6 right-6 flex gap-3 z-50">
          <Link to="/client" className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold shadow-xl transition">
            My Payments
          </Link>
          <Link to="/dashboard" className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold shadow-xl transition">
            My Dashboard
          </Link>
        </nav>

      </div>
    </BrowserRouter>
  )
}

export default App