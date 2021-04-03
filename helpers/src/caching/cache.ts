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
import * as logging from '../logging';
import type { ICache } from './icache';
import type { ICacheProvider } from './providers/icache-provider';
import { ICacheProviderSymbol } from './symbols';

@injectable()
export class Cache implements ICache {
  private prefix: string | undefined;

  private initialized = false;

  public constructor(@inject(logging.TYPES.ILogger) private readonly logger: logging.ILogger,
    @inject(ICacheProviderSymbol) private readonly provider: ICacheProvider) {
    this.logger.initialize(Cache.name);
  }

  public initialize(prefix?: string): void {
    if (this.initialized) {
      throw new Error('Already initialized');
    }

    this.prefix = prefix;
    this.initialized = true;
    this.logger.debug(
      `Initialized${this.prefix ? ` with a '${this.prefix}' prefix` : ' without a prefix'}`,
    );
  }

  public get<T>(key: string): T | null;
  public get<T>(key: string, value: T): T;
  public get<T>(key: string, value?: T): T | null {
    this.logger.debug(`Getting cache key '${key}'`);
    const json = this.provider.get(this.prefix, key);
    if (json === null) {
      this.logger.debug(`Key '${key}' not found in cache`);
      return value !== undefined ? value : null;
    }

    this.logger.debug(`Key '${key}' found in cache with value '${json}'`);
    return <T>JSON.parse(json);
  }

  public set<T>(key: string, value: T, ttl?: number): void {
    const json = JSON.stringify(value);
    this.logger.debug(
      `Setting cache key '${key}'${ttl !== undefined ? ` with a TTL of ${ttl}s` : ''} to value '${json}'`,
    );
    this.provider.set(this.prefix, key, json, ttl);
  }

  public del(key: string): void {
    this.logger.debug(`Deleting key '${key}' from cache`);
    this.provider.del(this.prefix, key);
  }

  public clear(): void {
    this.logger.debug('Clearing the cache');
    this.provider.clear(this.prefix);
  }
}
