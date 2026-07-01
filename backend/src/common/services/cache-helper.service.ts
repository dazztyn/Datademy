import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { SafeCacheType } from '../interfaces/safe-cache.interface';

@Injectable()
export class CacheHelperService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async limpiarCacheGlobal(): Promise<void> {
    const cacheSeguro = this.cacheManager as unknown as SafeCacheType;
    try {
      if (typeof cacheSeguro.clear === 'function') await cacheSeguro.clear();
      else if (typeof cacheSeguro.reset === 'function') await cacheSeguro.reset();
      else if (cacheSeguro.store && typeof cacheSeguro.store.clear === 'function') await cacheSeguro.store.clear();
      else if (cacheSeguro.store && typeof cacheSeguro.store.reset === 'function') await cacheSeguro.store.reset();
    } catch (e) {
      console.error('Caché purgada o ignorada de forma segura');
    }
  }
}