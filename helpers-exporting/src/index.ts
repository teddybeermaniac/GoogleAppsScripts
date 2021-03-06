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
import { bind, BuilderCallback } from 'helpers-utilities';
import type { interfaces } from 'inversify';

import ExportingError from './errors/exporting-error';
import InvalidExportedMethodError from './errors/invalid-exported-method-error';
import NoMethodsExportedError from './errors/no-methods-exported-error';
import NotExportedMethodError from './errors/not-exported-method-error';
import exportMethod from './export-method';
import ExportedMethodProvider from './exported-method-provider';
import ExportingBuilder from './exporting-builder';
import type IExportedMethodProvider from './iexported-method-provider';
import { IExportedMethodProviderSymbol } from './symbols';

export default function addExporting(container: interfaces.Container,
  build: BuilderCallback<ExportingBuilder>): void {
  const builder = new ExportingBuilder(container);
  build(builder);

  bind(container, ExportedMethodProvider);
}

export const TYPES = {
  IExportedMethodProvider: IExportedMethodProviderSymbol,
};

export type {
  IExportedMethodProvider,
};

export {
  ExportingError,
  exportMethod,
  InvalidExportedMethodError,
  NoMethodsExportedError,
  NotExportedMethodError,
};
