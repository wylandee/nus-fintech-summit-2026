import { useState, useEffect } from 'react'
// 👇 Import the new functions
import { claimEscrow, cancelEscrow, connectClient } from '../utils/xrplManager'

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
        
        // 1. Get Objects Owned by Me (Sent Escrows)
        const response = await client.request({
          command: "account_objects",
          account: wallet.address,
          type: "escrow",
          ledger_index: "validated"
        })
        
        const rawObjects = response.result.account_objects
        
        if (rawObjects.length === 0) {
          setStatus("")
          setEscrows([])
          return
        }

        setStatus(`Found ${rawObjects.length} active escrows...`)

        // 2. Enrich Data (Find IDs)
        const enrichedEscrows = await Promise.all(rawObjects.map(async (obj) => {
          try {
            const txResponse = await client.request({
              command: "tx",
              transaction: obj.PreviousTxnID
            })
            const txData = txResponse.result.tx_json || txResponse.result
            return { ...obj, realSequence: txData.Sequence }
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

  // 3. ACTIONS
  const handleUnlock = async (escrow) => {
    const secret = secrets[escrow.index]
    if (!secret) return alert("Please enter Secret!")
    
    try {
      await claimEscrow(
        wallet, 
        escrow.Account, 
        escrow.realSequence,
        escrow.Condition, 
        secret
      )
      alert("✅ Success! Money Unlocked.")
      window.location.reload()
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  // 👇 NEW: Refund Logic
  const handleRefund = async (escrow) => {
    if (!confirm("Attempt Refund? If the time limit hasn't passed, this will fail.")) return
    try {
        await cancelEscrow(wallet, wallet.address, escrow.realSequence)
        alert("✅ Refund Successful! Money returned.")
        window.location.reload()
    } catch (error) {
        alert("Refund Failed: " + error.message)
    }
  }

  // 👇 NEW: Dummy Dispute
  const handleDispute = () => {
    alert("🚨 Dispute Reported.\n\nSupport has been notified. Check your email for a ticket number.")
  }

  // Helper: Check if Time has passed
  const isRefundable = (rippleTime) => {
    // Ripple Epoch (2000) vs Unix (1970) offset = 946684800 seconds
    const unixTime = (rippleTime + 946684800) * 1000
    return Date.now() > unixTime
  }

  const handleSecretChange = (id, value) => {
    setSecrets(prev => ({ ...prev, [id]: value }))
  }

  if (!wallet) return <div className="pt-32 text-center text-white">Please Connect Wallet</div>

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-white">Escrow Management</h2>
        <button onClick={() => window.location.reload()} className="text-xs text-blue-400 hover:text-white">Refresh ↻</button>
      </div>
      
      {status && <div className="bg-blue-900/50 text-blue-200 p-4 rounded mb-4 animate-pulse text-xs font-mono">{status}</div>}
      
      {escrows.length === 0 && !status && (
        <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-500">
            No active escrows found.
        </div>
      )}

      <div className="grid gap-4">
        {escrows.map((escrow) => {
          // Identify Role
          const isMyPayment = escrow.Account === wallet.address
          const canClaimRefund = isRefundable(escrow.CancelAfter)
          
          return (
            <div key={escrow.index} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                
                {/* Left Info */}
                <div className="flex-1 w-full">
                    <div className="flex justify-between md:justify-start items-center gap-4">
                        <span className="text-2xl font-bold text-white block">
                            {parseInt(escrow.Amount) / 1000000} XRP
                        </span>
                        {isMyPayment && <span className="text-[10px] uppercase font-bold bg-blue-900 text-blue-300 px-2 py-1 rounded">My Payment</span>}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500 font-mono">ID: {escrow.realSequence}</p>
                        <p className="text-xs text-slate-500">To: {escrow.Destination}</p>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    
                    {/* 1. UNLOCK (Shown to everyone, but mostly for Freelancer) */}
                    <div className="flex w-full md:w-auto gap-2">
                        <input 
                            placeholder="Secret Key" 
                            className="bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 w-full md:w-40 focus:border-blue-500 outline-none"
                            onChange={(e) => handleSecretChange(escrow.index, e.target.value)}
                        />
                        <button 
                            onClick={() => handleUnlock(escrow)}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-xs font-bold whitespace-nowrap"
                        >
                            Unlock 🔓
                        </button>
                    </div>

                    {/* 2. CLIENT CONTROLS (Only if I sent the money) */}
                    {isMyPayment && (
                        <div className="flex gap-3 justify-end w-full border-t border-slate-800 pt-3 mt-1">
                            <button 
                                onClick={handleDispute}
                                className="text-xs text-slate-500 hover:text-red-400 underline"
                            >
                                Raise Dispute
                            </button>

                            <button 
                                onClick={() => handleRefund(escrow)}
                                disabled={!canClaimRefund}
                                className={`text-xs px-3 py-1 rounded font-bold border transition-colors ${
                                    canClaimRefund 
                                    ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-white" 
                                    : "border-slate-800 text-slate-600 cursor-not-allowed"
                                }`}
                            >
                                {canClaimRefund ? "Claim Refund" : "Refund Locked"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}