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
import { getBindMetadata } from 'helpers-utilities';
import { injectable, interfaces } from 'inversify';

import { InvalidFromMethodError, InvalidIntoMethodError } from '../../errors';
import { InvalidFunctionError } from '../../errors/invalid-function-error';
import {
  fromMethodsSymbol,
  IAlaSQLFunctionConstructorSymbol,
  IAlaSQLFunctionSymbol,
  IExecutionContextSymbol,
  intoMethodsSymbol,
} from '../../symbols';
import { BaseQueryableProvider } from '../base-queryable-provider';
import type { ProviderType } from '../provider-type';
import type { IFromMethod } from './from-method/ifrom-method';
import type { IFromMethodOptions } from './from-method/ifrom-method-options';
import type { IAlaSQLFunction } from './function/ialasql-function';
import type { IExecutionContext } from './iexecution-context';
import type { IIntoMethod } from './into-method/iinto-method';
import type { IIntoMethodOptions } from './into-method/iinto-method-options';

@injectable()
export abstract class BaseAlaSQLQueryableProvider extends BaseQueryableProvider {
  private static _alaSQLQueryableProviderInitialized: { [key: string]: boolean; } = {};

  private static _baseAlaSQLQueryableProviderInitialized = false;

  private static readonly defaultFromMethodOptions: IFromMethodOptions = {};

  private static readonly defaultIntoMethodOptions: IIntoMethodOptions = {
    append: false,
  };

  public abstract get providerType(): ProviderType;

  constructor(logger: ILogger, cache: ICache, private readonly container: interfaces.Container) {
    super(logger, cache);

    if (!BaseAlaSQLQueryableProvider._alaSQLQueryableProviderInitialized[this.constructor.name]) {
      this.addFromMethods();
      this.addIntoMethods();
      BaseAlaSQLQueryableProvider._alaSQLQueryableProviderInitialized[this.constructor.name] = true;
    }
    if (!BaseAlaSQLQueryableProvider._baseAlaSQLQueryableProviderInitialized) {
      this.addFunctions();
      BaseAlaSQLQueryableProvider._baseAlaSQLQueryableProviderInitialized = true;
    }
  }

  private addFromMethods(): void {
    this.logger.debug('Adding FROM methods');
    const fromMethods = <IFromMethod[]>Reflect.getMetadata(fromMethodsSymbol, this.constructor);
    fromMethods?.forEach((method) => {
      this.logger.trace(`Adding '${method.name}' method`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (<any>alasql).from[method.name] = (tableName: string, options: IFromMethodOptions,
        callback: (data: any[], idx: number, query: any) => any, idx: number, query: any) => {
        const context = this.container.get<IExecutionContext>(IExecutionContextSymbol);
        if (context.provider.providerType !== this.providerType) {
          throw new InvalidFromMethodError(method.name, context.provider.constructor.name);
        }

        const mergedOptions = {
          ...BaseAlaSQLQueryableProvider.defaultFromMethodOptions,
          ...options,
        };
        const data = method.callback.bind(context.provider)(tableName, mergedOptions);
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
        data: any[], columns: any[], callback: (data: undefined) => void) => {
        const context = this.container.get<IExecutionContext>(IExecutionContextSymbol);
        if (context.provider.providerType !== this.providerType) {
          throw new InvalidIntoMethodError(method.name, context.provider.constructor.name);
        }

        const mergedOptions = {
          ...BaseAlaSQLQueryableProvider.defaultIntoMethodOptions,
          ...options,
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const columnNames = columns.map((column) => <string>column.columnid);
        method.callback.bind(context.provider)(tableName, mergedOptions, columnNames, data);
        if (callback) {
          return callback(undefined);
        }

        return undefined;
      };
    });
  }

  private addFunctions(): void {
    this.logger.debug('Adding custom functions');
    this.container.getAll<interfaces.Newable<IAlaSQLFunction>>(IAlaSQLFunctionConstructorSymbol)
      .forEach((constructor) => {
        const { name } = getBindMetadata(constructor);
        if (!name) {
          throw new InvalidFunctionError(constructor.name);
        }

        this.logger.trace(`Adding '${name}' function`);
        alasql.fn[name] = (...parameters) => {
          this.container
            .getNamed<IAlaSQLFunction>(IAlaSQLFunctionSymbol, name).callback(parameters);
        };
      });
  }

  protected runQuery<TRow>(query: string, parameters: any[]): TRow[] {
    const context = this.container.get<IExecutionContext>(IExecutionContextSymbol);

    return context.execute(this, () => (<any[]>alasql(query, parameters)).map((row) => <TRow>row));
  }

  protected runQueryAny(query: string, parameters: any[]): any[][] {
    const context = this.container.get<IExecutionContext>(IExecutionContextSymbol);

    return context.execute(this, () => alasql(query, parameters));
  }
}
