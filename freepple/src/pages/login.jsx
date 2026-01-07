import { useState } from 'react'
import { Card } from '../components/Card'
import { GlowButton } from '../components/GlowButton'
import { Input } from '../components/Input'
// Import both logic engines
import { getDevWallet } from '../utils/xrplManager'
import { getExistingWallet } from '../utils/xrplLogin'

export function Login({ setWallet }) {
  const [isLoading, setIsLoading] = useState(false)
  const [seedInput, setSeedInput] = useState("")
  const [error, setError] = useState("")

  // OPTION A: Create New
  const handleCreate = async () => {
    setIsLoading(true)
    setError("")
    try {
      const wallet = await getDevWallet()
      alert(`🎉 Wallet Created! Save this Seed: ${wallet.seed}`)
      setWallet(wallet) // Unlocks the App
    } catch (e) {
      setError("Creation failed: " + e.message)
    }
    setIsLoading(false)
  }

  // OPTION B: Login with Seed
  const handleLogin = async () => {
    if (!seedInput) return setError("Please enter your seed (sEd...)")
    setIsLoading(true)
    setError("")
    try {
      const wallet = await getExistingWallet(seedInput)
      setWallet(wallet) // Unlocks the App
    } catch (e) {
      setError("Invalid Seed or Network Error")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Logo Area */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Freepple
          </h1>
          <p className="text-slate-400">Freelance Payments on XRPL</p>
        </div>

        {/* The Main Card */}
        <Card title="Connect to Continue">
          
          {/* Section 1: Existing User */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-300">I have a wallet</label>
            <Input 
              placeholder="Enter Seed (sEd7...)" 
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
            />
            <GlowButton onClick={handleLogin} isLoading={isLoading}>
              Access Dashboard
            </GlowButton>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or</span></div>
          </div>

          {/* Section 2: New User */}
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-4">New here? We'll give you a test wallet with 1,000 XRP.</p>
            <button 
              onClick={handleCreate}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 text-sm font-bold border border-blue-900/50 bg-blue-900/20 px-6 py-2 rounded-full transition-all hover:scale-105"
            >
              {isLoading ? "Creating..." : "✨ Create New Wallet"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-xs text-center">
              {error}
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}