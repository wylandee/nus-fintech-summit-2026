export function Input({ label, value, onChange, placeholder, readOnly, type = "text" }) {
  return (
    <div className="mb-5">
      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
        {label}
      </label>
      <input 
        type={type}
        className={`
          w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-white 
          placeholder:text-slate-600 outline-none transition-all
          focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          ${readOnly ? 'opacity-60 cursor-default bg-slate-900' : ''}
        `}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  )
}