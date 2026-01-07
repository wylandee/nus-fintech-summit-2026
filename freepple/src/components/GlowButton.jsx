import { Loader2 } from 'lucide-react'

export function GlowButton({ children, onClick, isLoading, disabled, variant = 'primary' }) {
  const baseStyles = "w-full py-3.5 px-6 rounded-xl font-bold text-lg tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700",
    success: "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)]"
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!isLoading && children}
    </button>
  )
}