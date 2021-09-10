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
import alasql from 'alasql';
import type { ICache } from 'helpers-caching';
import type { ILogger } from 'helpers-logging';
import { injectable, interfaces } from 'inversify';
import objectHash from 'object-hash';

import { fromMethodsSymbol, IAlaSQLFunctionSymbol, intoMethodsSymbol } from '../../symbols';
import type { IQueryableProvider } from '../iqueryable-provider';
import type { ProviderType } from '../provider-type';
import type { IFromMethod } from './from-method/ifrom-method';
import type { IFromMethodOptions } from './from-method/ifrom-method-options';
import type { IAlaSQLFunction } from './function/ialasql-function';
import type { IIntoMethod } from './into-method/iinto-method';
import type { IIntoMethodOptions } from './into-method/iinto-method-options';

@injectable()
export abstract class BaseAlaSQLQueryableProvider implements IQueryableProvider {
  private static readonly defaultFromMethodOptions: IFromMethodOptions = {};

  private static readonly defaultIntoMethodOptions: IIntoMethodOptions = {
    append: false,
  };

  private static _alasqlInitialized = false;

  public abstract get providerType(): ProviderType;

  constructor(protected readonly logger: ILogger, private readonly cache: ICache,
    private container: interfaces.Container) {
    if (!BaseAlaSQLQueryableProvider._alasqlInitialized) {
      this.addFromMethods();
      this.addIntoMethods();
      this.addFunctions();
      BaseAlaSQLQueryableProvider._alasqlInitialized = true;
    }
  }

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

  private addFromMethods(): void {
    this.logger.debug('Adding FROM methods');
    const fromMethods = <IFromMethod[]>Reflect.getMetadata(fromMethodsSymbol, this.constructor);
    fromMethods?.forEach((method) => {
      this.logger.trace(`Adding '${method.name}' method`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (<any>alasql).from[method.name] = (tableName: string, options: IFromMethodOptions,
        callback: (data: any[], idx: number, query: any) => any, idx: number, query: any) => {
        const mergedOptions = {
          ...BaseAlaSQLQueryableProvider.defaultFromMethodOptions,
          ...options,
        };
        const data = method.callback.bind(this)(tableName, mergedOptions);
        if (callback) {
          return callback(data, idx, query);
        }

        return data;
      };
    });
  }

  private addIntoMethods(): void {
    this.logger.debug('Adding INTO methods');
    const intoMethods = <IIntoMethod[]>Reflect.getMetadata(intoMethodsSymbol, this.constructor);
    intoMethods?.forEach((method) => {
      this.logger.trace(`Adding '${method.name}' method`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (<any>alasql).into[method.name] = (tableName: string, options: IIntoMethodOptions,
        data: any[], _: any, callback: (data: any[]) => any) => {
        const mergedOptions = {
          ...BaseAlaSQLQueryableProvider.defaultIntoMethodOptions,
          ...options,
        };
        method.callback.bind(this)(tableName, mergedOptions, data);
        if (callback) {
          return callback(data);
        }

        return data;
      };
    });
  }

  private addFunctions(): void {
    this.logger.debug('Adding custom functions');
    this.container.getAll<IAlaSQLFunction>(IAlaSQLFunctionSymbol).forEach((func) => {
      this.logger.trace(`Adding '${func.name.toUpperCase()}' function`);
      alasql.fn[func.name.toUpperCase()] = (...parameters: any[]) => func.callback(...parameters);
    });
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

    this.logger.debug('Running query');
    const result = (<any[]>alasql(query, parameters)).map((row) => <TRow>row);
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

    this.logger.debug('Running query');
    const result = alasql(query, parameters);
    if (cacheKey) {
      this.putCache<any[][]>(query, cacheKey, parameters, result);
    }

    this.logger.trace(`The result of the query is '${JSON.stringify(result)}'`);
    return result;
  }
}
