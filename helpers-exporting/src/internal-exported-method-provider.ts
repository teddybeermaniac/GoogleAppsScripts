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
/* eslint-disable no-console */
import type { ILogger } from 'helpers-logging';
import { getBindMetadata } from 'helpers-utilities';
import { injectable, interfaces } from 'inversify';

import { NotExportedMethodError } from './errors';
import type { IExportedMethod } from './iexported-method';
import type { IExportedMethodProvider } from './iexported-method-provider';
import { exportedMethodsSymbol } from './symbols';

@injectable()
export class InternalExportedMethodProvider implements IExportedMethodProvider {
  private readonly exportedMethods:
  (IExportedMethod & { exportedName: string, symbol: symbol })[] = [];

  constructor(private readonly container: interfaces.Container,
    private readonly logger: ILogger | undefined) { }

  private logDebug(message: string): void {
    if (!this.logger) {
      console.log(message);
      return;
    }

    this.logger.debug(message);
  }

  private logTrace(message: string): void {
    if (!this.logger) {
      console.log(message);
      return;
    }

    this.logger.trace(message);
  }

  protected prepare(constructors: interfaces.Newable<Object>[]): void {
    this.logTrace(`Found ${constructors.length} exported method containers`);
    constructors.forEach((constructor) => {
      this.logTrace(`Processing '${constructor.name}'`);
      const methods = <IExportedMethod[]>Reflect.getMetadata(exportedMethodsSymbol, constructor);

      this.logTrace(
        `Found ${methods.length} exported methods on container '${constructor.name}'`,
      );

      methods.forEach((method) => {
        const metadata = getBindMetadata(constructor);
        const exportedName = method.asIs ? method.name : `zzz_${constructor.name}_${method.name}`;
        this.exportedMethods.push({ ...method, exportedName, symbol: metadata.symbol });

        this.logDebug(
          `Method '${method.name}' from '${constructor.name}' is exported as '${exportedName}'`,
        );
      });
    });
  }

  public getExportedMethods(): string[] {
    return this.exportedMethods.map((method) => method.exportedName);
  }

  public getExportedMethodName(symbol: symbol, name: string): string {
    const exportedMethod = this.exportedMethods
      .filter((method) => method.symbol === symbol && method.name === name)[0];
    if (exportedMethod === undefined) {
      throw new NotExportedMethodError(name, symbol.description);
    }

    return exportedMethod.exportedName;
  }

  public callExportedMethod(exportedName: string, args: any[]): any {
    this.logDebug(`Calling exported method '${exportedName}'`);

    const exportedMethod = this.exportedMethods
      .filter((method) => method.exportedName === exportedName)[0];
    if (exportedMethod === undefined) {
      throw new NotExportedMethodError(exportedName);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const instance: any = this.container.get(exportedMethod.symbol);

    return exportedMethod.callback.bind(instance)(...args);
  }
}
