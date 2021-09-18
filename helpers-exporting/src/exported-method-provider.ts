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
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import {
  getBindMetadata, Scope, setBindMetadata, TYPES as UTILITIES_TYPES,
} from 'helpers-utilities';
import {
  inject, interfaces, multiInject, optional,
} from 'inversify';

import NoMethodsExportedError from './errors/no-methods-exported-error';
import NotExportedMethodError from './errors/not-exported-method-error';
import type IExportedMethod from './iexported-method';
import type IExportedMethodItem from './iexported-method-item';
import type IExportedMethodProvider from './iexported-method-provider';
import { exportedMethodContainerSymbol, exportedMethodsSymbol, IExportedMethodProviderSymbol } from './symbols';

@setBindMetadata(IExportedMethodProviderSymbol, Scope.Singleton)
export default class ExportedMethodProvider implements IExportedMethodProvider {
  private readonly exportedMethods: IExportedMethodItem[] = [];

  constructor(@inject(UTILITIES_TYPES.Container) private readonly container: interfaces.Container,
    @multiInject(exportedMethodContainerSymbol) targets: interfaces.Newable<unknown>[],
    @inject(LOGGING_TYPES.ILogger) @optional() private readonly logger?: ILogger) {
    this.prepare(targets);
  }

  private logDebug(message: string): void {
    if (!this.logger) {
      // eslint-disable-next-line no-console
      console.log(message);
      return;
    }

    this.logger.debug(message);
  }

  private logTrace(message: string): void {
    if (!this.logger) {
      // eslint-disable-next-line no-console
      console.log(message);
      return;
    }

    this.logger.trace(message);
  }

  protected prepare(targets: interfaces.Newable<unknown>[]): void {
    this.logTrace(`Found ${targets.length} exported method containers`);
    for (const target of targets) {
      this.logTrace(`Processing '${target.name}'`);
      const methods = <IExportedMethod[]>Reflect.getMetadata(exportedMethodsSymbol, target);
      if (!methods) {
        throw new NoMethodsExportedError(target.name);
      }

      this.logTrace(
        `Found ${methods.length} exported methods on container '${target.name}'`,
      );

      for (const method of methods) {
        const metadata = getBindMetadata(target);
        const exportedName = method.asIs ? method.name : `zzz_${target.name}_${method.name}`;
        this.exportedMethods.push({ ...method, exportedName, symbol: metadata.symbol });

        this.logDebug(
          `Method '${method.name}' from '${target.name}' is exported as '${exportedName}'`,
        );
      }
    }
  }

  public getExportedMethods(): string[] {
    return this.exportedMethods.map((method) => method.exportedName);
  }

  public getExportedMethodName(symbol: symbol, name: string): string {
    const exportedMethod = this.exportedMethods
      .find((method) => method.symbol === symbol && method.name === name);
    if (!exportedMethod) {
      throw new NotExportedMethodError(name, symbol.description);
    }

    return exportedMethod.exportedName;
  }

  public callExportedMethod(exportedName: string, parameters: unknown[]): unknown {
    this.logDebug(`Calling exported method '${exportedName}'`);
    const exportedMethod = this.exportedMethods
      .find((method) => method.exportedName === exportedName);
    if (!exportedMethod) {
      throw new NotExportedMethodError(exportedName);
    }

    const instance = this.container.get(exportedMethod.symbol);

    return exportedMethod.callback.bind(instance)(...parameters);
  }
}
