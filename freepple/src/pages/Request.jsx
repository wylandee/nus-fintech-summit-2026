import { useState, useEffect } from 'react'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { GlowButton } from '../components/GlowButton'

export function Request({ wallet }) {
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Auto-generate link when inputs change
  useEffect(() => {
    if (!wallet) return
    
    // Get the current website URL (works for localhost or production)
    const baseUrl = window.location.origin
    
    // Create the parameters
    const params = new URLSearchParams({
      to: wallet.address, // The money goes to ME (Freelancer)
      amount: amount,
      memo: memo
    })

    setGeneratedLink(`${baseUrl}/pay?${params.toString()}`)
    setIsCopied(false)
  }, [amount, memo, wallet])

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  if (!wallet) return <div className="pt-32 text-center text-white">Please Connect Wallet</div>

  return (
    <div className="pt-32 px-4 flex justify-center">
      <Card title="Request Payment" subtitle="Create a secure payment link to send to your client.">
        
        {/* Read-Only Field showing where money will go */}
        <div className="mb-4">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Receiving Address (You)</label>
            <div className="bg-slate-900/50 border border-slate-700 text-slate-300 p-3 rounded-lg text-xs font-mono break-all">
                {wallet.address}
            </div>
        </div>

        <Input 
          label="Amount Requested (XRP)" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 100"
        />

        <Input 
          label="Job Description (Memo)" 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. Logo Design Milestone 1"
        />

        {/* The Magic Link Result */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
            <label className="block text-blue-400 text-xs font-bold mb-2 uppercase tracking-widest">
                Send this link to Client
            </label>
            
            <div className="bg-black/50 p-3 rounded border border-blue-900/50 mb-4 break-all font-mono text-xs text-slate-300">
                {generatedLink}
            </div>

            <GlowButton onClick={handleCopy} variant={isCopied ? "secondary" : "primary"}>
                {isCopied ? "✅ Copied!" : "📋 Copy Link"}
            </GlowButton>
        </div>

      </Card>
    </div>
  )
}