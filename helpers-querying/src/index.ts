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

import type InternalProviderError from './errors/internal-provider-error';
import type InvalidFromMethodError from './errors/invalid-from-method-error';
import type InvalidFunctionError from './errors/invalid-function-error';
import type InvalidIntoMethodError from './errors/invalid-into-method-error';
import type InvalidQueryError from './errors/invalid-query-error';
import type MissingExecutionContextError from './errors/missing-execution-context-error';
import type NotAQueryableFileError from './errors/not-a-queryable-file-error';
import type NotASpreadsheetContextError from './errors/not-a-spreadsheet-context-error';
import type NotConfiguredFilesystemError from './errors/not-configured-filesystem-error';
import type IQueryable from './iqueryable';
import ExecutionContext from './providers/base-alasql-queryable-provider/execution-context/execution-context';
import ExchangeFunction from './providers/base-alasql-queryable-provider/functions/exchange-function';
import type IAlaSQLFunction from './providers/base-alasql-queryable-provider/functions/ialasql-function';
import MomentFunction from './providers/base-alasql-queryable-provider/functions/moment-function';
import WindowFunction from './providers/base-alasql-queryable-provider/functions/window-function/window-function';
import GoogleSpreadsheetQueryableProvider from './providers/google-spreadsheet-queryable-provider/google-spreadsheet-queryable-provider';
import type IQueryableProvider from './providers/iqueryable-provider';
import MemoryQueryableProvider from './providers/memory-queryable-provider/memory-queryable-provider';
import type ProviderType from './providers/provider-type';
import Queryable from './queryable';
import { IAlaSQLFunctionDefinitionSymbol, IQueryableSymbol } from './symbols';

function bindFunction(container: interfaces.Container,
  definition: interfaces.Newable<IAlaSQLFunction>) {
  container.bind<interfaces.Newable<IAlaSQLFunction>>(IAlaSQLFunctionDefinitionSymbol)
    .toConstructor(definition);
  bind(container, definition);
}

export default function addQuerying(container: interfaces.Container): void {
  bind(container, Queryable);
  bind(container, GoogleSpreadsheetQueryableProvider);
  bind(container, MemoryQueryableProvider);

  bind(container, ExecutionContext);
  bindFunction(container, ExchangeFunction);
  bindFunction(container, MomentFunction);
  bindFunction(container, WindowFunction);
}

export const TYPES = {
  IQueryable: IQueryableSymbol,
};

export type {
  IQueryable,
  IQueryableProvider,
};

export {
  InternalProviderError,
  InvalidFromMethodError,
  InvalidFunctionError,
  InvalidIntoMethodError,
  InvalidQueryError,
  MissingExecutionContextError,
  NotAQueryableFileError,
  NotASpreadsheetContextError,
  NotConfiguredFilesystemError,
  ProviderType,
};
