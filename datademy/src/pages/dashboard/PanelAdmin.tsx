import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import ModalConfirmar from '../../components/ModalConfirmar'
import ThemeToggle from '../../components/ThemeToggle'
import { temasPagina, temaDefault } from '../../utils/temasPagina'
import {
  listarUsuarios,
  crearUsuario,
  eliminarUsuario,
} from '../../services/admin_service'
import type { UsuarioAdmin, RolUsuarioAdmin } from '../../services/admin_service'

export default function PanelAdmin() {
  const navigate = useNavigate()
  const { usuario: usuarioActual } = useAuth()
  const { toast, mostrar, cerrar } = useToast()
  const tema = temasPagina['/admin'] ?? temaDefault

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [correo, setCorreo] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<RolUsuarioAdmin>('profesor')
  const [activo, setActivo] = useState(true)

  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioAdmin | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargarUsuarios = async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch {
      setError('No se pudieron cargar los usuarios')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    document.title = 'Datademy - Panel de administración'
    cargarUsuarios()
    return () => { document.title = 'Datademy' }
  }, [])

  const resetearFormulario = () => {
    setCorreo('')
    setNombre('')
    setRol('profesor')
    setActivo(true)
    setMostrarFormulario(false)
  }

  const handleCrear = async () => {
    if (!correo.trim() || !nombre.trim()) {
      return mostrar('Completa correo y nombre', 'error')
    }
    setGuardando(true)
    try {
      await crearUsuario({ correo: correo.trim(), nombre: nombre.trim(), rol, activo })
      mostrar('Usuario agregado correctamente', 'exito')
      resetearFormulario()
      cargarUsuarios()
    } catch {
      mostrar('Error al agregar usuario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
  if (!usuarioAEliminar) return
  setEliminando(true)
  try {
    const resultado = await eliminarUsuario(usuarioAEliminar._id)
    mostrar(resultado.mensaje, 'exito')
    setUsuarioAEliminar(null)
    cargarUsuarios()
  } catch (err) {
    console.error(err)
    mostrar('Error al eliminar usuario', 'error')
  } finally {
    setEliminando(false)
  }
}
  const inputClass =
    'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
  const labelClass = 'text-xs text-slate-500 dark:text-slate-400 mb-1 block'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div
        className="w-full py-3 px-6 flex items-center gap-4"
        style={{ background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})` }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="text-white/80 hover:text-white text-sm transition-colors flex items-center gap-1"
        >
          ← Volver
        </button>
        <h1 className="text-white font-semibold text-sm">Panel de administración</h1>
        <span className="text-xs text-white/80 bg-white/15 px-2.5 py-1 rounded-full ml-auto">
          {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Usuarios</h2>
          <button
            onClick={() => setMostrarFormulario(m => !m)}
            className="text-xs px-4 py-1.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})` }}
          >
            {mostrarFormulario ? 'Cancelar' : '+ Agregar usuario'}
          </button>
        </div>

        {mostrarFormulario && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Correo</label>
                <input
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="nombre@universidad.cl"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Rol</label>
                <select value={rol} onChange={e => setRol(e.target.value as RolUsuarioAdmin)} className={inputClass}>
                  <option value="profesor">Profesor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={e => setActivo(e.target.checked)}
                    style={{ accentColor: tema.sidebar }}
                  />
                  Activo
                </label>
              </div>
            </div>
            <button
              onClick={handleCrear}
              disabled={guardando}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})` }}
            >
              {guardando ? 'Agregando...' : 'Agregar usuario'}
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {cargando ? (
            <p className="text-sm text-slate-400 text-center py-10 animate-pulse">Cargando usuarios...</p>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-10">{error}</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No hay usuarios registrados.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {usuarios.map(u => (
                <div key={u._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {u.nombre}
                      {u._id === usuarioActual?.userId && (
                        <span className="text-xs text-slate-400 font-normal ml-2">(tú)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.correo}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        u.rol === 'admin'
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {u.rol}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        u.activo
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => setUsuarioAEliminar(u)}
                      disabled={u._id === usuarioActual?.userId}
                      title={u._id === usuarioActual?.userId ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario'}
                      className="text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {usuarioAEliminar && (
        <ModalConfirmar
          mensaje={`Se eliminará a ${usuarioAEliminar.nombre} (${usuarioAEliminar.correo}). Sus respuestas, procesos y configuraciones de reportes asociadas se eliminarán en segundo plano. Esta acción no se puede deshacer.`}
          onConfirmar={handleEliminar}
          onCerrar={() => setUsuarioAEliminar(null)}
          cargando={eliminando}
        />
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
      <ThemeToggle />
    </div>
  )
}
