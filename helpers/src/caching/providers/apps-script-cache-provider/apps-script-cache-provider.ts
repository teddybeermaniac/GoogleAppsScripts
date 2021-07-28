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

import { ILogger, TYPES as LOGGING_TYPES } from '../../../logging';
import { bindSymbol } from '../../../utilities';
import { ICacheProviderSymbol } from '../../symbols';
import type { ICacheProvider } from '../icache-provider';
import { ProviderType } from '../provider-type';

@injectable()
@bindSymbol(ICacheProviderSymbol)
export class AppsScriptCacheProvider implements ICacheProvider {
  private static readonly ALL_KEYS_KEY = '__ALL_KEYS__';

  private readonly cache: GoogleAppsScript.Cache.Cache;

  private static getKey(prefix: string, key: string): string {
    return `${prefix}_${key}`;
  }

  // eslint-disable-next-line class-methods-use-this
  public get type(): ProviderType {
    return ProviderType.GoogleAppsScript;
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger) {
    this.cache = CacheService.getUserCache();
  }

  private getAllKeys(prefix: string): string[] {
    const allKeysJson = this.get(prefix, AppsScriptCacheProvider.ALL_KEYS_KEY);

    return allKeysJson ? <string[]>JSON.parse(allKeysJson) : [];
  }

  public get(prefix: string, key: string): string | null {
    this.logger.trace(
      `Getting cache key '${key}' with a prefix '${prefix}'`,
    );

    return this.cache.get(AppsScriptCacheProvider.getKey(prefix, key));
  }

  public set(prefix: string, key: string, value: string, ttl: number | undefined):
  void {
    if (key !== AppsScriptCacheProvider.ALL_KEYS_KEY) {
      const allKeys = this.getAllKeys(prefix);
      if (allKeys.indexOf(key) === -1) {
        allKeys.push(key);

        this.set(prefix, AppsScriptCacheProvider.ALL_KEYS_KEY, JSON.stringify(allKeys), undefined);
      }
    }

    this.logger.trace(
      `Setting cache key '${key}' with a prefix '${prefix}'${ttl !== undefined ? ` with a TTL of ${ttl}` : ''} to a value of '${value}'`,
    );
    if (ttl !== undefined) {
      this.cache.put(AppsScriptCacheProvider.getKey(prefix, key), value, ttl);
    } else {
      this.cache.put(AppsScriptCacheProvider.getKey(prefix, key), value);
    }
  }

  public del(prefix: string, key: string): void {
    this.logger.trace(`Deleting cache key '${key}' with a prefix '${prefix}'`);
    this.cache.remove(AppsScriptCacheProvider.getKey(prefix, key));

    const allKeys = this.getAllKeys(prefix);
    const keyIndex = allKeys.indexOf(key);
    if (keyIndex !== -1) {
      allKeys.splice(keyIndex, 1);
      this.set(prefix, AppsScriptCacheProvider.ALL_KEYS_KEY, JSON.stringify(allKeys), undefined);
    }
  }

  public clear(prefix: string): void {
    let allKeys = this.getAllKeys(prefix);
    allKeys = [...allKeys, AppsScriptCacheProvider.ALL_KEYS_KEY];

    this.logger.trace(
      `Deleting cache keys '${allKeys.join('\', \'')}' with a prefix '${prefix}'`,
    );
    this.cache.removeAll(allKeys.map((key) => AppsScriptCacheProvider.getKey(prefix, key)));
  }
}
