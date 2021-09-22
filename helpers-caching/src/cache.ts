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
import {
  AlreadyInitializedError, getOwnerType, JSONEx, NotInitializedError, Scope, setBindMetadata,
} from 'helpers-utilities';
import { inject, interfaces } from 'inversify';

import type ICache from './icache';
import type ICacheProvider from './providers/icache-provider';
import type ProviderType from './providers/provider-type';
import { ICacheProviderSymbol, ICacheSymbol } from './symbols';

@setBindMetadata(ICacheSymbol, Scope.Transient)
export default class Cache implements ICache {
  public readonly providerType: ProviderType;

  private prefixInternal: string | undefined;

  private initialized = false;

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(ICacheProviderSymbol) private readonly provider: ICacheProvider) {
    this.providerType = this.provider.providerType;
  }

  private get prefix(): string {
    if (!this.initialized || !this.prefixInternal) {
      throw new NotInitializedError('Cache');
    }

    return this.prefixInternal;
  }

  public initialize(context: interfaces.Context): void {
    if (this.initialized) {
      throw new AlreadyInitializedError('Cache');
    }

    const owner = getOwnerType(context, Cache);
    this.prefixInternal = owner.name;
    this.initialized = true;
    this.logger.debug(`Initialized with a '${this.prefix}' prefix`);
  }

  public get<TValue>(key: string): TValue | undefined;
  public get<TValue>(key: string, value: TValue): TValue;
  public get<TValue>(key: string, value?: TValue): TValue | undefined {
    this.logger.debug(`Getting cache key '${key}'`);
    const json = this.provider.get(this.prefix, key);
    if (!json) {
      this.logger.debug(`Key '${key}' not found in cache`);
      return value;
    }

    this.logger.debug(`Key '${key}' found in cache with value '${json}'`);
    return JSONEx.parse<TValue>(json);
  }

  public pop<TValue>(key: string): TValue | undefined;
  public pop<TValue>(key: string, value: TValue): TValue;
  public pop<TValue>(key: string, value?: TValue): TValue | undefined {
    const result = this.get<TValue>(key);
    if (result !== undefined) {
      this.del(key);

      return result;
    }

    return value;
  }

  public set<TValue>(key: string, value: TValue, ttl?: number): void {
    const json = JSONEx.stringify(value);
    this.logger.debug(() => {
      const ttlMessage = ttl ? ` with a TTL of ${ttl}s` : '';

      return `Setting cache key '${key}'${ttlMessage} to value '${json}'`;
    });
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
