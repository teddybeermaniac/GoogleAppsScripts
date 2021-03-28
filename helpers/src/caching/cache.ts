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
import { ILogger, ILoggerSymbol } from '../logging';
import type { ICache } from './icache';

@injectable()
export class Cache implements ICache {
  private readonly ALL_KEYS_KEY = '__ALL_KEYS__';

  private _cache?: GoogleAppsScript.Cache.Cache;

  private prefix?: string;

  private initialized = false;

  public constructor(@inject(ILoggerSymbol) private readonly logger: ILogger) {
  }

  private get cache(): GoogleAppsScript.Cache.Cache {
    if (!this._cache) {
      this.logger.debug('Initializing user cache');
      this._cache = CacheService.getUserCache();
    }

    return this._cache;
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}_${key}` : key;
  }

  public initialize(prefix?: string): void {
    if (this.initialized) {
      throw new Error('Already initialized');
    }

    this.logger.initialize(Cache.name);
    this.prefix = prefix;
    this.initialized = true;
    this.logger.debug('Initialized');
  }

  public get<T>(key: string, value: T): T {
    this.logger.debug(`Getting key '${key}' from cache`);
    const json = this.cache.get(this.getKey(key));
    if (json === null) {
      this.logger.debug(`Key '${key}' not found in cache`);
      return value;
    }

    this.logger.debug(`Key '${key}' found in cache with value '${json}'`);
    return <T>JSON.parse(json);
  }

  public set<T>(key: string, value: T): void {
    if (key !== this.ALL_KEYS_KEY) {
      const allKeys = this.get<string[]>(this.ALL_KEYS_KEY, []);
      if (allKeys.indexOf(key) === -1) {
        allKeys.push(key);

        this.set(this.ALL_KEYS_KEY, allKeys);
      }
    }

    const json = JSON.stringify(value);
    this.logger.debug(`Setting key '${key}' in cache to value '${json}'`);
    this.cache.put(this.getKey(key), json);
  }

  public del(key: string): void {
    this.logger.debug(`Deleting key '${key}' from cache`);
    this.cache.remove(this.getKey(key));

    const allKeys = this.get<string[]>(this.ALL_KEYS_KEY, []);
    const keyIndex = allKeys.indexOf(key);
    if (keyIndex !== -1) {
      allKeys.splice(keyIndex, 1);
      this.set(this.ALL_KEYS_KEY, allKeys);
    }
  }

  public clear(): void {
    let allKeys = this.get<string[]>(this.ALL_KEYS_KEY, []);
    allKeys = [...allKeys, this.ALL_KEYS_KEY];

    this.logger.debug(`Deleting keys '${allKeys.join('\', \'')}' from cache`);
    this.cache.removeAll(allKeys.map((key) => this.getKey(key)));
  }
}
