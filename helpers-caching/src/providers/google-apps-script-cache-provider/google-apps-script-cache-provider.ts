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
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { JSONEx, Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import { ICacheProviderSymbol } from '../../symbols';
import type ICacheProvider from '../icache-provider';
import ProviderType from '../provider-type';

@setBindMetadata(ICacheProviderSymbol, Scope.Singleton)
export default class GoogleAppsScriptCacheProvider implements ICacheProvider {
  private static readonly ALL_KEYS_KEY = '__ALL_KEYS__';

  private readonly cache: GoogleAppsScript.Cache.Cache;

  public readonly providerType = ProviderType.GoogleAppsScript;

  private static getKey(prefix: string, key: string): string {
    return `${prefix}_${key}`;
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger) {
    this.cache = CacheService.getUserCache();
  }

  private getAllKeys(prefix: string): string[] {
    this.logger.trace(`Getting all keys with prefix '${prefix}'`);
    const allKeysJson = this.get(prefix, GoogleAppsScriptCacheProvider.ALL_KEYS_KEY);

    return allKeysJson ? JSONEx.parse<string[]>(allKeysJson) : [];
  }

  public get(prefix: string, key: string): string | undefined {
    this.logger.trace(`Getting cache keys '${key}' with a prefix '${prefix}'`);
    return this.cache.get(GoogleAppsScriptCacheProvider.getKey(prefix, key)) || undefined;
  }

  public set(prefix: string, key: string, value: string, ttl?: number): void {
    if (key !== GoogleAppsScriptCacheProvider.ALL_KEYS_KEY) {
      const allKeys = this.getAllKeys(prefix);
      if (!allKeys.includes(key)) {
        allKeys.push(key);
        this.set(prefix, GoogleAppsScriptCacheProvider.ALL_KEYS_KEY, JSONEx.stringify(allKeys));
      }
    }

    this.logger.trace(() => {
      const ttlMessage = ttl ? ` and a TTL of ${ttl}` : '';

      return `Setting cache key '${key}' with a prefix '${prefix}'${ttlMessage} to a value of '${value}'`;
    });
    if (ttl) {
      this.cache.put(GoogleAppsScriptCacheProvider.getKey(prefix, key), value, ttl);
    } else {
      this.cache.put(GoogleAppsScriptCacheProvider.getKey(prefix, key), value);
    }
  }

  public del(prefix: string, key: string): void {
    this.logger.trace(`Deleting cache key '${key}' with a prefix '${prefix}'`);
    this.cache.remove(GoogleAppsScriptCacheProvider.getKey(prefix, key));

    const allKeys = this.getAllKeys(prefix);
    const keyIndex = allKeys.indexOf(key);
    if (keyIndex !== -1) {
      allKeys.splice(keyIndex, 1);
      this.set(prefix, GoogleAppsScriptCacheProvider.ALL_KEYS_KEY, JSONEx.stringify(allKeys));
    }
  }

  public clear(prefix: string): void {
    let allKeys = this.getAllKeys(prefix);
    allKeys = [...allKeys, GoogleAppsScriptCacheProvider.ALL_KEYS_KEY];

    this.logger.trace(() => `Deleting cache keys '${allKeys.join('\', \'')}' with a prefix '${prefix}'`);
    this.cache.removeAll(allKeys.map((key) => GoogleAppsScriptCacheProvider.getKey(prefix, key)));
  }
}
