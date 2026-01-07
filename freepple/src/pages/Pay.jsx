import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { GlowButton } from '../components/GlowButton'
import { createEscrow } from '../utils/xrplManager'

export function Pay({ wallet, onConnect }) {
  const [searchParams] = useSearchParams()
  
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [memo, setMemo] = useState('')
  
  // Duration State (Default 24 hours)
  const [duration, setDuration] = useState(24)

  // Invoice Lock State
  const [isLocked, setIsLocked] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    const urlTo = searchParams.get('to')
    const urlAmount = searchParams.get('amount')
    const urlMemo = searchParams.get('memo')

    if (urlTo && urlAmount) {
      setDestination(urlTo)
      setAmount(urlAmount)
      if (urlMemo) setMemo(urlMemo)
      setIsLocked(true)
    }
  }, [searchParams])

  // 👇 INPUT SANITIZER: Prevents negative numbers
  const handleAmountChange = (e) => {
    const val = e.target.value
    // Regex: Remove anything that is NOT a number (0-9) or a decimal point (.)
    // This strips out the minus sign '-' automatically.
    const cleanVal = val.replace(/[^0-9.]/g, '')
    setAmount(cleanVal)
  }

  const handleLock = async () => {
    if (!wallet) return
    if (!amount || parseFloat(amount) <= 0) return alert("Please enter a valid amount")

    setIsLoading(true)
    try {
      const result = await createEscrow(wallet, amount, destination, duration)
      setSuccessData(result)
    } catch (error) {
      alert("Error: " + error.message)
    }
    setIsLoading(false)
  }

  // VIEW 1: Success Receipt
  if (successData) {
    return (
      <div className="pt-32 px-4 flex justify-center">
        <Card title="✅ Funds Locked!" subtitle="Send this Secret Key to the freelancer.">
          <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl mb-6 text-center">
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Unlock Secret</p>
            <p className="font-mono text-2xl text-white tracking-widest break-all select-all">
              {successData.secret}
            </p>
          </div>
          
          <div className="space-y-4">
            <Input label="Escrow ID" value={successData.sequence} readOnly />
            <Input label="Transaction Hash" value={successData.txHash} readOnly />
            
            <div className="flex justify-between text-xs text-slate-400 px-2 bg-slate-900/50 p-3 rounded border border-slate-800">
              <span>Refund Available After:</span>
              <span className="text-red-400 font-mono">
                 {successData.expiry ? successData.expiry.toLocaleString() : "24 Hours"}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <GlowButton onClick={() => setSuccessData(null)} variant="secondary">Make Another Payment</GlowButton>
          </div>
        </Card>
      </div>
    )
  }

  // VIEW 2: Payment Form
  return (
    <div className="pt-32 px-4 flex justify-center pb-20">
      <Card title="Secure Payment" subtitle={isLocked ? "Invoice Details Locked" : "Funds are held in XRPL Escrow"}>
        
        <Input 
          label="Paying To (Freelancer)" 
          value={destination} 
          onChange={(e) => setDestination(e.target.value)}
          placeholder="rRecipientAddress..."
          readOnly={isLocked}
        />
        
        {/* 👇 UPDATED INPUT: Uses the clean handler */}
        <Input 
          label="Amount (XRP)" 
          value={amount} 
          onChange={handleAmountChange} 
          placeholder="0.00"
          readOnly={isLocked}
          type="text" 
          inputMode="decimal" // Pops up number keyboard on mobile
        />

        {/* Auto-Refund Timer Dropdown */}
        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
            Auto-Refund Timer (Safety Net)
          </label>
          <select 
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-slate-500 transition"
          >
            <option value={0.05}>⚡️ 3 Minutes (Fast Test)</option>
            <option value={1}>1 Hour</option>
            <option value={24}>24 Hours (Standard)</option>
            <option value={168}>7 Days (Large Projects)</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-2">
            If the work is not unlocked by this time, you can reclaim your funds via the Dashboard.
          </p>
        </div>

        <Input 
          label="Job Description" 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. Website Design"
          readOnly={isLocked}
        />

        {isLocked && (
          <div className="text-xs text-center text-yellow-500/80 mb-4 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
            🔒 Details are fixed by the invoice link.
          </div>
        )}

        <div className="mt-4">
          {!wallet ? (
            <GlowButton onClick={onConnect} variant="secondary">
              Connect Wallet to Pay
            </GlowButton>
          ) : (
            <GlowButton onClick={handleLock} isLoading={isLoading}>
              Lock {amount || "0"} XRP
            </GlowButton>
          )}
        </div>
      </Card>
    </div>
  )
}