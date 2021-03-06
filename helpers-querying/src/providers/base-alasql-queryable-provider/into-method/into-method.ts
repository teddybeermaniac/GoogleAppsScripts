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
import type { FunctionDecorator } from 'helpers-utilities';

import InvalidIntoMethodError from '../../../errors/invalid-into-method-error';
import { intoMethodsSymbol } from '../../../symbols';
import type BaseAlaSQLQueryableProvider from '../base-alasql-queryable-provider';
import type IIntoMethod from './iinto-method';
import type IntoMethodCallback from './into-method-callback';

export default function intoMethod(name: string): FunctionDecorator<IntoMethodCallback,
BaseAlaSQLQueryableProvider> {
  return (target, propertyKey, descriptor) => {
    if (!descriptor.value) {
      throw new InvalidIntoMethodError(propertyKey, target.constructor.name);
    }

    const intoMethodDefinition: IIntoMethod = {
      name,
      callback: descriptor.value,
    };

    const intoMethods = <IIntoMethod[]>Reflect.getMetadata(intoMethodsSymbol, target.constructor);
    if (intoMethods) {
      intoMethods.push(intoMethodDefinition);
    } else {
      Reflect.defineMetadata(intoMethodsSymbol, [intoMethodDefinition], target.constructor);
    }
  };
}
