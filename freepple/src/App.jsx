import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Navbar } from './components/Navbar'
import { Card } from './components/Card'
import { GlowButton } from './components/GlowButton'
import { Input } from './components/Input'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar with dummy props */}
      <Navbar walletAddress={null} onConnect={() => alert("Wallet Clicked")} />

      <div className="pt-32 px-4 flex flex-col items-center justify-center">
        
        <Card title="UI Test Bench" subtitle="Testing components with a counter">
          
          {/* Displaying the Counter in an Input */}
          <Input 
            label="Current Count" 
            value={count} 
            readOnly={true} 
          />

          <Input 
            label="Static Field" 
            placeholder="Type here to test focus..." 
          />

          {/* The Counter Button */}
          <div className="mt-6">
            <GlowButton onClick={() => setCount(count + 1)}>
              🚀 Increment Count ({count})
            </GlowButton>
          </div>

        </Card>

      </div>
    </div>
  )
}

export default App
