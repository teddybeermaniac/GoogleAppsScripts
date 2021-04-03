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
import {
  inject, injectable, interfaces, multiInject,
} from 'inversify';
import { ContainerSymbol } from '../symbols';
import { InternalExportedMethodProvider } from './internal-exported-method-provider';
import { exportedMethodContainerSymbol } from './symbols';

@injectable()
export class RollupExportedMethodProvider extends InternalExportedMethodProvider {
  constructor(@inject(ContainerSymbol) container: interfaces.Container,
    // eslint-disable-next-line @typescript-eslint/ban-types
    @multiInject(exportedMethodContainerSymbol) constructors: interfaces.Newable<Object>[]) {
    super(container, undefined);
    this.prepare(constructors);
  }
}