import { Wallet } from 'lucide-react'

export function Navbar({ onConnect, walletAddress }) {
  return (
    <nav className="w-full flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md fixed top-0 z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
          🔗
        </div>
        <span className="font-bold text-xl tracking-tight text-white">TrustLink</span>
      </div>

      {/* Right: Connect Button Placeholder */}
      <button 
        onClick={onConnect}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          walletAddress 
            ? "bg-slate-800 text-green-400 border border-green-900" 
            : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
        }`}
      >
        <Wallet size={16} />
        {walletAddress 
          ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` 
          : "Connect Wallet"
        }
      </button>
    </nav>
  )
}