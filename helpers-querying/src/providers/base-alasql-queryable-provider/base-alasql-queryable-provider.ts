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
import alasql from 'alasql';
import type { ICache } from 'helpers-caching';
import type { ILogger } from 'helpers-logging';
import { getBindMetadata } from 'helpers-utilities';
import { injectable, interfaces } from 'inversify';
import { v4 } from 'uuid';

import InvalidFromMethodError from '../../errors/invalid-from-method-error';
import InvalidFunctionError from '../../errors/invalid-function-error';
import InvalidIntoMethodError from '../../errors/invalid-into-method-error';
import {
  fromMethodsSymbol,
  IAlaSQLFunctionDefinitionSymbol,
  IAlaSQLFunctionSymbol,
  IExecutionContextSymbol,
  intoMethodsSymbol,
} from '../../symbols';
import BaseQueryableProvider from '../base-queryable-provider';
import type ProviderType from '../provider-type';
import type IExecutionContext from './execution-context/iexecution-context';
import type IFromMethod from './from-method/ifrom-method';
import type IFromMethodOptions from './from-method/ifrom-method-options';
import type IAlaSQLFunction from './functions/ialasql-function';
import type IIntoMethod from './into-method/iinto-method';
import type IIntoMethodOptions from './into-method/iinto-method-options';

@injectable()
export default abstract class BaseAlaSQLQueryableProvider extends BaseQueryableProvider {
  private static alaSQLProviderInitialized: Record<string, boolean> = {};

  private static baseAlaSQLProviderInitialized = false;

  private static readonly defaultFromMethodOptions: IFromMethodOptions = {};

  private static readonly defaultIntoMethodOptions: IIntoMethodOptions = {
    append: false,
  };

  public abstract get providerType(): ProviderType;

  constructor(logger: ILogger, cache: ICache, private readonly container: interfaces.Container) {
    super(logger, cache);

    if (!BaseAlaSQLQueryableProvider.alaSQLProviderInitialized[this.constructor.name]) {
      this.addFromMethods();
      this.addIntoMethods();
      BaseAlaSQLQueryableProvider.alaSQLProviderInitialized[this.constructor.name] = true;
    }
    if (!BaseAlaSQLQueryableProvider.baseAlaSQLProviderInitialized) {
      this.addFunctions();
      BaseAlaSQLQueryableProvider.baseAlaSQLProviderInitialized = true;
    }
  }

  private addFromMethods(): void {
    this.logger.debug('Adding FROM methods');
    const fromMethods = <IFromMethod[]>Reflect.getMetadata(fromMethodsSymbol, this.constructor);
    for (const method of fromMethods) {
      this.logger.trace(`Adding '${method.name}' method`);
      alasql.from[method.name] = (tableName, options, callback, index, query) => {
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
          return callback(data, index, query);
        }

        return data;
      };
    }
  }

  private addIntoMethods(): void {
    this.logger.debug('Adding INTO methods');
    const intoMethods = <IIntoMethod[]>Reflect.getMetadata(intoMethodsSymbol, this.constructor);
    for (const method of intoMethods) {
      this.logger.trace(`Adding '${method.name}' method`);
      alasql.into[method.name] = (tableName, options, data, columns, callback) => {
        const context = this.container.get<IExecutionContext>(IExecutionContextSymbol);
        if (context.provider.providerType !== this.providerType) {
          throw new InvalidIntoMethodError(method.name, context.provider.constructor.name);
        }

        const mergedOptions = {
          ...BaseAlaSQLQueryableProvider.defaultIntoMethodOptions,
          ...options,
        };
        const columnNames = columns.map((column) => column.columnid);
        method.callback.bind(context.provider)(tableName, mergedOptions, columnNames, data);
        if (callback) {
          return callback();
        }

        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined;
      };
    }
  }

  private addFunctions(): void {
    this.logger.debug('Adding custom functions');
    for (const definition of this.container
      .getAll<interfaces.Newable<IAlaSQLFunction>>(IAlaSQLFunctionDefinitionSymbol)) {
      const { name } = getBindMetadata(definition);
      if (!name) {
        throw new InvalidFunctionError(definition.name);
      }

      this.logger.trace(`Adding '${name}' function`);
      alasql.fn[name] = (...parameters) => this.container
        .getNamed<IAlaSQLFunction>(IAlaSQLFunctionSymbol, name).callback(...parameters);
    }
  }

  private prepareQuery(query: string): string {
    this.logger.trace('Preparing query');
    return query.replace(/:%GUID%/g,
      () => `"${v4({
        random: Array.from({ length: 16 }).map(() => Math.floor(Math.random() * 255)),
      })}"`);
  }

  protected runQuery<TRow>(query: string, parameters: unknown): TRow[] | undefined {
    const context = this.container.get<IExecutionContext>(IExecutionContextSymbol);

    return context.execute(this, () => {
      const result = alasql(this.prepareQuery(query), parameters);
      if (!result) {
        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined;
      }

      return result.map((row) => <TRow>row);
    });
  }

  protected runQueryAny(query: string, parameters: unknown): unknown[][] | undefined {
    const context = this.container.get<IExecutionContext>(IExecutionContextSymbol);

    return context.execute(this, () => {
      const result = alasql(this.prepareQuery(query), parameters);
      if (!result) {
        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined;
      }

      return <unknown[][]>result;
    });
  }
}
