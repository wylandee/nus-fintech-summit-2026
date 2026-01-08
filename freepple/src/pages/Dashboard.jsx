import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Plus, X, History, Activity, BadgeCheck, AlertCircle } from 'lucide-react'
import { claimEscrow, connectClient, getEscrowHistory, checkIdentity } from '../utils/xrplManager'
import { LoadingOverlay } from '../components/LoadingOverlay'
import { Toast } from '../components/Toast'

export function Dashboard({ wallet }) {
  const [activeTab, setActiveTab] = useState('pending')
  const [escrows, setEscrows] = useState([])
  const [history, setHistory] = useState([]) 
  const [secrets, setSecrets] = useState({}) 
  const [status, setStatus] = useState("Loading...")
  const [showInvoiceMaker, setShowInvoiceMaker] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Invoice Form State
  const [invAmount, setInvAmount] = useState('')
  const [invMemo, setInvMemo] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  // 1. FETCH ACTIVE (Pending Payments)
  const fetchActive = useCallback(async () => {
    if (!wallet) return
    setStatus("Scanning Ledger...")
    try {
      const client = await connectClient()
      const response = await client.request({
        command: "account_objects",
        account: wallet.address,
        type: "escrow",
        ledger_index: "validated"
      })
      const rawObjects = response.result.account_objects || []
      const myIncomingJobs = rawObjects.filter(obj => obj.Destination === wallet.address)
      
      const enrichedEscrows = await Promise.all(myIncomingJobs.map(async (obj) => {
        try {
          const txResponse = await client.request({ command: "tx", transaction: obj.PreviousTxnID })
          const txData = txResponse.result.tx_json || txResponse.result
          
          // 👇 CHECK CLIENT VERIFICATION
          const isVerified = await checkIdentity(obj.Account)

          return { 
            ...obj, 
            realSequence: txData.Sequence,
            isSenderVerified: isVerified 
          }
        } catch (err) { return { ...obj, realSequence: "ERROR" } }
      }))

      setEscrows(enrichedEscrows)
      setStatus("") 
    } catch (error) {
      console.error("❌ Active Fetch Error:", error)
      setStatus("") 
    }
  }, [wallet])

  // 2. FETCH HISTORY (Completed Payments)
  const fetchPast = useCallback(async () => {
    if (!wallet) return
    setStatus("Loading History...")
    try {
      const pastTx = await getEscrowHistory(wallet.address)
      const myClaims = pastTx.filter(tx => {
          return tx.account === wallet.address && tx.type === 'COMPLETED'
      })
      setHistory(myClaims)
      setStatus("")
    } catch (error) {
      console.error("❌ History Error:", error)
      setHistory([]) 
      setStatus("") 
    }
  }, [wallet])

  // 3. TAB SWITCHER
  useEffect(() => {
    if (activeTab === 'pending') {
        fetchActive()
    } else {
        fetchPast()
    }
  }, [activeTab, fetchActive, fetchPast])

  // 4. GENERATE SECURE LINK
  const handleGenerateLink = () => {
    if (!invAmount) return setToast({ type: 'error', message: "Please enter an amount" })
    
    const payload = {
      to: wallet.address,
      amount: invAmount,
      memo: invMemo,
      timestamp: Date.now()
    }

    try {
      const jsonString = JSON.stringify(payload)
      const base64 = btoa(jsonString)
      const encodedData = encodeURIComponent(base64)
      
      const baseUrl = window.location.origin
      const link = `${baseUrl}/pay?data=${encodedData}`
      
      setGeneratedLink(link)
      setCopied(false)
    } catch (error) {
      setToast({ type: 'error', message: "Error generating link" })
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAmountInput = (e) => {
    const val = e.target.value
    const cleanVal = val.replace(/[^0-9.]/g, '')
    setInvAmount(cleanVal)
  }

  const handleSecretChange = (id, value) => {
    setSecrets(prev => ({ ...prev, [id]: value }))
  }

  // 5. UNLOCK FUNDS
  const handleUnlock = async (index) => {
    const secret = secrets[index]
    if (!secret) return setToast({ type: 'error', message: "Please enter Secret!" })
    
    const escrow = escrows.find(e => e.index === index)
    if (!escrow.realSequence || escrow.realSequence === "ERROR") return setToast({ type: 'error', message: "Error: ID missing" })

    setIsProcessing(true)
    try {
      await claimEscrow(wallet, escrow.Account, escrow.realSequence, escrow.Condition, secret)
      
      setSecrets(prev => ({ ...prev, [index]: '' }))
      await fetchActive() 
      setToast({ type: 'success', message: "✅ Success! Money Unlocked." })
      
    } catch (error) {
      setToast({ type: 'error', message: "Error: " + error.message })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!wallet) return <div className="pt-32 text-center text-white">Please Connect Wallet</div>

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      
      {isProcessing && <LoadingOverlay message="Unlocking Funds..." />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Freelancer Dashboard</h2>
          <p className="text-slate-400 text-sm">Incoming Payments</p>
        </div>
        <button 
          onClick={() => setShowInvoiceMaker(!showInvoiceMaker)}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${
              showInvoiceMaker ? "bg-slate-700 text-slate-300" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
          }`}
        >
          {showInvoiceMaker ? <X size={18} /> : <Plus size={18} />}
          {showInvoiceMaker ? "Close" : "Create Request"}
        </button>
      </div>

      {showInvoiceMaker && (
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span>📄</span> Generate Secure Invoice</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input type="text" inputMode="decimal" placeholder="Amount (XRP)" value={invAmount} onChange={handleAmountInput} className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"/>
            <input type="text" placeholder="Job Description (Memo)" value={invMemo} onChange={(e) => setInvMemo(e.target.value)} className="flex-[2] bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"/>
            <button onClick={handleGenerateLink} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition">Generate Link</button>
          </div>
          {generatedLink && (
             <div className="bg-black/50 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between border border-blue-500/30 gap-4">
               <div className="overflow-hidden w-full">
                 <p className="text-xs text-slate-500 mb-1">Secure Encoded Link:</p>
                 <code className="text-blue-400 text-sm truncate block w-full font-mono select-all">{generatedLink}</code>
               </div>
               <button onClick={copyToClipboard} className="text-white hover:text-blue-400 font-bold flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition">
                 {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                 {copied ? "Copied!" : "Copy"}
               </button>
             </div>
          )}
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b border-slate-800 pb-1">
        <button 
            onClick={() => !isProcessing && setActiveTab('pending')} 
            disabled={isProcessing}
            className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'pending' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <Activity size={16} /> Pending
        </button>
        <button 
            onClick={() => !isProcessing && setActiveTab('history')} 
            disabled={isProcessing}
            className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'history' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-white"} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <History size={16} /> Completed
        </button>
      </div>

      {status && <div className="bg-blue-900/30 text-blue-200 p-3 rounded-lg mb-4 text-sm animate-pulse">{status}</div>}

      {/* PENDING VIEW */}
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
                    {/* 👇 VERIFICATION LOGIC (Green vs Orange) */}
                    <div className="flex items-center gap-2">
                        <span>From: {escrow.Account}</span>
                        {escrow.isSenderVerified ? (
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
                <div className="flex gap-2 w-full md:w-auto">
                <input placeholder="Paste Secret Key..." className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition w-full md:w-48" onChange={(e) => handleSecretChange(escrow.index, e.target.value)} value={secrets[escrow.index] || ''} />
                <button onClick={() => handleUnlock(escrow.index)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-green-900/20 active:scale-95 transition">Unlock</button>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeTab === 'history' && (
        <div className="grid gap-4">
            {history.length === 0 && !status && (
                <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 text-slate-500">
                    No past payments found.
                </div>
            )}
            
            {history.map((tx) => (
            <div key={tx.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4 opacity-75">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${tx.type === 'COMPLETED' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {tx.type}
                        </span>
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