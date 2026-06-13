import { IsNotEmpty, IsString, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PubSubMessageDto 
{
  @IsNotEmpty()
  @IsString()
  data!: string; 

  @IsNotEmpty()
  @IsString()
  messageId!: string;
 
  @IsOptional()
  @IsString()
  publishTime?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
  
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