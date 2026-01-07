import { Card } from '../components/Card'
import { GlowButton } from '../components/GlowButton'

export function Dashboard({ wallet }) {
  // MOCK DATA (Until Backend arrives)
  const myEscrows = [
    { id: 1, amount: "500", sender: "rClient...9s2", condition: "A025...", status: "LOCKED" },
    { id: 2, amount: "150", sender: "rClient...x8z", condition: "B055...", status: "LOCKED" },
  ]

  if (!wallet) {
    return (
      <div className="pt-32 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Freelancer Dashboard</h2>
        <p className="text-slate-400 mb-6">Connect your wallet to see your incoming payments.</p>
      </div>
    )
  }

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-bold uppercase">Total Locked</p>
          <p className="text-3xl font-bold text-white">650 XRP</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-bold uppercase">Ready to Claim</p>
          <p className="text-3xl font-bold text-green-400">0 XRP</p>
        </div>
      </div>

      {/* Escrow Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Active Jobs</h3>
          <span className="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded-full">2 Active</span>
        </div>

        <div className="divide-y divide-slate-800">
          {myEscrows.map((escrow) => (
            <div key={escrow.id} className="p-6 flex items-center justify-between hover:bg-slate-800/50 transition">
              <div>
                <p className="font-bold text-white text-lg">{escrow.amount} XRP</p>
                <p className="text-slate-500 text-sm font-mono">From: {escrow.sender}</p>
              </div>
              
              <div className="flex items-center gap-4">
                 {/* The Unlock Input (Freelancer pastes the secret here) */}
                <input 
                  placeholder="Paste Secret Code" 
                  className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white w-40"
                />
                <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  Unlock 🔓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}