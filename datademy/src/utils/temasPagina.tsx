export interface TemaPagina {
  sidebar: string
  fondoDesde: string
  fondoHasta: string
  colorInforme: string
}

export const temasPagina: Record<string, TemaPagina> = {
  '/detalles': {
    sidebar: '#0052b2',
    fondoDesde: '#0097b2',
    fondoHasta: '#7ed957',
    colorInforme: '#0097b2',
  },
  '/detalles/listado': {
    sidebar: '#6d28d9',
    fondoDesde: '#ede9fe',
    fondoHasta: '#c4b5fd',
    colorInforme: '#6d28d9',
  },
  '/detalles/graficos': {
    sidebar: '#166534',
    fondoDesde: '#dcfce7',
    fondoHasta: '#86efac',
    colorInforme: '#166534',
  },
  '/detalles/cronbach': {
    sidebar: '#b45309',
    fondoDesde: '#fef9c3',
    fondoHasta: '#fde68a',
    colorInforme: '#b45309',
  },
  '/detalles/informe': {
    sidebar: '#bd0d42',
    fondoDesde: '#87cae9',
    fondoHasta: '#a56dc2',
    colorInforme: '#870546',
  },
}

export const temaDefault = temasPagina['/detalles']