import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { cancelEscrow, connectClient, getEscrowHistory, checkIdentity } from '../utils/xrplManager'
import { Activity, History, Plus, BadgeCheck, AlertCircle } from 'lucide-react'
import { LoadingOverlay } from '../components/LoadingOverlay'
import { Toast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function ClientDashboard({ wallet }) {
  const [activeTab, setActiveTab] = useState('active')
  const [sentEscrows, setSentEscrows] = useState([])
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState("Loading...")
  const [isProcessing, setIsProcessing] = useState(false)

  const [toast, setToast] = useState(null)
  const [confirmData, setConfirmData] = useState(null) 

  const fetchData = useCallback(async () => {
    if (!wallet) return
    setStatus("Loading...")
    try {
      if (activeTab === 'active') {
        const client = await connectClient()
        const response = await client.request({ command: "account_objects", account: wallet.address, type: "escrow", ledger_index: "validated" })
        const rawObjects = response.result.account_objects || []
        const mySentJobs = rawObjects.filter(obj => obj.Account === wallet.address)
        
        const enriched = await Promise.all(mySentJobs.map(async (obj) => {
            try {
                const tx = await client.request({ command: "tx", transaction: obj.PreviousTxnID })
                
                // Check Freelancer Verification
                const isVerified = await checkIdentity(obj.Destination)

                return { 
                    ...obj, 
                    realSequence: (tx.result.tx_json || tx.result).Sequence,
                    isDestVerified: isVerified
                }
            } catch (e) { return { ...obj, realSequence: "UNKNOWN" } }
        }))
        setSentEscrows(enriched)
      } else {
        try {
            const pastTx = await getEscrowHistory(wallet.address)
            const myHistory = pastTx.filter(tx => (tx.owner === wallet.address || (tx.type === 'CREATED' && tx.account === wallet.address)) && (tx.type === 'COMPLETED' || tx.type === 'REFUNDED'))
            setHistory(myHistory)
        } catch (e) { setHistory([]) }
      }
      setStatus("")
    } catch (error) { setStatus("") }
  }, [wallet, activeTab])

  useEffect(() => { fetchData() }, [fetchData])

  const initiateRefund = (escrow) => {
    setConfirmData({
        escrow: escrow,
        title: "Refund Payment?",
        message: "Are you sure you want to reclaim these funds? This action cannot be undone."
    })
  }

  const executeRefund = async () => {
    if (!confirmData) return
    setConfirmData(null) 
    setIsProcessing(true)

    try {
      await cancelEscrow(wallet, wallet.address, confirmData.escrow.realSequence)
      await fetchData() 
      setToast({ type: 'success', message: "Refund Successful! Money returned." }) 
    } catch (error) { 
      setToast({ type: 'error', message: "Refund Failed: " + error.message }) 
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDispute = () => setToast({ type: 'success', message: "Dispute Logged. Support will contact you." })
  const isRefundable = (rippleTime) => Date.now() > (rippleTime + 946684800) * 1000

  if (!wallet) return <div className="pt-32 text-center text-white">Please Connect Wallet</div>

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      
      {isProcessing && <LoadingOverlay message="Processing Refund..." />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmDialog 
        isOpen={!!confirmData} 
        title={confirmData?.title} 
        message={confirmData?.message} 
        onCancel={() => setConfirmData(null)}
        onConfirm={executeRefund}
      />

      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-3xl font-bold text-white">My Sent Payments</h2>
            <p className="text-slate-400 text-sm">Escrows you created</p>
        </div>
        <Link to="/pay" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition">
          <Plus size={18} /> New Payment
        </Link>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-800 pb-1">
        <button onClick={() => setActiveTab('active')} className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'active' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"}`}><Activity size={16} /> Active</button>
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'history' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"}`}><History size={16} /> History</button>
      </div>

      {status && <div className="bg-blue-900/30 text-blue-200 p-3 rounded-lg mb-4 text-sm animate-pulse">{status}</div>}

      {activeTab === 'active' && (
        <div className="grid gap-4">
            {sentEscrows.length === 0 && !status && <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 text-slate-500">No active payments found.</div>}
            {sentEscrows.map((escrow) => {
                const canRefund = isRefundable(escrow.CancelAfter)
                return (
                    <div key={escrow.index} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-md hover:border-slate-700 transition">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-bold text-white">{parseInt(escrow.Amount) / 1000000} XRP</span>
                            <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wide">Sent</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono space-y-1">
                           {/* Verification Logic */}
                           <div className="flex items-center gap-2">
                               <span>To: {escrow.Destination}</span>
                               {escrow.isDestVerified ? (
                                   <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-500/20" title="Identity Verified on XRPL">
                                       <BadgeCheck size={12} /> VERIFIED
                                   </div>
                               ) : (
                                   <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-500/20" title="No Identity Found">
                                       <AlertCircle size={12} /> UNVERIFIED
                                   </div>
                               )}
                           </div>
                           <p>ID: <span className="text-slate-300">{escrow.realSequence}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDispute} className="text-xs text-slate-500 hover:text-white underline px-2">Raise Dispute</button>
                        <button onClick={() => initiateRefund(escrow)} disabled={!canRefund} className={`text-xs px-4 py-2 rounded-lg font-bold border transition-all ${canRefund ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-white" : "border-slate-700 text-slate-600 cursor-not-allowed bg-slate-800/50"}`}>{canRefund ? "Claim Refund" : "Refund Locked"}</button>
                    </div>
                    </div>
                )
            })}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid gap-4">
            {history.length === 0 && !status && <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 text-slate-500">No past payments found.</div>}
            {history.map((tx) => (
                <div key={tx.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4 opacity-75">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${tx.type === 'COMPLETED' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{tx.type}</span>
                            <span className="text-xs text-slate-500">{tx.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-mono break-all">ID: {tx.sequence} | TX: {tx.txHash}</p>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}