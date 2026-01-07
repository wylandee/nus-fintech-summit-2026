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
  
  // New State: Are the fields locked by the URL?
  const [isLocked, setIsLocked] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    const urlTo = searchParams.get('to')
    const urlAmount = searchParams.get('amount')
    const urlMemo = searchParams.get('memo')

    // If URL data exists, fill it AND lock the fields
    if (urlTo && urlAmount) {
      setDestination(urlTo)
      setAmount(urlAmount)
      if (urlMemo) setMemo(urlMemo)
      
      setIsLocked(true) // <--- LOCK ACTIVATED
    }
  }, [searchParams])

  const handleLock = async () => {
    if (!wallet) return
    setIsLoading(true)
    try {
      const result = await createEscrow(wallet, amount, destination)
      setSuccessData(result)
    } catch (error) {
      alert("Error: " + error.message)
    }
    setIsLoading(false)
  }

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
          <Input label="Escrow ID" value={successData.sequence} readOnly />
          <Input label="Transaction Hash" value={successData.txHash} readOnly />
          <div className="mt-8">
            <GlowButton onClick={() => setSuccessData(null)} variant="secondary">Make Another Payment</GlowButton>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="pt-32 px-4 flex justify-center">
      <Card title="Secure Payment" subtitle={isLocked ? "Invoice Details Locked" : "Funds are held in XRPL Escrow"}>
        
        <Input 
          label="Paying To (Freelancer)" 
          value={destination} 
          onChange={(e) => setDestination(e.target.value)}
          placeholder="rRecipientAddress..."
          readOnly={isLocked} // <--- LOCKED
        />
        
        <Input 
          label="Amount (XRP)" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          readOnly={isLocked} // <--- LOCKED
        />

        <Input 
          label="Job Description" 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. Website Design"
          readOnly={isLocked} // <--- LOCKED
        />

        {/* Visual feedback so they know why they can't type */}
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