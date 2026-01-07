import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { getDevWallet } from './utils/xrplManager' // Import your new backend file

function App() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      // Triggers your backend code
      const data = await getDevWallet()
      setWallet(data.wallet) // Save the wallet to state
      alert(`Success! Funded with ${data.balance} XRP`)
    } catch (error) {
      console.error(error)
      alert("Error: " + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Pass the function to the Navbar Button */}
      <Navbar 
        onConnect={handleConnect} 
        walletAddress={wallet?.address} 
      />
      
      {/* Visual Feedback while loading */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-xl font-bold animate-pulse">Creating & Funding Wallet...</div>
        </div>
      )}

      {/* Rest of your app... */}
    </div>
  )
}

export default App