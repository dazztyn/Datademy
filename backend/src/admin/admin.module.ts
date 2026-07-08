import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuarios.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema }
    ])
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}