import { GlowButton } from './GlowButton'

// Note: I removed the login logic from here since we moved it to the Login Page.
// This is now just a display component.

export function NavBarPro({ walletAddress, setWallet }) {
  
  const handleLogout = () => {
    if(confirm("Logout?")) setWallet(null)
  }

  return (
    <nav className="fixed top-0 w-full bg-black/90 border-b border-blue-900/50 p-4 z-50 flex justify-between items-center shadow-2xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">F</div>
        <div className="text-xl font-bold text-white tracking-tighter">
          Freepple <span className="text-blue-500 text-xs uppercase bg-blue-900/30 px-2 py-1 rounded">Pro</span>
        </div>
      </div>

      <div className="flex gap-2">
        {walletAddress && (
          <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>
            <div className="flex flex-col text-right leading-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Connected</span>
              
              {/* 👇 CHANGED: Removed .substring() to show FULL address */}
              <span className="text-[10px] md:text-xs font-mono text-white select-all">
                {walletAddress}
              </span>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="ml-2 text-slate-500 hover:text-red-400 transition"
              title="Logout"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}