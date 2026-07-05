import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('empieza sin ningún toast visible', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toast).toBeNull()
  })

  it('mostrar() setea el mensaje y el tipo', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.mostrar('Guardado con éxito', 'exito'))

    expect(result.current.toast).toEqual({ mensaje: 'Guardado con éxito', tipo: 'exito' })
  })

  it('se auto-cierra a los 3 segundos si el tipo no es "cargando"', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.mostrar('Error al guardar', 'error'))
    expect(result.current.toast).not.toBeNull()

    act(() => vi.advanceTimersByTime(3000))

    expect(result.current.toast).toBeNull()
  })

  it('NO se auto-cierra si el tipo es "cargando"', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.mostrar('Procesando...', 'cargando'))
    act(() => vi.advanceTimersByTime(5000))

    expect(result.current.toast).toEqual({ mensaje: 'Procesando...', tipo: 'cargando' })
  })

  it('cerrar() oculta el toast inmediatamente', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.mostrar('Procesando...', 'cargando'))
    act(() => result.current.cerrar())

    expect(result.current.toast).toBeNull()
  })

  it('un nuevo llamado a mostrar() reinicia el temporizador anterior (no se cierra antes de tiempo)', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.mostrar('Primero', 'exito'))
    act(() => vi.advanceTimersByTime(2000)) // todavía no pasan los 3s

    act(() => result.current.mostrar('Segundo', 'exito'))
    act(() => vi.advanceTimersByTime(2000)) // en total pasarían 4s desde "Primero", pero solo 2s desde "Segundo"

    // el toast sigue visible porque el timer de "Segundo" recién lleva 2s
    expect(result.current.toast).toEqual({ mensaje: 'Segundo', tipo: 'exito' })

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.toast).toBeNull()
  })

  it('llamar a cerrar() cuando no hay timer activo no rompe nada', () => {
    const { result } = renderHook(() => useToast())

    expect(() => act(() => result.current.cerrar())).not.toThrow()
    expect(result.current.toast).toBeNull()
  })
})
