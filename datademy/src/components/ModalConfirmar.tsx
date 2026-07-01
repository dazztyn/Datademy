interface ModalConfirmarProps {
  mensaje: string
  onConfirmar: () => void
  onCerrar: () => void
  cargando?: boolean
}

export default function ModalConfirmar({ mensaje, onConfirmar, onCerrar, cargando }: ModalConfirmarProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          ¿Estás seguro?
        </h2>
        <p className="text-md text-slate-500 dark:text-slate-400 mb-6">{mensaje}</p>
        <div className="flex gap-2">
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-md font-medium transition-colors disabled:opacity-60"
          >
            {cargando ? 'Eliminando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}