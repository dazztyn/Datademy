interface SlotFormularioProps {
  label: string
  asignado: string | null
}

export default function SlotFormulario({ label, asignado }: SlotFormularioProps) {
  return (
    <div className="rounded-xl p-3 border border-slate-400 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      {asignado ? (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {asignado}
        </p>
      ) : (
        <button className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors">
          + Asignar
        </button>
      )}
    </div>
  )
}