import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { Card } from './components/Card'
import { GlowButton } from './components/GlowButton'
import { getDevWallet, createEscrow, claimEscrow } from './utils/xrplManager' // Import new function

function App() {
  const [logs, setLogs] = useState([])
  const addLog = (msg) => setLogs(prev => [...prev, msg])

  const runFullCycle = async () => {
    setLogs([])
    addLog("⏳ Starting Full Lifecycle Test...")

    try {
      // 1. Get Wallet
      addLog("💰 Step 1: Funding Wallet...")
      const wallet = await getDevWallet()
      addLog(`✅ Wallet: ${wallet.address}`)

      // 2. Lock Funds
      addLog("🔒 Step 2: Locking 10 XRP...")
      // Note: We are locking money to OURSELVES to make the test simple
      const lockResult = await createEscrow(wallet, "10", wallet.address)
      
      addLog(`✅ Locked! ID (Seq): ${lockResult.sequence}`)
      addLog(`🔑 Secret: ${lockResult.secret}`)
      console.log("👉 DEBUG SEQUENCE:", lockResult.sequence)
      // 3. Unlock Funds
      addLog("🔓 Step 3: Claiming Funds...")
      const claimHash = await claimEscrow(
        wallet,                // Claimer
        wallet.address,        // Owner (Client)
        lockResult.sequence,   // The Escrow ID
        lockResult.condition,  // The Lock
        lockResult.secret      // The Key
      )
      
      addLog(`✅ SUCCESS! Money Released.`)
      addLog(`📜 Claim Tx: ${claimHash}`)

    } catch (error) {
      console.error(error)
      addLog(`❌ ERROR: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 font-mono">
      <Navbar />
      <div className="max-w-2xl mx-auto mt-20">
        <Card title="The Final Exam">
          <GlowButton onClick={runFullCycle}>
            🚀 Run Full Cycle (Lock & Unlock)
          </GlowButton>
          <div className="mt-8 bg-black border border-slate-800 p-4 rounded-xl h-64 overflow-y-auto text-xs">
            {logs.map((log, i) => (
              <div key={i} className="mb-2 pb-1 border-b border-slate-900/50 text-slate-300">
                {log}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default App