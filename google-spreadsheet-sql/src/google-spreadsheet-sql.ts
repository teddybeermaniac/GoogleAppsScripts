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
import { exportMethod } from 'helpers-exporting';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import {
  CacheKey, CacheKeyRuntype, IQueryable, IQueryableProvider, Parameters as ProviderParameters,
  ParametersRuntype as ProviderParametersRuntype, TYPES as QUERYING_TYPES,
} from 'helpers-querying';
import { Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';
import objectHash from 'object-hash';

import InvalidCacheKeyError from './errors/invalid-cache-key-error';
import InvalidParametersError from './errors/invalid-parameters-error';
import type Parameters from './parameters';
import { ParametersRuntype } from './parameters';
import { GoogleSpreadsheetSQLSymbol } from './symbols';

@setBindMetadata(GoogleSpreadsheetSQLSymbol, Scope.Singleton)
export default class GoogleSpreadsheetSQL {
  private queryableProvider: IQueryableProvider | undefined;

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(QUERYING_TYPES.IQueryable) private readonly queryable: IQueryable) {}

  private queryInternal(query: string, cacheKey: CacheKey | undefined,
    parameters: ProviderParameters | undefined): unknown[][] | undefined {
    this.logger.information(`Running query '${query}'${cacheKey ? ' with cache' : ' without cache'}`);
    if (cacheKey !== undefined && !CacheKeyRuntype.guard(cacheKey)) {
      throw new InvalidCacheKeyError(cacheKey);
    }

    if (!this.queryableProvider) {
      this.queryableProvider = this.queryable.fromCurrentSpreadsheet();
    }

    return this.queryableProvider.queryAny(query, cacheKey, parameters);
  }

  @exportMethod(true)
  public query(query: string, cacheKey?: CacheKey, parameters?: ProviderParameters):
  unknown[][] | undefined {
    if (parameters && !ProviderParametersRuntype.guard(parameters)) {
      throw new InvalidParametersError(parameters);
    }

    return this.queryInternal(query, cacheKey, parameters);
  }

  @exportMethod(true, 'SQL')
  public sql(query: string, cacheKey?: CacheKey, parameters?: Parameters): unknown[][] | undefined {
    if (parameters && !ParametersRuntype.guard(parameters)) {
      throw new InvalidParametersError(parameters);
    }

    return this.queryInternal(query, cacheKey,
      parameters ? Object.fromEntries(parameters) : parameters);
  }

  @exportMethod(true, 'CACHEKEY')
  public cacheKey(...parameters: unknown[]): string {
    this.logger.debug('Calculating cache key');

    return objectHash.sha1(parameters);
  }
}
