import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { getDevWallet, createEscrow } from './utils/xrplManager' // Import your new backend file

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

  const runTest = async () => {
  // 1. Get a funded wallet (Sender)
  const wallet = await getDevWallet()
  
  // 2. Send money to ITSELF (Easiest test case)
  // We lock 5 XRP. The wallet is both sender and receiver.
  const result = await createEscrow(wallet, "5", wallet.address)
  
  alert(`Escrow Created! Secret: ${result.secret}`)
}

return (
  <button onClick={runTest}>TEST BACKEND</button>
)
}

export default App