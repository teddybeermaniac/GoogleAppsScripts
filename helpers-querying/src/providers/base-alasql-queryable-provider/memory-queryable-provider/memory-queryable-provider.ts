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
import { bindSymbol, errors as utilities_errors, TYPES as UTILITIES_TYPES } from 'helpers-utilities';
import { inject, injectable, interfaces } from 'inversify';

import { MemoryQueryableProviderSymbol } from '../../../symbols';
import type { ICurrentQueryableProvider } from '../../icurrent-queryable-provider';
import { ProviderType } from '../../provider-type';
import { BaseAlaSQLQueryableProvider } from '../base-alasql-queryable-provider';
import { fromMethod } from '../from-method/from-method';
import type { IFromMethodOptions } from '../from-method/ifrom-method-options';
import type { IIntoMethodOptions } from '../into-method/iinto-method-options';
import { intoMethod } from '../into-method/into-method';

@injectable()
@bindSymbol(MemoryQueryableProviderSymbol)
export class MemoryQueryableProvider extends BaseAlaSQLQueryableProvider
  implements ICurrentQueryableProvider {
  private _storage: { [table: string]: any[]; } | undefined;

  private initialized = false;

  private get storage(): { [table: string]: any[]; } {
    if (!this.initialized || this._storage === undefined) {
      throw new utilities_errors.InitializationError('Not initialized');
    }

    return this._storage;
  }

  public get providerType(): ProviderType {
    return ProviderType.Memory;
  }

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache,
    @inject(UTILITIES_TYPES.Container) container: interfaces.Container) {
    super(logger, cache, container);
  }

  @fromMethod('MEMORY')
  public fromMemory(tableName: string, _?: IFromMethodOptions): any[] {
    this.logger.debug(`Getting data from memory table '${tableName}'`);
    return Array.from(this.storage[tableName] ?? []);
  }

  @intoMethod('MEMORY')
  public intoMemory(tableName: string, options: IIntoMethodOptions, _: string[], data: any[])
    : void {
    this.logger.debug(`${options.append ? 'Appending' : 'Inserting'} data ${options.append ? 'to' : 'into'} memory table '${tableName}'`);
    if (!this.storage[tableName]) {
      this.storage[tableName] = [];
    }

    if (options.append) {
      this.storage[tableName] = this.storage[tableName]!.concat(data);
    } else {
      this.storage[tableName] = Array.from(data);
    }
  }

  loadCurrent(): void {
    this.logger.trace('Loading empty storage');
    if (this.initialized) {
      throw new utilities_errors.InitializationError('Already initialized');
    }

    this._storage = {};

    this.initialized = true;
  }
}
