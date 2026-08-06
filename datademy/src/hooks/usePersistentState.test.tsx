import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistedState } from './usePersistentState'

describe('usePersistedState', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('inicializa con el valor guardado en sessionStorage si existe', () => {
    sessionStorage.setItem('mi_key', JSON.stringify('valor guardado'))
    const { result } = renderHook(() => usePersistedState('mi_key', 'valor por defecto'))
    expect(result.current[0]).toBe('valor guardado')
  })

  it('usa el valor por defecto si no hay nada guardado', () => {
    const { result } = renderHook(() => usePersistedState('key_nueva', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('persiste en sessionStorage cuando cambia el valor', () => {
    const { result } = renderHook(() => usePersistedState('mi_key', ''))
    act(() => result.current[1]('nuevo valor'))
    expect(sessionStorage.getItem('mi_key')).toBe(JSON.stringify('nuevo valor'))
  })

  it('REGRESIÓN: al cambiar de key no arrastra el valor viejo ni lo escribe bajo la key nueva', () => {
    const { result, rerender } = renderHook(
      ({ key }) => usePersistedState(key, ''),
      { initialProps: { key: 'proceso_A' } }
    )

    act(() => result.current[1]('valor de A'))
    expect(sessionStorage.getItem('proceso_A')).toBe(JSON.stringify('valor de A'))

    rerender({ key: 'proceso_B' })

    // el estado no debe seguir mostrando "valor de A" bajo la key nueva
    expect(result.current[0]).not.toBe('valor de A')
    expect(result.current[0]).toBe('') // cae al initialValue porque proceso_B no tenía nada guardado

    // y sessionStorage de proceso_B no debe haber sido contaminado con el valor de A
    expect(sessionStorage.getItem('proceso_B')).not.toBe(JSON.stringify('valor de A'))
  })

  it('REGRESIÓN: si la key nueva ya tenía un valor guardado, lo recupera en vez de perderlo', () => {
    sessionStorage.setItem('proceso_B', JSON.stringify('valor previo de B'))

    const { result, rerender } = renderHook(
      ({ key }) => usePersistedState(key, ''),
      { initialProps: { key: 'proceso_A' } }
    )

    act(() => result.current[1]('valor de A'))
    rerender({ key: 'proceso_B' })

    expect(result.current[0]).toBe('valor previo de B')
  })
})