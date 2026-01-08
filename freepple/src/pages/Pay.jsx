import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { GlowButton } from '../components/GlowButton'
import { createEscrow } from '../utils/xrplManager'
import { LoadingOverlay } from '../components/LoadingOverlay' 

export function Pay({ wallet, onConnect }) {
  const [searchParams] = useSearchParams()
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [memo, setMemo] = useState('')
  const [duration, setDuration] = useState(24)
  
  const [isLocked, setIsLocked] = useState(false) 
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    const secureData = searchParams.get('data')

    if (secureData) {
        try {
            // Decode the URL-safe string back to normal
            const jsonString = atob(secureData)
            // Decode Base64 -> JSON
            const payload = JSON.parse(jsonString)

            if (payload.to && payload.amount) {
                setDestination(payload.to)
                setAmount(payload.amount)
                setMemo(payload.memo || '')
                setIsLocked(true) // Lock the fields
            }
        } catch (e) {
            console.error("Link Decoding Failed:", e)
            // Don't crash, just let them type manually
        }
    } 
  }, [searchParams])

  const handleAmountChange = (e) => {
    const cleanVal = e.target.value.replace(/[^0-9.]/g, '')
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

  // Success View
  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
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
          </div>
          <div className="mt-8">
            <GlowButton onClick={() => setSuccessData(null)} variant="secondary">Make Another Payment</GlowButton>
          </div>
        </Card>
      </div>
    )
  }

  // Payment Form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-24">
      
      {isLoading && <LoadingOverlay message="Locking Funds..." />}

      <Card title="Secure Payment" subtitle={isLocked ? "Invoice Details Locked" : "Funds are held in XRPL Escrow"}>
        
        {/* Destination Input */}
        <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
            <Input 
              label="Paying To (Freelancer)" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              placeholder="rRecipientAddress..."
              readOnly={isLocked} 
            />
        </div>
        
        {/* Amount Input */}
        <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
            <Input 
              label="Amount (XRP)" 
              value={amount} 
              onChange={handleAmountChange} 
              placeholder="0.00"
              readOnly={isLocked} 
              type="text" 
              inputMode="decimal"
            />
        </div>

        {/* Timer */}
        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
            Auto-Refund Timer
          </label>
          <select 
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-slate-500 transition"
          >
            <option value={0.05}>⚡️ 3 Minutes (Test)</option>
            <option value={1}>1 Hour</option>
            <option value={24}>24 Hours (Standard)</option>
            <option value={168}>7 Days (Large)</option>
          </select>
        </div>

        <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
            <Input 
              label="Job Description" 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. Website Design"
              readOnly={isLocked}
            />
        </div>

        {/* Security Badge */}
        {isLocked && (
          <div className="text-xs text-center text-green-400 font-bold mb-4 bg-green-500/10 p-3 rounded border border-green-500/20 flex items-center justify-center gap-2 animate-pulse">
            <span>🔒</span> SECURE INVOICE: Details cannot be edited.
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