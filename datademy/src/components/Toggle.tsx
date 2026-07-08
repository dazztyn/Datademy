interface ToggleProps<T extends string> {
  valor: T
  opcion1: T
  opcion2: T
  onChange: (v: T) => void
  className?: string
  botonClassName?: string
}

export default function Toggle<T extends string>({
  valor,
  opcion1,
  opcion2,
  onChange,
  className = '',
  botonClassName = '',
}: ToggleProps<T>) {
  return (
    <div className={`flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 ${className}`}>
      {[opcion1, opcion2].map(op => (
        <button
          key={op}
          onClick={() => onChange(op)}
          className={`flex-1 py-2 rounded-lg text-md font-medium transition-all duration-200
            ${valor === op
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-400 dark:text-slate-500'
            } ${botonClassName}`}
        >
          {op}
        </button>
      ))}
    </div>
  )
}