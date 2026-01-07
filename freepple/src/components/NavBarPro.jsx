import { useState } from 'react'
import { GlowButton } from './GlowButton'
import { getExistingWallet } from '../utils/xrplLogin' // Import from the new file

export function NavBarPro({ walletAddress, onConnect, setWallet }) {
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [seedInput, setSeedInput] = useState("")

  const handleLogin = async () => {
    if (!seedInput) return alert("Enter a seed")
    try {
      const wallet = await getExistingWallet(seedInput)
      setWallet(wallet) // This updates the Main App
      setIsLoginMode(false)
      alert("✅ Login Success!")
    } catch (e) {
      alert("❌ Invalid Seed")
    }
  }

  return (
    <nav className="fixed top-0 w-full bg-black/90 border-b border-blue-900/50 p-4 z-50 flex justify-between items-center shadow-2xl">
      <div className="flex items-center gap-2">
         {/* A generic logo icon for the V2 look */}
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">F</div>
        <div className="text-xl font-bold text-white tracking-tighter">
          Freepple <span className="text-blue-500 text-xs uppercase bg-blue-900/30 px-2 py-1 rounded">Pro</span>
        </div>
      </div>

      <div className="flex gap-2">
        {walletAddress ? (
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>
            <div className="flex flex-col text-right leading-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Connected</span>
              <span className="text-xs font-mono text-white">
                {walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
            </div>
          </div>
        ) : isLoginMode ? (
          <div className="flex gap-2 animate-in slide-in-from-right duration-300">
            <input 
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Paste sEd... seed here"
              className="bg-slate-900 text-white text-xs px-3 rounded border border-blue-500/50 w-48 focus:outline-none focus:border-blue-500 transition-all"
            />
            <button onClick={handleLogin} className="text-xs bg-blue-600 hover:bg-blue-500 px-4 rounded text-white font-bold transition">
              GO
            </button>
            <button onClick={() => setIsLoginMode(false)} className="text-xs text-slate-500 hover:text-white px-2">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsLoginMode(true)} 
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              Recover Wallet
            </button>
            <GlowButton onClick={onConnect}>
              Create New
            </GlowButton>
          </div>
        )}
      </div>
    </nav>
  )
}