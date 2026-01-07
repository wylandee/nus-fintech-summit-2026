import { useState, useEffect } from 'react'
import { claimEscrow, connectClient } from '../utils/xrplManager'
import { Copy, Check, Plus, X } from 'lucide-react'

export function Dashboard({ wallet }) {
  const [escrows, setEscrows] = useState([])
  const [secrets, setSecrets] = useState({}) 
  const [status, setStatus] = useState("Loading...")
  const [showInvoiceMaker, setShowInvoiceMaker] = useState(false)
  
  // Invoice Form State
  const [invAmount, setInvAmount] = useState('')
  const [invMemo, setInvMemo] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  // 1. FETCH LOGIC (No changes)
  useEffect(() => {
    if (!wallet) return
    const fetchEscrows = async () => {
      setStatus("Connecting to Ledger...")
      try {
        const client = await connectClient()
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

        const enrichedEscrows = await Promise.all(rawObjects.map(async (obj) => {
          try {
            const txResponse = await client.request({
              command: "tx",
              transaction: obj.PreviousTxnID
            })
            const txData = txResponse.result.tx_json || txResponse.result
            return { ...obj, realSequence: txData.Sequence }
          } catch (err) {
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

  // 2. INVOICE LOGIC
  const handleGenerateLink = () => {
    if (!invAmount) return alert("Enter an amount")
    const baseUrl = window.location.origin
    const link = `${baseUrl}/pay?to=${wallet.address}&amount=${invAmount}&memo=${encodeURIComponent(invMemo)}`
    setGeneratedLink(link)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ⚡️ SIMPLIFIED INPUT HANDLER
  const handleAmountInput = (e) => {
    const val = e.target.value
    // If the character is NOT 0-9 or '.', delete it immediately.
    const cleanVal = val.replace(/[^0-9.]/g, '')
    setInvAmount(cleanVal)
  }

  // 3. CLAIM LOGIC (No changes)
  const handleUnlock = async (index) => {
    const secret = secrets[index]
    if (!secret) return alert("Please enter Secret!")
    const escrow = escrows.find(e => e.index === index)
    if (!escrow.realSequence || escrow.realSequence === "ERROR") return alert("Error: ID missing")

    try {
      await claimEscrow(wallet, escrow.Account, escrow.realSequence, escrow.Condition, secret)
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
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Freelancer Dashboard</h2>
          <p className="text-slate-400 text-sm">Manage your incoming payments</p>
        </div>
        <button 
          onClick={() => setShowInvoiceMaker(!showInvoiceMaker)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
        >
          {showInvoiceMaker ? <X size={18} /> : <Plus size={18} />}
          {showInvoiceMaker ? "Close" : "Create Request"}
        </button>
      </div>

      {showInvoiceMaker && (
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold text-white mb-4">Generate Payment Link</h3>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            
            {/* 👇 UPDATED INPUT: Type text + Regex cleaning */}
            <input 
              type="text" 
              inputMode="decimal" // Pops up number keyboard on mobile
              placeholder="Amount (XRP)" 
              value={invAmount}
              onChange={handleAmountInput}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
            />
            
            <input 
              type="text" 
              placeholder="Job Description (Memo)" 
              value={invMemo}
              onChange={(e) => setInvMemo(e.target.value)}
              className="flex-[2] bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
            />
            <button 
              onClick={handleGenerateLink}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-lg"
            >
              Generate
            </button>
          </div>

          {generatedLink && (
            <div className="bg-black/50 p-4 rounded-lg flex items-center justify-between border border-blue-500/30">
              <code className="text-blue-400 text-sm truncate mr-4">{generatedLink}</code>
              <button 
                onClick={copyToClipboard}
                className="text-white hover:text-blue-400 font-bold flex items-center gap-2"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      {status && <div className="bg-blue-900/30 text-blue-200 p-3 rounded-lg mb-4 text-sm">{status}</div>}

      <div className="grid gap-4">
        {escrows.length === 0 && !status && (
          <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl">
            <p className="text-slate-500">No active jobs found.</p>
          </div>
        )}

        {escrows.map((escrow) => (
          <div key={escrow.index} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-bold text-white">{parseInt(escrow.Amount) / 1000000} XRP</span>
                <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase">Locked</span>
              </div>
              <div className="text-xs text-slate-500 font-mono space-y-1">
                <p>From: {escrow.Account}</p>
                <p>ID: <span className="text-slate-300">{escrow.realSequence}</span></p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                placeholder="Paste Secret Key..." 
                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition"
                onChange={(e) => handleSecretChange(escrow.index, e.target.value)}
              />
              <button 
                onClick={() => handleUnlock(escrow.index)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-green-900/20"
              >
                Unlock
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}