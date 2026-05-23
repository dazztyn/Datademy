import { IsNotEmpty, IsString, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class PubSubMessageDto 
{
  @IsNotEmpty()
  @IsString()
  data!: string; 

  @IsNotEmpty()
  @IsString()
  messageId!: string;
}

export class RecibirWebhookDto 
{
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PubSubMessageDto)
  message!: PubSubMessageDto;

  @IsNotEmpty()
  @IsString()
  subscription!: string;
}