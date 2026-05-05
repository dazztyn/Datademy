interface BotonVerDetallesProps {
  activo: boolean
  onClick: () => void
}

export default function BotonVerDetalles({ activo, onClick }: BotonVerDetallesProps) {
  return (
    <button
      onClick={onClick}
      disabled={!activo}
      className={`w-full mt-4 py-3.5 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-3
        ${activo
          ? 'text-white shadow-lg opacity-100 cursor-pointer hover:scale-105 hover:shadow-xl'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed scale-95 opacity-60'
        }`}
      style={activo ? { background: 'linear-gradient(to right, #f59e0b, #ea580c)' } : {}}
    >
      <span>Ver detalles / Generar informes</span>
    </button>
  )
}