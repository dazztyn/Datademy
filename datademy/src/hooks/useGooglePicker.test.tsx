import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGooglePicker } from './useGooglePicker'
import { getGoogleToken } from '../services/googleToken'

vi.mock('../services/googleToken', () => ({
  getGoogleToken: vi.fn(),
}))
 
function crearDocsViewFalso() {
  const view: any = {
    mimeTypes: undefined,
    incluyeCarpetas: false,
    seleccionCarpetaHabilitada: false,
  }
  view.setMimeTypes = vi.fn((mt: string) => { view.mimeTypes = mt; return view })
  view.setIncludeFolders = vi.fn(() => { view.incluyeCarpetas = true; return view })
  view.setSelectFolderEnabled = vi.fn(() => { view.seleccionCarpetaHabilitada = true; return view })
  return view
}

function crearPickerBuilderFalso() {
  let callbackGuardado: ((data: any) => void) | null = null
  const pickerFalso = { setVisible: vi.fn() }

  const builder: any = {}
  builder.addView = vi.fn(() => builder)
  builder.setOAuthToken = vi.fn(() => builder)
  builder.setDeveloperKey = vi.fn(() => builder)
  builder.setCallback = vi.fn((cb: (data: any) => void) => { callbackGuardado = cb; return builder })
  builder.build = vi.fn(() => pickerFalso)
  builder._dispararCallback = (data: any) => callbackGuardado?.(data)
  builder._pickerFalso = pickerFalso

  return builder
}

describe('useGooglePicker', () => {
  let pickerBuilderInstanciado: any

  beforeEach(() => {
    vi.clearAllMocks()
    document.getElementById('google-picker-script')?.remove()

    pickerBuilderInstanciado = null
    ;(window as any).gapi = undefined
    ;(window as any).google = undefined
  })

  afterEach(() => {
    document.getElementById('google-picker-script')?.remove()
    ;(window as any).gapi = undefined
    ;(window as any).google = undefined
  })

  function instalarGoogleApiFalsa() {
    ;(window as any).gapi = { load: vi.fn((_name: string, cb: () => void) => cb()) }
    ;(window as any).google = {
      picker: {
        // Deben ser funciones normales (no arrow) porque el hook las invoca con `new`.
        DocsView: vi.fn(function () {
          return crearDocsViewFalso()
        }),
        PickerBuilder: vi.fn(function () {
          pickerBuilderInstanciado = crearPickerBuilderFalso()
          return pickerBuilderInstanciado
        }),
        Action: { PICKED: 'picked' },
      },
    }
  }

  it('inyecta el script de Google si todavía no existe en el documento', () => {
    renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))

    const script = document.getElementById('google-picker-script')
    expect(script).not.toBeNull()
    expect(script?.getAttribute('src')).toBe('https://apis.google.com/js/api.js')
  })

  it('no inyecta un segundo script si ya hay uno en el documento', () => {
    renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))
    renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))

    expect(document.querySelectorAll('#google-picker-script').length).toBe(1)
  })

  it('isReady queda en false si no hay token en memoria, aunque gapi ya esté listo', () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue(null)

    const { result } = renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))

    expect(result.current.isReady).toBe(false)
  })

  it('isReady se activa cuando gapi/google.picker ya están cargados y hay token', () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue('token-falso')

    const { result } = renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))

    expect(result.current.isReady).toBe(true)
  })

  it('abrirPicker() no hace nada si no hay token en memoria', () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue(null)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))
    act(() => result.current.abrirPicker())

    expect(pickerBuilderInstanciado).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('abrirPicker() construye y muestra el picker cuando hay token y la API está lista', async () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue('token-falso')

    const { result } = renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))
    await waitFor(() => expect(result.current.isReady).toBe(true))

    act(() => result.current.abrirPicker())

    expect(pickerBuilderInstanciado).not.toBeNull()
    expect(pickerBuilderInstanciado.setOAuthToken).toHaveBeenCalledWith('token-falso')
    expect(pickerBuilderInstanciado._pickerFalso.setVisible).toHaveBeenCalledWith(true)
  })

  it('en modo "formulario" filtra por el mimeType de Google Forms', async () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue('token-falso')

    const { result } = renderHook(() =>
      useGooglePicker({ onSeleccionada: vi.fn(), modo: 'formulario' })
    )
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.abrirPicker())

    const vistaCreada = vi.mocked(window.google.picker.DocsView).mock.results[0].value
    expect(vistaCreada.setMimeTypes).toHaveBeenCalledWith('application/vnd.google-apps.form')
  })

  it('en modo "documento" filtra por el mimeType de Google Docs', async () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue('token-falso')

    const { result } = renderHook(() =>
      useGooglePicker({ onSeleccionada: vi.fn(), modo: 'documento' })
    )
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.abrirPicker())

    const vistaCreada = vi.mocked(window.google.picker.DocsView).mock.results[0].value
    expect(vistaCreada.setMimeTypes).toHaveBeenCalledWith('application/vnd.google-apps.document')
  })

  it('en modo "carpeta" (default) habilita la selección de carpetas', async () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue('token-falso')

    const { result } = renderHook(() => useGooglePicker({ onSeleccionada: vi.fn() }))
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.abrirPicker())

    const vistaCreada = vi.mocked(window.google.picker.DocsView).mock.results[0].value
    expect(vistaCreada.setSelectFolderEnabled).toHaveBeenCalled()
    expect(vistaCreada.setMimeTypes).toHaveBeenCalledWith('application/vnd.google-apps.folder')
  })

  it('llama a onSeleccionada con el id y nombre del documento elegido', async () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue('token-falso')
    const onSeleccionada = vi.fn()

    const { result } = renderHook(() => useGooglePicker({ onSeleccionada }))
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.abrirPicker())

    act(() => {
      pickerBuilderInstanciado._dispararCallback({
        action: 'picked',
        docs: [{ id: 'doc-123', name: 'Mi carpeta' }],
      })
    })

    expect(onSeleccionada).toHaveBeenCalledWith('doc-123', 'Mi carpeta')
  })

  it('NO llama a onSeleccionada si la acción del callback no es PICKED (ej: cancelado)', async () => {
    instalarGoogleApiFalsa()
    vi.mocked(getGoogleToken).mockReturnValue('token-falso')
    const onSeleccionada = vi.fn()

    const { result } = renderHook(() => useGooglePicker({ onSeleccionada }))
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.abrirPicker())

    act(() => {
      pickerBuilderInstanciado._dispararCallback({ action: 'cancel', docs: [] })
    })

    expect(onSeleccionada).not.toHaveBeenCalled()
  })
})
