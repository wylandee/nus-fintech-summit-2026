import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { GlowButton } from '../components/GlowButton'
// Import the Engine
import { createEscrow } from '../utils/xrplManager'

export function Pay({ wallet, onConnect }) {
  const [searchParams] = useSearchParams()
  
  // Form State
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [memo, setMemo] = useState('')
  
  // Process State
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState(null) // Stores the Secret/Hash after success

  // Auto-fill from URL
  useEffect(() => {
    const urlTo = searchParams.get('to')
    const urlAmount = searchParams.get('amount')
    if (urlTo) setDestination(urlTo)
    if (urlAmount) setAmount(urlAmount)
  }, [searchParams])

  // THE REAL LOCK LOGIC
  const handleLock = async () => {
    if (!wallet) return
    setIsLoading(true)
    try {
      const result = await createEscrow(wallet, amount, destination)
      setSuccessData(result) // Switch to Success View
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
             <Input label="Transaction Hash" value={successData.txHash} readOnly />
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