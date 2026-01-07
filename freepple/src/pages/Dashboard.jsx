import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Plus, X, History, Activity } from 'lucide-react'
import { claimEscrow, connectClient, getEscrowHistory } from '../utils/xrplManager'
import { LoadingOverlay } from '../components/LoadingOverlay'
import { Toast } from '../components/Toast' // 👈 Import

export function Dashboard({ wallet }) {
  const [activeTab, setActiveTab] = useState('pending')
  const [escrows, setEscrows] = useState([])
  const [history, setHistory] = useState([]) 
  const [secrets, setSecrets] = useState({}) 
  const [status, setStatus] = useState("Loading...")
  const [showInvoiceMaker, setShowInvoiceMaker] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 🆕 NOTIFICATION STATE
  const [toast, setToast] = useState(null)

  const [invAmount, setInvAmount] = useState('')
  const [invMemo, setInvMemo] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  // ... (Keep fetchActive and fetchPast exactly the same) ...
  const fetchActive = useCallback(async () => {
    if (!wallet) return
    setStatus("Scanning Ledger...")
    try {
      const client = await connectClient()
      const response = await client.request({ command: "account_objects", account: wallet.address, type: "escrow", ledger_index: "validated" })
      const rawObjects = response.result.account_objects || []
      const myIncomingJobs = rawObjects.filter(obj => obj.Destination === wallet.address)
      const enrichedEscrows = await Promise.all(myIncomingJobs.map(async (obj) => {
        try {
          const txResponse = await client.request({ command: "tx", transaction: obj.PreviousTxnID })
          const txData = txResponse.result.tx_json || txResponse.result
          return { ...obj, realSequence: txData.Sequence }
        } catch (err) { return { ...obj, realSequence: "ERROR" } }
      }))
      setEscrows(enrichedEscrows)
      setStatus("") 
    } catch (error) { setStatus("") }
  }, [wallet])

  const fetchPast = useCallback(async () => {
    if (!wallet) return
    setStatus("Loading History...")
    try {
      const pastTx = await getEscrowHistory(wallet.address)
      const myClaims = pastTx.filter(tx => tx.account === wallet.address && tx.type === 'COMPLETED')
      setHistory(myClaims)
      setStatus("")
    } catch (error) { setHistory([]); setStatus("") }
  }, [wallet])

  useEffect(() => {
    if (activeTab === 'pending') fetchActive()
    else fetchPast()
  }, [activeTab, fetchActive, fetchPast])

  const handleGenerateLink = () => {
    if (!invAmount) return setToast({ type: 'error', message: "Please enter an amount" }) // 👈 Toast
    const baseUrl = window.location.origin
    const link = `${baseUrl}/pay?to=${wallet.address}&amount=${invAmount}&memo=${encodeURIComponent(invMemo)}`
    setGeneratedLink(link)
    setCopied(false)
  }

  // ... (Keep copyToClipboard, handleAmountInput, handleSecretChange) ...
  const copyToClipboard = () => { navigator.clipboard.writeText(generatedLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleAmountInput = (e) => { const cleanVal = e.target.value.replace(/[^0-9.]/g, ''); setInvAmount(cleanVal) }
  const handleSecretChange = (id, value) => { setSecrets(prev => ({ ...prev, [id]: value })) }

  const handleUnlock = async (index) => {
    const secret = secrets[index]
    if (!secret) return setToast({ type: 'error', message: "Please enter the Secret Key!" }) // 👈 Toast
    
    const escrow = escrows.find(e => e.index === index)
    if (!escrow.realSequence || escrow.realSequence === "ERROR") return setToast({ type: 'error', message: "Error: ID missing, try refreshing" })

    setIsProcessing(true)
    try {
      await claimEscrow(wallet, escrow.Account, escrow.realSequence, escrow.Condition, secret)
      setSecrets(prev => ({ ...prev, [index]: '' }))
      await fetchActive() 
      setToast({ type: 'success', message: "Payment Unlocked Successfully!" }) // 👈 Toast
    } catch (error) {
      setToast({ type: 'error', message: "Unlock Failed: " + error.message }) // 👈 Toast
    } finally {
      setIsProcessing(false)
    }
  }

  if (!wallet) return <div className="pt-32 text-center text-white">Please Connect Wallet</div>

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      
      {/* 👇 UI INJECTION */}
      {isProcessing && <LoadingOverlay message="Unlocking Funds..." />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Freelancer Dashboard</h2>
          <p className="text-slate-400 text-sm">Incoming Payments</p>
        </div>
        <button onClick={() => setShowInvoiceMaker(!showInvoiceMaker)} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${showInvoiceMaker ? "bg-slate-700 text-slate-300" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"}`}>
          {showInvoiceMaker ? <X size={18} /> : <Plus size={18} />} {showInvoiceMaker ? "Close" : "Create Request"}
        </button>
      </div>

      {/* INVOICE MAKER */}
      {showInvoiceMaker && (
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span>📄</span> Generate Payment Link</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input type="text" inputMode="decimal" placeholder="Amount (XRP)" value={invAmount} onChange={handleAmountInput} className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"/>
            <input type="text" placeholder="Job Description (Memo)" value={invMemo} onChange={(e) => setInvMemo(e.target.value)} className="flex-[2] bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"/>
            <button onClick={handleGenerateLink} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition">Generate</button>
          </div>
          {generatedLink && (
             <div className="bg-black/50 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between border border-blue-500/30 gap-4">
               <code className="text-blue-400 text-sm truncate w-full md:w-auto font-mono select-all">{generatedLink}</code>
               <button onClick={copyToClipboard} className="text-white hover:text-blue-400 font-bold flex items-center gap-2 whitespace-nowrap">{copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}{copied ? "Copied!" : "Copy Link"}</button>
             </div>
          )}
        </div>
      )}

      {/* TABS (Same as before) */}
      <div className="flex gap-4 mb-6 border-b border-slate-800 pb-1">
        <button onClick={() => setActiveTab('pending')} className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'pending' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"}`}><Activity size={16} /> Pending</button>
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'history' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"}`}><History size={16} /> Completed</button>
      </div>

      {status && <div className="bg-blue-900/30 text-blue-200 p-3 rounded-lg mb-4 text-sm animate-pulse">{status}</div>}

      {/* PENDING VIEW (Same as before) */}
      {activeTab === 'pending' && (
        <div className="grid gap-4">
            {escrows.length === 0 && !status && <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 text-slate-500">No pending payments.</div>}
            {escrows.map((escrow) => (
            <div key={escrow.index} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-md hover:border-slate-700 transition">
                <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-bold text-white">{parseInt(escrow.Amount) / 1000000} XRP</span>
                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-wide">Locked</span>
                </div>
                <div className="text-xs text-slate-500 font-mono space-y-1">
                    <p>From: {escrow.Account}</p>
                    <p>ID: <span className="text-slate-300">{escrow.realSequence}</span></p>
                </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                <input placeholder="Paste Secret Key..." className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition w-full md:w-48" onChange={(e) => handleSecretChange(escrow.index, e.target.value)} value={secrets[escrow.index] || ''} />
                <button onClick={() => handleUnlock(escrow.index)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-green-900/20 active:scale-95 transition">Unlock</button>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* HISTORY VIEW (Same as before) */}
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