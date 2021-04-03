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
import { injectable, interfaces, unmanaged } from 'inversify';
import type { ILogger } from '../logging';
import type { IExportedMethod } from './iexported-method';
import type { IExportedMethodProvider } from './iexported-method-provider';
import { exportedMethodContainerSymbolSymbol, exportedMethodsSymbol } from './symbols';

@injectable()
export class InternalExportedMethodProvider implements IExportedMethodProvider {
  private readonly exportedMethods: (IExportedMethod & { symbol: symbol })[] = [];

  constructor(@unmanaged() private readonly container: interfaces.Container,
    @unmanaged() private readonly logger: ILogger | undefined) { }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected prepare(constructors: interfaces.Newable<Object>[]): void {
    this.logger?.initialize(InternalExportedMethodProvider.name);
    this.logger?.trace(`Found ${constructors.length} exported method containers`);
    constructors.forEach((constructor) => {
      this.logger?.trace(`Processing '${constructor.name}'`);
      const methods = <IExportedMethod[]>Reflect.getMetadata(exportedMethodsSymbol, constructor);

      this.logger?.trace(
        `Found ${methods.length} exported methods on container '${constructor.name}'`,
      );

      const symbol = <symbol>Reflect
        .getMetadata(exportedMethodContainerSymbolSymbol, constructor);
      methods.forEach((method) => {
        this.exportedMethods.push({ ...method, symbol });

        this.logger?.trace(
          `Method '${method.name}' from '${constructor.name}' is exported as '${method.exportedName}'`,
        );
      });
    });
  }

  public getExportedMethods(): IExportedMethod[] {
    return [...this.exportedMethods];
  }

  public callExportedMethod(exportedName: string): void {
    this.logger?.trace(`Calling exported method '${exportedName}'`);

    const exportedMethod = this.exportedMethods
      .filter((method) => method.exportedName === exportedName)[0];
    if (!exportedMethod) {
      throw new Error(`Method '${exportedName}' was not exported`);
    }

    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const instance: any = this.container.get(exportedMethod.symbol);
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    instance[exportedMethod.name]();
  }
}
