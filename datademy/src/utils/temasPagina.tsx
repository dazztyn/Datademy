export interface TemaPagina {
  sidebar: string
  fondoDesde: string
  fondoHasta: string
}

export const temasPagina: Record<string, TemaPagina> = {
  '/detalles': {
    sidebar: '#0052b2',
    fondoDesde: '#0097b2',
    fondoHasta: '#7ed957',
  },
  '/detalles/formularios': {
    sidebar: '#6d28d9',
    fondoDesde: '#ede9fe',
    fondoHasta: '#c4b5fd',
  },
  '/detalles/visualizar': {
    sidebar: '#166534',
    fondoDesde: '#dcfce7',
    fondoHasta: '#86efac',
  },
  '/detalles/informe': {
    sidebar: '#b45309',
    fondoDesde: '#fef9c3',
    fondoHasta: '#fde68a',
  },
}

export const temaDefault = temasPagina['/detalles']