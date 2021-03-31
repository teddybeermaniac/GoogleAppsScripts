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
import { injectable, interfaces, multiInject } from 'inversify';
import type { IExportedMethod } from './iexported-method';
import type { IExportedMethodProvider } from './iexported-method-provider';
import { exportedMethodsSymbol, exportedMethodContainerSymbol, exportedMethodContainerSymbolSymbol } from './symbols';

@injectable()
export class ExportedMethodProvider implements IExportedMethodProvider {
  private readonly symbols: symbol[];

  private readonly exportedMethods: { [key: string]: string[]; };

  private readonly methodExportedNames: { [key: string]: { [key: string]: string; }; };

  constructor(@multiInject(exportedMethodContainerSymbol)
    // eslint-disable-next-line @typescript-eslint/ban-types
    containers: interfaces.Newable<Object>[]) {
    this.symbols = [];
    this.exportedMethods = {};
    this.methodExportedNames = {};

    containers.forEach((container) => {
      const symbol = <symbol>Reflect
        .getMetadata(exportedMethodContainerSymbolSymbol, container);
      const symbolKey = Symbol.keyFor(symbol);
      if (!symbolKey) {
        throw new Error(`Symbol '${symbol.toString()}' is not global`);
      }

      this.symbols.push(symbol);
      this.exportedMethods[symbolKey] = [];
      this.methodExportedNames[symbolKey] = {};
      (<IExportedMethod[]>Reflect.getMetadata(exportedMethodsSymbol, container))
        .forEach((method) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.exportedMethods[symbolKey]!.push(method.name);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.methodExportedNames[symbolKey]![method.name] = method.asIs
            ? method.name
            : `zzz_${symbolKey}_${method.name}`;
        });
    });
  }

  public getSymbols(): symbol[] {
    return [...this.symbols];
  }

  public getExportedMethods(symbol: symbol): string[] {
    const symbolKey = Symbol.keyFor(symbol);
    if (!symbolKey) {
      throw new Error(`Symbol '${symbol.toString()}' is not global`);
    }
    if (!this.exportedMethods[symbolKey]) {
      throw new Error(`Container '${symbol.toString()}' does not export any methods`);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return [...this.exportedMethods[symbolKey]!];
  }

  public getMethodExportedName(symbol: symbol, name: string): string {
    const symbolKey = Symbol.keyFor(symbol);
    if (!symbolKey) {
      throw new Error(`Symbol '${symbol.toString()}' is not global`);
    }
    if (!this.methodExportedNames[symbolKey]) {
      throw new Error(`Container '${symbol.toString()}' does not export any methods`);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!this.methodExportedNames[symbolKey]![name]) {
      throw new Error(`Container '${symbol.toString()}' does not export method '${name}'`);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.methodExportedNames[symbolKey]![name]!;
  }
}
