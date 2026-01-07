import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { cancelEscrow, connectClient, getEscrowHistory } from '../utils/xrplManager'
import { Activity, History } from 'lucide-react'

export function ClientDashboard({ wallet }) {
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'history'
  
  const [sentEscrows, setSentEscrows] = useState([])
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState("Loading...")

    // 1. REUSABLE FETCH FUNCTION
    const fetchData = useCallback(async () => {
        if (!wallet) return
        setStatus("Loading...")
        
        try {
        if (activeTab === 'active') {
            // ... (Keep existing ACTIVE fetch logic) ...
            const client = await connectClient()
            const response = await client.request({
                command: "account_objects",
                account: wallet.address,
                type: "escrow",
                ledger_index: "validated"
            })
            const rawObjects = response.result.account_objects || []
            const mySentJobs = rawObjects.filter(obj => obj.Account === wallet.address)
            
            const enriched = await Promise.all(mySentJobs.map(async (obj) => {
                try {
                    const tx = await client.request({ command: "tx", transaction: obj.PreviousTxnID })
                    return { ...obj, realSequence: (tx.result.tx_json || tx.result).Sequence }
                } catch (e) { return { ...obj, realSequence: "UNKNOWN" } }
            }))
            setSentEscrows(enriched)

        } else {
            // --- 👇 UPDATED HISTORY LOGIC ---
            const pastTx = await getEscrowHistory(wallet.address)
            
            // CLIENT HISTORY RULES:
            // 1. I am the Owner (I created the lock originally)
            // 2. It is NOT just a "Creation" event (we only want to see the End Result)
            const myHistory = pastTx.filter(tx => {
                // Check if I am the owner (either implicitly via 'Account' on Create, or explicit 'Owner' field)
                const isMyEscrow = tx.owner === wallet.address || (tx.type === 'CREATED' && tx.account === wallet.address)
                
                // We only want to show the FINAL outcome: Completed or Refunded
                return isMyEscrow && (tx.type === 'COMPLETED' || tx.type === 'REFUNDED')
            })

            setHistory(myHistory)
        }
        setStatus("")
        } catch (error) {
        console.error(error)
        setStatus("")
        }
    }, [wallet, activeTab])

  // Initial Load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 2. REFUND ACTION (Updated)
  const handleRefund = async (escrow) => {
    if (!confirm("Confirm Refund?")) return
    try {
      await cancelEscrow(wallet, wallet.address, escrow.realSequence)
      alert("✅ Refund Successful!")
      
      // 👇 THE FIX: Refresh data instead of reloading page
      await fetchData() 

    } catch (error) { 
      alert("Refund Failed: " + error.message) 
    }
  }

  const handleDispute = () => alert("🚨 Dispute Logged.")
  const isRefundable = (rippleTime) => Date.now() > (rippleTime + 946684800) * 1000

  if (!wallet) return <div className="pt-32 text-center text-white">Please Connect Wallet</div>

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white">My Sent Payments</h2>
            <p className="text-slate-400 text-sm">Escrows you created</p>
        </div>
        <Link to="/pay" className="text-sm bg-blue-600 px-4 py-2 rounded-lg text-white font-bold hover:bg-blue-500 shadow-lg">
          + New Payment
        </Link>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-slate-800 pb-1">
        <button onClick={() => setActiveTab('active')} className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'active' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"}`}>
            <Activity size={16} /> Active
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'history' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"}`}>
            <History size={16} /> History
        </button>
      </div>

      {status && <div className="text-blue-300 text-sm mb-4 animate-pulse">{status}</div>}

      {/* ACTIVE VIEW */}
      {activeTab === 'active' && (
        <div className="grid gap-4">
            {sentEscrows.length === 0 && !status && <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">No active payments.</div>}
            {sentEscrows.map((escrow) => {
                const canRefund = isRefundable(escrow.CancelAfter)
                return (
                    <div key={escrow.index} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-white">{parseInt(escrow.Amount) / 1000000} XRP</span>
                            <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wide">Sent</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">To: {escrow.Destination}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDispute} className="text-xs text-slate-500 hover:text-white underline px-2">Raise Dispute</button>
                        <button onClick={() => handleRefund(escrow)} disabled={!canRefund} className={`text-xs px-4 py-2 rounded font-bold border transition-all ${canRefund ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-white" : "border-slate-700 text-slate-600 cursor-not-allowed bg-slate-800/50"}`}>{canRefund ? "Claim Refund" : "Refund Locked"}</button>
                    </div>
                    </div>
                )
            })}
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeTab === 'history' && (
        <div className="grid gap-4">
            {/* 👇 UPDATED: Friendly message instead of error */}
            {history.length === 0 && !status && (
                <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
                    No past payments found.
                </div>
            )}
            
            {history.map((tx) => (
                <div key={tx.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4 opacity-75">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${tx.type === 'COMPLETED' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{tx.type}</span>
                            <span className="text-xs text-slate-500">{tx.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-mono">ID: {tx.sequence}</p>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}