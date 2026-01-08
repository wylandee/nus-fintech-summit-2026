import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Loader2 } from 'lucide-react'
import { registerIdentity, checkIdentity } from '../utils/xrplManager'
import { ConfirmDialog } from './ConfirmDialog'
import { Toast } from './Toast'

export function NavBarPro({ wallet, setWallet }) {
  const [isVerified, setIsVerified] = useState(false)
  const [loadingDID, setLoadingDID] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const [toast, setToast] = useState(null)
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  // Cache first then ledger
  useEffect(() => {
    if (wallet) {
      setCheckingStatus(true)
      
      // Check cache immediately for instant UI
      const cached = localStorage.getItem(`did_verified_${wallet.address}`)
      if (cached === "true") {
          setIsVerified(true)
          setCheckingStatus(false) // Stop spinner early
      }

      // Check ledger in background (to confirm validity)
      checkIdentity(wallet.address).then((verified) => {
        setIsVerified(verified)
        setCheckingStatus(false)
      })
    }
  }, [wallet])

  const triggerConfirm = (title, message, action) => {
    setDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action()
        setDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleVerifyClick = () => {
    if (isVerified) return

    triggerConfirm(
      "Mint Decentralized ID?",
      "This will write a permanent 'DID' record to the XRP Ledger to prove you are a real user. A small gas fee applies.",
      runVerification
    )
  }

  const runVerification = async () => {
    setLoadingDID(true)
    try {
      await registerIdentity(wallet)
      
      setIsVerified(true)
      setToast({ type: 'success', message: "Identity Verified!" })
      
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
    setLoadingDID(false)
  }

  const handleLogoutClick = () => {
    triggerConfirm(
      "Disconnect Wallet?",
      "You will need to reconnect your wallet to access the dashboard again.",
      () => setWallet(null)
    )
  }

  return (
    <>
      <ConfirmDialog 
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50 h-20 flex items-center justify-between px-6">
        
        {/* Left (Logo) */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-900/20 group-hover:scale-105 transition" />
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition">
              Freepple
            </span>
          </Link>
        </div>

        {/* Right (Actions)) */}
        <div className="flex items-center gap-4">
          
          {wallet && (
            <>
              {/* Verification Status */}
              {checkingStatus ? (
                // Loading (Subtle)
                <div className="text-slate-500 text-xs flex items-center gap-2 px-3">
                  <Loader2 size={14} className="animate-spin" /> Checking ID...
                </div>
              ) : isVerified ? (
                // Verified (Green Badge)
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-sm font-bold animate-in zoom-in cursor-help shadow-lg shadow-green-900/20" title="Identity Verified on XRPL">
                  <BadgeCheck size={18} />
                  <span>Verified ID</span>
                </div>
              ) : (
                // Not Verified (Blue Button)
                <button 
                  onClick={handleVerifyClick}
                  disabled={loadingDID}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition text-sm shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingDID ? <Loader2 size={16} className="animate-spin" /> : <><BadgeCheck size={16} /> Get Verified</>}
                </button>
              )}

              {/* Wallet Display */}
              <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>
                <div className="flex flex-col text-right leading-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Connected</span>
                  <span className="text-[10px] md:text-xs font-mono text-white select-all">
                    {wallet.address}
                  </span>
                </div>
                <button 
                  onClick={handleLogoutClick}
                  className="ml-2 text-slate-500 hover:text-red-400 transition"
                  title="Logout"
                >
                  ✕
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  )
}