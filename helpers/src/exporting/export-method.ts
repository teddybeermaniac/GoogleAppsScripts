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
import { InvalidExportedMethodError } from './errors';
import type { IExportedMethod } from './iexported-method';
import { exportedMethodsSymbol } from './symbols';

// eslint-disable-next-line @typescript-eslint/ban-types
export function exportMethod<TTarget extends Object>(asIs?: boolean, name?: string):
(target: TTarget, propertyKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor: TypedPropertyDescriptor<(...parameters: any[]) => any>) => void {
  return (target: TTarget, propertyKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor: TypedPropertyDescriptor<(...parameters: any[]) => any>):
  void => {
    if (!descriptor.value) {
      throw new InvalidExportedMethodError(propertyKey, target.constructor.name);
    }

    const exportedMethod = {
      callback: descriptor.value,
      name: name ?? propertyKey,
      asIs: asIs || false,
    };

    const exportedMethods = <IExportedMethod[]>Reflect
      .getMetadata(exportedMethodsSymbol, target.constructor);
    if (exportedMethods) {
      exportedMethods.push(exportedMethod);
    } else {
      Reflect.defineMetadata(exportedMethodsSymbol, [exportedMethod], target.constructor);
    }
  };
}
