import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleDriveService } from './services/google-drive.service';
import { GoogleFormsService } from './services/google-forms.service';

@Module({
  providers: [GoogleDriveService, GoogleFormsService],
  controllers: [GoogleController],
  exports: [GoogleDriveService, GoogleFormsService], 
})
export class GoogleModule {}
