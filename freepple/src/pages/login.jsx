import { useState } from 'react'
import { getDevWallet } from '../utils/xrplManager'
import { Copy, Check, AlertTriangle, ArrowRight, Wallet, Plus } from 'lucide-react'

export function Login({ setWallet }) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Login Form State
  const [inputAddress, setInputAddress] = useState('') // 👈 New Address State
  const [inputSeed, setInputSeed] = useState('')
  
  // Backup Modal State
  const [newWalletData, setNewWalletData] = useState(null)
  const [hasCopied, setHasCopied] = useState(false)

  // 1. CREATE WALLET
  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const wallet = await getDevWallet()
      setNewWalletData(wallet)
    } catch (error) {
      alert("Creation Failed: " + error.message)
    }
    setIsLoading(false)
  }

  // 2. CONFIRM BACKUP
  const handleBackupConfirmed = () => {
    if (!newWalletData) return
    setWallet(newWalletData)
    setNewWalletData(null)
  }

  // 3. EXISTING LOGIN
  const handleLogin = () => {
    if (!inputAddress) return alert("Please enter your Wallet Address")
    if (!inputSeed) return alert("Please enter your Secret Key")
    
    // In a real app, we would verify the seed matches the address here.
    // For the Hackathon MVP, we trust the input and set the wallet.
    setWallet({ address: inputAddress, seed: inputSeed }) 
  }
  
  const copyToClipboard = () => {
    if (!newWalletData) return
    navigator.clipboard.writeText(newWalletData.seed || newWalletData.secret)
    setHasCopied(true)
  }

  // ---------------------------------------------------------
  // VIEW 1: THE BACKUP MODAL (If a new wallet exists)
  // ---------------------------------------------------------
  if (newWalletData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
          
          <div className="flex justify-center mb-6">
            <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
                <AlertTriangle size={32} className="text-red-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Save Your Secret Key</h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            This key is the <b>only way</b> to recover your funds.
          </p>

          <div className="bg-black/50 border border-slate-800 rounded-xl p-4 mb-6">
            <div className="mb-4">
                <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Public Address</label>
                <div className="text-slate-300 font-mono text-xs break-all select-all">{newWalletData.address}</div>
            </div>
            
            <div>
                <label className="text-[10px] uppercase text-red-400 font-bold tracking-widest flex items-center gap-2">
                    Secret Key (Private)
                </label>
                <div className="flex items-center gap-2 mt-1">
                    <code className="bg-red-900/20 text-red-200 p-2 rounded border border-red-900/30 font-mono text-sm flex-1 truncate select-all">
                        {newWalletData.seed || newWalletData.secret}
                    </code>
                    <button 
                        onClick={copyToClipboard}
                        className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded transition border border-slate-700"
                    >
                        {hasCopied ? <Check size={16} className="text-green-400"/> : <Copy size={16}/>}
                    </button>
                </div>
            </div>
          </div>

          <button 
            onClick={handleBackupConfirmed}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
          >
            I have saved it <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------
  // VIEW 2: STANDARD LOGIN SCREEN
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="mb-8 text-center z-10">
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
                Freepple<span className="text-blue-500">.</span>
            </h1>
            <p className="text-slate-400">The Crypto Freelance Escrow</p>
        </div>

        <div className="w-full max-w-sm z-10">
            
            {/* LOGIN FORM */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Wallet size={20} className="text-blue-500"/> Access Wallet
                </h3>

                {/* 1. Address Input */}
                <div className="mb-4">
                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Wallet Address</label>
                    <input 
                        type="text"
                        value={inputAddress}
                        onChange={(e) => setInputAddress(e.target.value)}
                        placeholder="r..."
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition font-mono placeholder:text-slate-700"
                    />
                </div>

                {/* 2. Secret Input */}
                <div className="mb-6">
                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Secret Key</label>
                    <input 
                        type="password"
                        value={inputSeed}
                        onChange={(e) => setInputSeed(e.target.value)}
                        placeholder="s..."
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition font-mono placeholder:text-slate-700"
                    />
                </div>

                {/* Login Button */}
                <button 
                    onClick={handleLogin}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-900/20"
                >
                    Login
                </button>
            </div>

            {/* DIVIDER */}
            <div className="relative flex py-6 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-600 text-xs font-bold uppercase">Or</span>
                <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* CREATE BUTTON (Small & Bottom) */}
            <button 
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
            >
               {isLoading ? (
                   <span className="animate-pulse">Creating...</span>
               ) : (
                   <>
                    <Plus size={14} /> Create New Wallet
                   </>
               )}
            </button>

        </div>
    </div>
  )
}