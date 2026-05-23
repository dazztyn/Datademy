import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { RecibirWebhookDto } from './dto/recibir-webhook.dto';
import { EstadisticasOrquestadorService } from './estadisticas-orquestador.service';

@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly orquestador: EstadisticasOrquestadorService) {}

  @Post('webhook/respuestas')
  @HttpCode(200) // Respuesta rápida a Google Cloud
  async recibirNotificacionGoogle(@Body() cuerpoWebhook: RecibirWebhookDto) {
    try {
      // 1. Decodificamos el string Base64 que viene en el DTO de forma segura
      const dataDecodificada = Buffer.from(cuerpoWebhook.message.data, 'base64').toString('utf-8');
      const datosEvento = JSON.parse(dataDecodificada);

      // 2. Extraemos los campos que Google inyecta en el evento de RESPONSES
      const idFormulario = datosEvento.formId;
      const idRespuestaGoogle = datosEvento.responseId;
      
      const usuarioIdDummy = "id_dueño_sistema"; 
      const procesoIdDummy = "id_proceso_asociado";

      // 3. Enviamos al orquestador de forma asíncrona para no hacer esperar a Google
      this.orquestador.manejarNuevoWebhookGoogle(
        idFormulario, 
        idRespuestaGoogle, 
        usuarioIdDummy, 
        procesoIdDummy
      );

      return { estado: 'recibido' };
    } catch (error) 
    {
      throw new BadRequestException('El formato de la data de Pub/Sub no es válido.');
    }
  }
}