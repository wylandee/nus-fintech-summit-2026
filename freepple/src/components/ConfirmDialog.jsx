import { AlertTriangle } from 'lucide-react'

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-yellow-500/10 p-3 rounded-full">
            <AlertTriangle className="text-yellow-500" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold transition shadow-lg shadow-red-900/20"
          >
            Confirm
          </button>
        </div>

      </div>
    </div>
  )
}