export interface ConsultaEstadisticas 
{
  proceso_id: string;
  $and?: Array<{
    $or: Array<Record<string, string | { $exists: boolean }>>
  }>;
  [key: string]: unknown;
}