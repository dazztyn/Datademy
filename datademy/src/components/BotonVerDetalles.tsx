interface BotonVerDetallesProps {
  activo: boolean
  onClick: () => void
}

export default function BotonVerDetalles({ activo, onClick }: BotonVerDetallesProps) {
  return (
    <button
      onClick={onClick}
      disabled={!activo}
      className={`w-full mt-4 py-3.5 rounded-2xl font-medium text-xl transition-all duration-300 flex items-center justify-center gap-3
        ${activo
          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 opacity-100 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/30'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed scale-95 opacity-60'
        }`}
    >
      <span>Ver detalles / Generar informes</span>
    </button>
  )
}