/*
 * Copyright © 2021 Michał Przybyś <michal@przybys.eu>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { inject, injectable } from 'inversify';
import { ILogger, LOGGING_TYPES } from '../../logging';
import type { ICacheProvider } from './icache-provider';

@injectable()
export class AppsScriptCacheProvider implements ICacheProvider {
  private static readonly ALL_KEYS_KEY = '__ALL_KEYS__';

  private readonly cache: GoogleAppsScript.Cache.Cache;

  private static getKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}_${key}` : key;
  }

  public constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger) {
    this.cache = CacheService.getUserCache();
    this.logger.initialize(AppsScriptCacheProvider.name);
  }

  public get(key: string, prefix?: string): string | null {
    this.logger.trace(
      `Getting cache key '${key}'${prefix ? ` with a prefix ${prefix}` : ''}`,
    );

    return this.cache.get(AppsScriptCacheProvider.getKey(key, prefix));
  }

  public set(key: string, value: string, prefix?: string, ttl?: number): void {
    if (key !== AppsScriptCacheProvider.ALL_KEYS_KEY) {
      const allKeysJson = this.get(AppsScriptCacheProvider.ALL_KEYS_KEY, prefix);
      const allKeys = allKeysJson ? <string[]>JSON.parse(allKeysJson) : [];
      if (allKeys.indexOf(key) === -1) {
        allKeys.push(key);

        this.set(AppsScriptCacheProvider.ALL_KEYS_KEY, JSON.stringify(allKeys), prefix);
      }
    }

    this.logger.trace(
      `Setting cache key '${key}'${prefix ? ` with a prefix '${prefix}'` : ''}${ttl !== undefined ? ` with a TTL of ${ttl}` : ''} to a value of '${value}'`,
    );
    if (ttl !== undefined) {
      this.cache.put(AppsScriptCacheProvider.getKey(key, prefix), value, ttl);
    } else {
      this.cache.put(AppsScriptCacheProvider.getKey(key, prefix), value);
    }
  }

  public del(key: string, prefix?: string): void {
    this.logger.trace(`Deleting cache key '${key}'${prefix ? ` with a prefix '${prefix}'` : ''}`);
    this.cache.remove(AppsScriptCacheProvider.getKey(key, prefix));

    const allKeysJson = this.get(AppsScriptCacheProvider.ALL_KEYS_KEY, prefix);
    const allKeys = allKeysJson ? <string[]>JSON.parse(allKeysJson) : [];
    const keyIndex = allKeys.indexOf(key);
    if (keyIndex !== -1) {
      allKeys.splice(keyIndex, 1);
      this.set(AppsScriptCacheProvider.ALL_KEYS_KEY, JSON.stringify(allKeys), prefix);
    }
  }

  public clear(prefix?: string): void {
    const allKeysJson = this.get(AppsScriptCacheProvider.ALL_KEYS_KEY, prefix);
    let allKeys = allKeysJson ? <string[]>JSON.parse(allKeysJson) : [];
    allKeys = [...allKeys, AppsScriptCacheProvider.ALL_KEYS_KEY];

    this.logger.trace(
      `Deleting cache keys '${allKeys.join('\', \'')}'${prefix ? ` with a prefix '${prefix}'` : ''}`,
    );
    this.cache.removeAll(allKeys.map((key) => AppsScriptCacheProvider.getKey(key, prefix)));
  }
}
