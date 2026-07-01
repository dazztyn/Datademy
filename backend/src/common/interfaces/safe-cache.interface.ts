
export interface SafeCacheType 
{
  clear?: () => Promise<unknown>;
  reset?: () => Promise<unknown>;
  store?: {
    clear?: () => Promise<unknown>;
    reset?: () => Promise<unknown>;
  };
}