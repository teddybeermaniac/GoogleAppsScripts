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
/* eslint-disable @typescript-eslint/no-explicit-any */
import alasql from 'alasql';
import { injectable } from 'inversify';
import objectHash from 'object-hash';

import type { ICache } from '../../caching';
import type { ILogger } from '../../logging';
import type { IQueryableProvider } from './iqueryable-provider';
import type { ProviderType } from './provider-type';

@injectable()
export abstract class BaseAlaSQLQueryableProvider implements IQueryableProvider {
  protected abstract getTable(name: string): any[] | null;

  public abstract get providerType(): ProviderType;

  constructor(protected readonly logger: ILogger, private readonly cache: ICache) { }

  private getCache<TValue>(query: string, cacheKey: string | boolean, parameters: any[]):
  any | null {
    this.logger.trace(`Getting result of '${query}' query from cache`);
    return this.cache.get<TValue>(objectHash.sha1([query, cacheKey, parameters]));
  }

  private putCache<TValue>(query: string, cacheKey: string | boolean, parameters: any[],
    result: any) {
    this.logger.trace(`Putting result of '${query}' query into cache`);
    this.cache.set<TValue>(objectHash.sha1([query, cacheKey, parameters]), result);
  }

  private getTables(query: string): string[] {
    this.logger.trace(`Getting all tables used in query '${query}'`);
    const tables = query.match(/(?<=(FROM|JOIN)\s+\[?)[A-Za-z0-9_!]+(?=\]?)?/gi);
    if (!tables) {
      this.logger.trace('Query is not using any tables');
      return [];
    }

    const withs = query.match(/(?<=WITH\s+\[?)[A-Za-z0-9_]+(?=\]?)?/gi);
    if (withs) {
      this.logger.trace(`Query is using '${withs.join('\', \'')}' withs`);
    }
    const aliases = query.match(/(?<=AS\s+\[?)[A-Za-z0-9_]+(?=\]?)?/gi);
    if (aliases) {
      this.logger.trace(`Query is using '${aliases.join('\', \'')}' aliases`);
    }

    const usedTables = tables.filter((table) => !withs?.includes(table)
      && !aliases?.includes(table));
    this.logger.trace(`Query is using '${usedTables.join('\', \'')}' tables`);

    return usedTables;
  }

  private processQuery(query: string, parameters: any[]): [string, any[]] {
    this.logger.trace(`Processing query '${query}'`);
    const tables = this.getTables(query);

    let processedQuery = query;
    let processedParameters = parameters;

    const withQueries: string[] = [];
    const withParameters: any[] = [];
    tables?.forEach((table) => {
      const data = this.getTable(table);

      if (data) {
        withQueries.push(`[${table}] AS (SELECT * FROM ?)`);
        withParameters.push(data);
      }
    });

    if (withQueries.length > 0) {
      if (/^WITH/i.test(processedQuery)) {
        processedQuery = `,${processedQuery.substring(4)}`;
      }
      processedQuery = `WITH ${withQueries.join(', ')} ${processedQuery}`;
      processedParameters = withParameters.concat(processedParameters);
    }

    return [processedQuery, processedParameters];
  }

  public query<TRow>(query: string, cacheKey: string | boolean | null, ...parameters: any[]):
  TRow[] {
    this.logger.debug(`Querying a model ${cacheKey ? 'with cache' : 'without cache'} with query '${query}'`);
    if (cacheKey) {
      const cached = this.getCache<TRow[]>(query, cacheKey, parameters);
      if (cached !== null) {
        this.logger.debug('Result found in cache');
        return cached;
      }
    }

    const [processedQuery, processedParameters] = this.processQuery(query, parameters);

    this.logger.debug('Running query');
    const result = (<any[]>alasql(processedQuery, processedParameters)).map((row) => <TRow>row);
    if (cacheKey) {
      this.putCache<TRow[]>(query, cacheKey, parameters, result);
    }

    this.logger.trace(`The result of the query is '${JSON.stringify(result)}'`);
    return result;
  }

  public queryAny(query: string, cacheKey: string | boolean | null, ...parameters: any[]): any[][] {
    this.logger.debug(`Querying any ${cacheKey ? 'with cache' : 'without cache'} with query '${query}'`);
    if (cacheKey) {
      const cached = this.getCache<any[][]>(query, cacheKey, parameters);
      if (cached !== null) {
        this.logger.debug('Result found in cache');
        return cached;
      }
    }

    const [processedQuery, processedParameters] = this.processQuery(query, parameters);

    this.logger.debug('Running query');
    const result = alasql(processedQuery, processedParameters);
    if (cacheKey) {
      this.putCache<any[][]>(query, cacheKey, parameters, result);
    }

    this.logger.trace(`The result of the query is '${JSON.stringify(result)}'`);
    return result;
  }
}
