import { useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

export function Toast({ message, type = 'success', onClose }) {
  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = type === 'success'

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
        isSuccess 
          ? 'bg-slate-900/90 border-green-500/50 text-white' 
          : 'bg-slate-900/90 border-red-500/50 text-white'
      } backdrop-blur-md min-w-[300px]`}>
        
        {isSuccess ? <CheckCircle className="text-green-500" size={24} /> : <AlertCircle className="text-red-500" size={24} />}
        
        <div className="flex-1">
          <h4 className="font-bold text-sm">{isSuccess ? "Success" : "Error"}</h4>
          <p className="text-xs text-slate-300">{message}</p>
        </div>

        <button onClick={onClose} className="text-slate-500 hover:text-white transition">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}