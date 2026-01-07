import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { GlowButton } from '../components/GlowButton'

export function Pay({ wallet, onConnect }) {
  const [searchParams] = useSearchParams()
  
  // State for the form
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [memo, setMemo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 🔌 CONNECTOR LOGIC: Auto-fill from URL
  useEffect(() => {
    const urlTo = searchParams.get('to')
    const urlAmount = searchParams.get('amount')
    const urlMemo = searchParams.get('memo')

    if (urlTo) setDestination(urlTo)
    if (urlAmount) setAmount(urlAmount)
    if (urlMemo) setMemo(urlMemo)
  }, [searchParams])

  return (
    <div className="pt-32 px-4 flex justify-center">
      <Card title="Secure Payment" subtitle="Funds are held in XRPL Escrow">
        
        <Input 
          label="Paying To (Freelancer)" 
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
            <GlowButton onClick={() => alert("Logic coming soon!")} isLoading={isLoading}>
              🔒 Lock Funds
            </GlowButton>
          )}
        </div>
      </Card>
    </div>
  )
}