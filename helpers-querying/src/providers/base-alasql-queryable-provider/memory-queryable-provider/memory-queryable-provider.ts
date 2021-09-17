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
import { ICache, TYPES as CACHING_TYPES } from 'helpers-caching';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { Scope, setBindMetadata, TYPES as UTILITIES_TYPES } from 'helpers-utilities';
import { inject, interfaces } from 'inversify';

import { MemoryQueryableProviderSymbol } from '../../../symbols';
import ProviderType from '../../provider-type';
import BaseAlaSQLQueryableProvider from '../base-alasql-queryable-provider';
import fromMethod from '../from-method/from-method';
import type IFromMethodOptions from '../from-method/ifrom-method-options';
import type IIntoMethodOptions from '../into-method/iinto-method-options';
import intoMethod from '../into-method/into-method';

@setBindMetadata(MemoryQueryableProviderSymbol, Scope.Transient)
export default class MemoryQueryableProvider extends BaseAlaSQLQueryableProvider {
  private readonly storage: Record<string, unknown[]> = {};

  public readonly providerType = ProviderType.Memory;

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache,
    @inject(UTILITIES_TYPES.Container) container: interfaces.Container) {
    super(logger, cache, container);
  }

  @fromMethod('MEMORY')
  public fromMemory(tableName: string, _options?: IFromMethodOptions): unknown[] {
    this.logger.debug(`Getting data from memory table '${tableName}'`);
    return [...(this.storage[tableName] ?? [])];
  }

  @intoMethod('MEMORY')
  public intoMemory(tableName: string, options: IIntoMethodOptions, _columns: string[],
    data: unknown[])
    : void {
    this.logger.debug(`${options.append ? 'Appending' : 'Inserting'} data ${options.append ? 'to' : 'into'} memory table '${tableName}'`);
    let tableStorage = this.storage[tableName];
    if (!tableStorage) {
      tableStorage = [];
      this.storage[tableName] = tableStorage;
    }

    if (options.append) {
      this.storage[tableName] = [...tableStorage, ...data];
    } else {
      this.storage[tableName] = [...data];
    }
  }
}
