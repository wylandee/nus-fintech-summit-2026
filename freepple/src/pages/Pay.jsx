import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { GlowButton } from '../components/GlowButton'
// 👇 Import the updated function name
import { createEscrow } from '../utils/xrplManager'

export function Pay({ wallet, onConnect }) {
  const [searchParams] = useSearchParams()
  
  // Form State
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [memo, setMemo] = useState('')
  // 👇 NEW: Duration State (Default 24 hours)
  const [duration, setDuration] = useState(24)
  
  // Process State
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState(null)

  // Auto-fill from URL
  useEffect(() => {
    const urlTo = searchParams.get('to')
    const urlAmount = searchParams.get('amount')
    if (urlTo) setDestination(urlTo)
    if (urlAmount) setAmount(urlAmount)
  }, [searchParams])

  const handleLock = async () => {
    if (!wallet) return
    setIsLoading(true)
    try {
      // 👇 Pass 'duration' as the 4th argument
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
             <Input label="Escrow ID (Sequence)" value={successData.sequence} readOnly />
             <div className="flex justify-between text-xs text-slate-400 px-2">
                <span>Expires:</span>
                <span className="text-white">{successData.expiry.toLocaleString()}</span>
             </div>
          </div>

          <div className="mt-8">
            <GlowButton onClick={() => setSuccessData(null)} variant="secondary">
              Make Another Payment
            </GlowButton>
          </div>
        </Card>
      </div>
    )
  }

  // VIEW 2: The Form
  return (
    <div className="pt-32 px-4 flex justify-center">
      <Card title="Secure Payment" subtitle="Funds are held in XRPL Escrow until job is done.">
        
        <Input 
          label="Paying To (Freelancer Address)" 
          value={destination} 
          onChange={(e) => setDestination(e.target.value)}
          placeholder="rRecipientAddress..."
        />
        
        <Input 
          label="Amount (XRP)" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />

        {/* 👇 NEW: Time Limit Dropdown */}
        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
            Auto-Refund Timer
          </label>
          <select 
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-slate-500 transition"
          >
            <option value={0.05}>⚡️ 3 Minutes (Fast Test)</option>
            <option value={1}>1 Hour</option>
            <option value={24}>24 Hours</option>
            <option value={168}>7 Days (Standard)</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-2">
            If the freelancer does not unlock the funds by this time, you can reclaim them.
          </p>
        </div>

        <Input 
          label="Job Description" 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. Website Design"
        />

        <div className="mt-8">
          {!wallet ? (
            <GlowButton onClick={onConnect} variant="secondary">
              Connect Wallet to Pay
            </GlowButton>
          ) : (
            <GlowButton onClick={handleLock} isLoading={isLoading}>
              🔒 Lock Funds
            </GlowButton>
          )}
        </div>
      </Card>
    </div>
  )
}