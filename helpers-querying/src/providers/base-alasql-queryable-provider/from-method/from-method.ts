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
import { InvalidFromMethodError } from '../../../errors';
import { fromMethodsSymbol } from '../../../symbols';
import type { BaseAlaSQLQueryableProvider } from '../base-alasql-queryable-provider';
import type { IFromMethod } from './ifrom-method';
import type { IFromMethodOptions } from './ifrom-method-options';

export function fromMethod<TTarget extends BaseAlaSQLQueryableProvider>(name: string):
// eslint-disable-next-line max-len
(target: TTarget, propertyKey: string, descriptor: TypedPropertyDescriptor<(tableName: string, options?: IFromMethodOptions) => any[]>) => void {
  return (target, propertyKey, descriptor) => {
    if (!descriptor.value) {
      throw new InvalidFromMethodError(propertyKey, target.constructor.name);
    }

    const fromMethodDefinition: IFromMethod = {
      name,
      callback: descriptor.value,
    };

    const fromMethods = <IFromMethod[]>Reflect.getMetadata(fromMethodsSymbol, target.constructor);
    if (fromMethods) {
      fromMethods.push(fromMethodDefinition);
    } else {
      Reflect.defineMetadata(fromMethodsSymbol, [fromMethodDefinition], target.constructor);
    }
  };
}
