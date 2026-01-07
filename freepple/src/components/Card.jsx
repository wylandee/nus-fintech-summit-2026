export function Card({ children, title, subtitle }) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow Effect behind the card */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-20 animate-pulse"></div>
      
      <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        {title && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}