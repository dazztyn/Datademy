interface ModalFormularioNoDisponibleProps {
  onVolver: () => void
}

export default function ModalFormularioNoDisponible({ onVolver }: ModalFormularioNoDisponibleProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-xl text-amber-600 dark:text-amber-400">⚠</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Advertencia
        </h2>
        <p className="text-md text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Un formulario de este proceso ya no existe. Reemplácelo antes de continuar.
        </p>
        <button
          onClick={onVolver}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-md font-medium transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}