export interface FiltroPlantillas 
{
    usuario_id: string;
    nombrePlantilla?: { $regex: RegExp };
}