import { useState } from 'react'
import { Card } from '../components/Card'
import { GlowButton } from '../components/GlowButton'
import { Input } from '../components/Input'
import { getDevWallet } from '../utils/xrplManager'
import { getExistingWallet } from '../utils/xrplLogin'

export function Login({ setWallet }) {
  const [isLoading, setIsLoading] = useState(false)
  const [seedInput, setSeedInput] = useState("")
  const [addressInput, setAddressInput] = useState("") // New State
  const [error, setError] = useState("")

  // OPTION A: Create New
  const handleCreate = async () => {
    setIsLoading(true)
    setError("")
    try {
      const wallet = await getDevWallet()
      // Show both address and seed so they can log in next time
      alert(`🎉 Wallet Created!\n\nAddress: ${wallet.address}\nSeed: ${wallet.seed}\n\nSAVE THESE!`)
      setWallet(wallet)
    } catch (e) {
      setError("Creation failed: " + e.message)
    }
    setIsLoading(false)
  }

  // OPTION B: Login with Address + Seed
  const handleLogin = async () => {
    // Basic validation
    if (!addressInput.startsWith("r")) return setError("Address must start with 'r'")
    if (!seedInput.startsWith("s")) return setError("Seed must start with 's'")

    setIsLoading(true)
    setError("")
    try {
      // 👇 Pass BOTH values now
      const wallet = await getExistingWallet(seedInput, addressInput)
      setWallet(wallet) 
    } catch (e) {
      setError(e.message) // Show the specific mismatch error
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Freepple
          </h1>
          <p className="text-slate-400">Secure XRPL Login</p>
        </div>

        <Card title="Access Your Wallet">
          
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-300">Existing User Login</label>
            
            {/* 👇 New Input Field */}
            <Input 
              placeholder="Wallet Address (r...)" 
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value.trim())} // trim whitespace
            />
            
            <Input 
              placeholder="Secret Seed (sEd...)" 
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value.trim())}
              type="password" // Optional: hide the seed
            />
            
            <GlowButton onClick={handleLogin} isLoading={isLoading}>
              Login Securely
            </GlowButton>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or</span></div>
          </div>

          <div className="text-center">
            <button 
              onClick={handleCreate}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 text-sm font-bold border border-blue-900/50 bg-blue-900/20 px-6 py-2 rounded-full transition-all hover:scale-105"
            >
              {isLoading ? "Creating..." : "✨ Create New Wallet"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-xs text-center break-words">
              {error}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}