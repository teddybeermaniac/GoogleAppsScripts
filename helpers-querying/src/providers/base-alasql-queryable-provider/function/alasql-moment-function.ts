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
import { bindSymbol } from 'helpers-utilities';
import { inject, injectable } from 'inversify';
import moment from 'moment';

import { IAlaSQLFunctionSymbol } from '../../../symbols';
import type { IAlaSQLFunction } from './ialasql-function';

@injectable()
@bindSymbol(IAlaSQLFunctionSymbol)
export class AlaSQLMomentFunction implements IAlaSQLFunction {
  public get name(): string {
    return 'MOMENT';
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger) { }

  public callback(input?: moment.MomentInput): moment.Moment {
    this.logger.trace(`Running MOMENT function${input?.toString() !== undefined ? ` with '${input?.toString()}' input` : ' without input'}`);
    return moment(input);
  }
}