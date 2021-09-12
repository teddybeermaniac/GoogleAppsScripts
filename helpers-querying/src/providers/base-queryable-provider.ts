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
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { ICache } from 'helpers-caching';
import type { ILogger } from 'helpers-logging';
import objectHash from 'object-hash';

import type { IQueryableProvider } from './iqueryable-provider';
import type { ProviderType } from './provider-type';

export abstract class BaseQueryableProvider implements IQueryableProvider {
  public abstract get providerType(): ProviderType;

  protected abstract runQuery<TRow>(query: string, parameters: any[]): TRow[];

  protected abstract runQueryAny(query: string, parameters: any[]): any[][];

  constructor(protected readonly logger: ILogger, private readonly cache: ICache) { }

  private getCache<TValue>(query: string, cacheKey: string | boolean, parameters: any[]):
  any | null {
    this.logger.debug(`Getting result of '${query}' query from cache`);
    return this.cache.get<TValue>(objectHash.sha1([query, cacheKey, parameters]));
  }

  private putCache<TValue>(query: string, cacheKey: string | boolean, parameters: any[],
    result: any) {
    this.logger.debug(`Putting result of '${query}' query into cache`);
    this.cache.set<TValue>(objectHash.sha1([query, cacheKey, parameters]), result);
  }

  private queryInternal<TRow>(query: string, cacheKey: string | boolean | null, parameters: any[],
    callback: (query: string, parameters: any[]) => TRow[]): TRow[] | undefined {
    if (cacheKey) {
      const cached = this.getCache<TRow[]>(query, cacheKey, parameters);
      if (cached !== null) {
        this.logger.debug('Result found in cache');
        return cached;
      }
    }

    this.logger.debug('Running query');
    const result = callback(query, parameters);
    if (cacheKey && result !== null && result !== undefined) {
      this.putCache<TRow[]>(query, cacheKey, parameters, result);
    }

    if (result !== null && result !== undefined) {
      this.logger.trace(() => `The result of the query is '${JSON.stringify(result)}'`);
      return result;
    }

    this.logger.trace('Query returned no result');
    return undefined;
  }

  public query<TRow>(query: string, cacheKey: string | boolean | null, ...parameters: any[]):
  TRow[] | undefined {
    this.logger.debug(`Querying a model ${cacheKey ? 'with cache' : 'without cache'} with query '${query}'`);
    return this.queryInternal<TRow>(query, cacheKey, parameters,
      (query_, parameters_) => this.runQuery<TRow>(query_, parameters_));
  }

  public queryAny(query: string, cacheKey: string | boolean | null, ...parameters: any[]):
  any[][] | undefined {
    this.logger.debug(`Querying any ${cacheKey ? 'with cache' : 'without cache'} with query '${query}'`);
    return this.queryInternal<any[]>(query, cacheKey, parameters,
      (query_, parameters_) => this.runQueryAny(query_, parameters_));
  }
}
