import { useState } from 'react'
import { getDevWallet } from '../utils/xrplManager'
import { Copy, Check, Wallet, Plus, ArrowRight } from 'lucide-react'

export function Login({ setWallet }) {
  const [isLoading, setIsLoading] = useState(false)
  
  // FORM STATE
  const [inputAddress, setInputAddress] = useState('')
  const [inputSeed, setInputSeed] = useState('')
  
  // MODAL STATE
  const [newWalletData, setNewWalletData] = useState(null)
  const [hasCopied, setHasCopied] = useState(false)

  // 1. MANUAL LOGIN (Existing Wallet)
  const handleManualLogin = () => {
    if (!inputAddress) return alert("Error: Wallet Address is empty")
    if (!inputSeed) return alert("Error: Secret Key is empty")

    // 👇 CRITICAL FIX: We save the 'seed' so we can sign transactions later
    const payload = { 
        address: inputAddress.trim(), 
        seed: inputSeed.trim(), 
        type: 'LOCAL' 
    }
    
    console.log("👉 Logging in with Existing Wallet:", payload.address)
    setWallet(payload) 
  }

  // 2. CREATE NEW DEV WALLET
  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const wallet = await getDevWallet()
      console.log("✨ Created Dev Wallet:", wallet)
      setNewWalletData(wallet)
    } catch (error) {
      alert("Creation Failed: " + error.message)
    }
    setIsLoading(false)
  }

  // 3. CONFIRM BACKUP
  const handleBackupConfirmed = () => {
    if (!newWalletData) return
    const payload = {
        address: newWalletData.address || newWalletData.account,
        seed: newWalletData.seed || newWalletData.secret,
        type: 'LOCAL'
    }
    setWallet(payload)
    setNewWalletData(null)
  }

  const copyToClipboard = () => {
    if (!newWalletData) return
    navigator.clipboard.writeText(newWalletData.seed || newWalletData.secret)
    setHasCopied(true)
  }

  // --- VIEWS ---

  // BACKUP MODAL (Shows when you generate a new wallet)
  if (newWalletData) {
    return (
       <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Save Your Secret Key</h2>
          <div className="bg-black/50 border border-slate-800 rounded-xl p-4 mb-6">
            <div className="mb-4">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Public Address</label>
                <div className="text-slate-300 font-mono text-xs break-all select-all">{newWalletData.address || newWalletData.account}</div>
            </div>
            <div>
                <label className="text-[10px] uppercase text-red-400 font-bold">Secret Key</label>
                <div className="flex items-center gap-2 mt-1">
                    <code className="bg-red-900/20 text-red-200 p-2 rounded border border-red-900/30 font-mono text-sm flex-1 truncate select-all">{newWalletData.seed || newWalletData.secret}</code>
                    <button onClick={copyToClipboard} className="text-white p-2">{hasCopied ? <Check size={16}/> : <Copy size={16}/>}</button>
                </div>
            </div>
          </div>
          <button onClick={handleBackupConfirmed} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            I have saved it <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  // LOGIN SCREEN
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="mb-8 text-center z-10">
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">Freepple<span className="text-blue-500">.</span></h1>
            <p className="text-slate-400">The Crypto Freelance Escrow</p>
        </div>

        <div className="w-full max-w-sm z-10 space-y-6">
            
            {/* MANUAL FORM */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Wallet size={20} className="text-blue-500"/> Access Wallet
                </h3>

                <div className="mb-4">
                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Wallet Address</label>
                    <input 
                        type="text" 
                        value={inputAddress} 
                        onChange={(e) => setInputAddress(e.target.value)} 
                        placeholder="r..." 
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 text-sm focus:border-blue-500 outline-none font-mono placeholder:text-slate-700"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Secret Key</label>
                    <input 
                        type="password" 
                        value={inputSeed} 
                        onChange={(e) => setInputSeed(e.target.value)} 
                        placeholder="s..." 
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 text-sm focus:border-blue-500 outline-none font-mono placeholder:text-slate-700"
                    />
                </div>
                <button 
                    onClick={handleManualLogin} 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-900/20"
                >
                    Login
                </button>
            </div>

            <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-600 text-xs font-bold uppercase">Or</span>
                <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button 
                onClick={handleCreate} 
                disabled={isLoading} 
                className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
            >
               {isLoading ? (
                   <span className="animate-pulse">Creating...</span>
               ) : (
                   <>
                    <Plus size={14} /> Generate New Test Wallet
                   </>
               )}
            </button>
        </div>
    </div>
  )
}