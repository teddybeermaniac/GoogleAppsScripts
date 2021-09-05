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
import { inject, injectable } from 'inversify';

import { IExchange, TYPES as EXCHANGE_TYPES } from '../../../../exchange';
import { ILogger, TYPES as LOGGING_TYPES } from '../../../../logging';
import { bindSymbol } from '../../../../utilities';
import { IAlaSQLFunctionSymbol } from '../../../symbols';
import type { IAlaSQLFunction } from './ialasql-function';

@injectable()
@bindSymbol(IAlaSQLFunctionSymbol)
export class AlaSQLExchangeFunction implements IAlaSQLFunction {
  public get name(): string {
    return 'EXCHANGE';
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(EXCHANGE_TYPES.IExchange) private readonly exchange: IExchange) { }

  callback(value: number, from: string, to: string): number {
    this.logger.trace(`Running EXCHANGE function with value '${value}', from currency '${from}' and to currency '${to}'`);
    return this.exchange.convert(value, from, to);
  }
}