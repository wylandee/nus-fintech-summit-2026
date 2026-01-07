import { useState, useEffect } from 'react'
import { Card } from '../components/Card'
import { claimEscrow, connectClient } from '../utils/xrplManager'

export function Dashboard({ wallet }) {
  const [escrows, setEscrows] = useState([])
  const [secrets, setSecrets] = useState({}) 
  const [status, setStatus] = useState("Loading...")

  useEffect(() => {
    if (!wallet) return
    
    const fetchEscrows = async () => {
      setStatus("Connecting to Ledger...")
      try {
        const client = await connectClient()
        
        // 1. Get Raw Objects
        const response = await client.request({
          command: "account_objects",
          account: wallet.address,
          type: "escrow",
          ledger_index: "validated"
        })
        
        const rawObjects = response.result.account_objects
        
        if (rawObjects.length === 0) {
          setStatus("No Escrows Found.")
          setEscrows([])
          return
        }

        setStatus(`Found ${rawObjects.length} escrows. Fetching IDs...`)

        // 2. Detective Work (The Fix)
        const enrichedEscrows = await Promise.all(rawObjects.map(async (obj) => {
          try {
            const txResponse = await client.request({
              command: "tx",
              transaction: obj.PreviousTxnID
            })
            
            // 🛑 THE FIX: Check both locations for the Sequence number
            // Some nodes return it at root, others inside tx_json
            const txData = txResponse.result.tx_json || txResponse.result
            const foundSequence = txData.Sequence

            console.log(`✅ Found ID for ${obj.PreviousTxnID}:`, foundSequence)

            return {
              ...obj,
              realSequence: foundSequence 
            }
          } catch (err) {
            console.error("❌ Failed to find ID:", err)
            return { ...obj, realSequence: "ERROR" }
          }
        }))

        setEscrows(enrichedEscrows)
        setStatus("") 

      } catch (error) {
        console.error(error)
        setStatus("Error: " + error.message)
      }
    }

    fetchEscrows()
  }, [wallet])

  // 3. CLAIM LOGIC
  const handleUnlock = async (index) => {
    const secret = secrets[index]
    if (!secret) return alert("Please enter Secret!")
    
    const escrow = escrows.find(e => e.index === index)
    
    if (!escrow.realSequence || escrow.realSequence === "ERROR") {
      return alert("Error: Could not load the Escrow ID. Try refreshing.")
    }

    console.log(`🔓 Unlocking ID: ${escrow.realSequence} with Secret: ${secret}`)

    try {
      await claimEscrow(
        wallet, 
        escrow.Account, 
        escrow.realSequence, // Now guaranteed to be a number
        escrow.Condition, 
        secret
      )
      alert("✅ Success! Money Unlocked.")
      window.location.reload()
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  const handleSecretChange = (id, value) => {
    setSecrets(prev => ({ ...prev, [id]: value }))
  }

  if (!wallet) return <div className="pt-32 text-center text-white">Please Connect Wallet</div>

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Incoming Payments</h2>
      
      {status && <div className="bg-blue-900/50 text-blue-200 p-4 rounded mb-4 animate-pulse">{status}</div>}

      <div className="grid gap-4">
        {escrows.map((escrow) => (
          <div key={escrow.index} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            
            <div className="flex-1">
              <span className="text-2xl font-bold text-white block">
                {parseInt(escrow.Amount) / 1000000} XRP
              </span>
              
              <span className="text-xs text-green-400 font-mono font-bold bg-green-900/30 px-2 py-1 rounded">
                ID: {escrow.realSequence}
              </span>
              
              <p className="text-xs text-slate-500 mt-2">From: {escrow.Account}</p>
            </div>

            <div className="flex gap-3">
              <input 
                placeholder="Paste Secret Key" 
                className="bg-slate-950 border border-slate-700 text-white rounded px-3 py-2 w-48 focus:border-blue-500 outline-none transition"
                onChange={(e) => handleSecretChange(escrow.index, e.target.value)}
              />
              <button 
                onClick={() => handleUnlock(escrow.index)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold shadow-lg shadow-green-900/20"
              >
                Unlock 🔓
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}