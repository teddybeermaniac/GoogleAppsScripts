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
import { bind } from 'helpers-utilities';
import type { interfaces } from 'inversify';

import * as errors from './errors';
import type { IQueryable } from './iqueryable';
import { ExecutionContext } from './providers/base-alasql-queryable-provider/execution-context';
import { AlaSQLExchangeFunction } from './providers/base-alasql-queryable-provider/function/alasql-exchange-function';
import { AlaSQLMomentFunction } from './providers/base-alasql-queryable-provider/function/alasql-moment-function';
import type { IAlaSQLFunction } from './providers/base-alasql-queryable-provider/function/ialasql-function';
import { MemoryQueryableProvider } from './providers/base-alasql-queryable-provider/memory-queryable-provider/memory-queryable-provider';
import { GoogleSpreadsheetQueryableProvider } from './providers/google-spreadsheet-queryable-provider/google-spreadsheet-queryable-provider';
import type { IQueryableProvider } from './providers/iqueryable-provider';
import type { ProviderType } from './providers/provider-type';
import { Queryable } from './queryable';
import { IAlaSQLFunctionConstructorSymbol, IQueryableSymbol } from './symbols';

function bindFunction(container: interfaces.Container,
  constructor: interfaces.Newable<IAlaSQLFunction>) {
  container.bind<interfaces.Newable<IAlaSQLFunction>>(IAlaSQLFunctionConstructorSymbol)
    .toConstructor(constructor);
  bind(container, constructor);
}

export function addQuerying(container: interfaces.Container): void {
  bind(container, Queryable);
  bind(container, GoogleSpreadsheetQueryableProvider);
  bind(container, MemoryQueryableProvider);

  bind(container, ExecutionContext);
  bindFunction(container, AlaSQLExchangeFunction);
  bindFunction(container, AlaSQLMomentFunction);
}

export const TYPES = {
  IQueryable: IQueryableSymbol,
};

export type {
  IQueryable,
  IQueryableProvider,
};

export {
  errors,
  ProviderType,
};
