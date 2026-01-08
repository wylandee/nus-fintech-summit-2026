import { Loader2 } from 'lucide-react'

export function LoadingOverlay({ message = "Processing Transaction..." }) {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <Loader2 size={64} className="text-blue-500 animate-spin mb-4" />
      
      <h3 className="text-xl font-bold text-white tracking-wide animate-pulse">
        {message}
      </h3>
      <p className="text-slate-400 text-sm mt-2">Please do not close this tab.</p>
    </div>
  )
}