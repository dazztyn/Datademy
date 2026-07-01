import { Global, Module } from '@nestjs/common';
import { CacheHelperService } from './services/cache-helper.service';

@Global()
@Module({
  providers: [CacheHelperService],
  exports: [CacheHelperService],
})
export class CommonModule {}