import { Controller, Post, Query, Body, HttpCode, UnauthorizedException } from '@nestjs/common';
import { EstadisticasWebhooksService } from './services/estadisticas-webhooks.service';
import { RecibirWebhookDto } from './dto/recibir-webhook.dto';

@Controller('estadisticas/webhook')
export class EstadisticasWebhooksController {
  constructor(private readonly webhooksService: EstadisticasWebhooksService) {}

  @Post('respuestas')
  @HttpCode(200)
  async recibirNotificacionGoogle(
    @Body() cuerpoWebhook: RecibirWebhookDto,
    @Query('token') token: string) 
  {
    if (!token || token !== process.env.WEBHOOK_SECRET) 
    {
      throw new UnauthorizedException('Acceso denegado. Se requiere un token válido.');
    }
    try 
    {
      console.log('=== WEBHOOK RECIBIDO DE GOOGLE ===');
      const atributos = cuerpoWebhook?.message?.attributes;

      if (!atributos || !atributos.formId) {
        console.log('Webhook sin "formId". Ignorando...');
        return { estado: 'ignorado_sin_formId' };
      }

      if (atributos.eventType !== 'RESPONSES') {
        console.log(`Evento ignorado. Google envió: ${atributos.eventType}`);
        return { estado: 'ignorado_tipo_evento' };
      }

      await this.webhooksService.manejarNuevoWebhookGoogle(atributos.formId);
      return { estado: 'recibido' };
    } 
    catch (error) 
    {
      console.error('Error al procesar el Webhook de Google:', error);
      return { estado: 'error_ignorado' };
    }
  }
}