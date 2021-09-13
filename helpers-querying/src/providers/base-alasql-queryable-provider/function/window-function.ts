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
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import alasql from 'alasql';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { JSONEx, Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import { IAlaSQLFunctionSymbol, IExecutionContextSymbol } from '../../../symbols';
import type { IExecutionContext } from '../iexecution-context';
import type { IAlaSQLFunction } from './ialasql-function';

@setBindMetadata(IAlaSQLFunctionSymbol, Scope.Transient, 'WINDOW')
export class WindowFunction implements IAlaSQLFunction {
  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(IExecutionContextSymbol) private readonly context: IExecutionContext) { }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  callback(id: string, query: string, partition: string, value: any, parameters: any):
  any {
    this.logger.trace(() => `Running in context '${this.context.id}' with id '${id}', query '${query}', partition '${partition}', value '${JSONEx.stringify(value)}' and parameters '${JSONEx.stringify(parameters)}'`);
    if (!this.context.data[`WINDOW_${id}`]) {
      this.context.data[`WINDOW_${id}`] = {};
    }
    const data = <{ [partition: string]: { Number: number, Value: any; }[]; }>
      this.context.data[`WINDOW_${id}`];

    if (!data[partition]) {
      data[partition] = [];
    }
    const partitionData = data[partition]!;

    const result = alasql(query,
      { ...parameters, PastValues: partitionData, CurrentValue: value });

    partitionData.push({ Number: partitionData.length + 1, Value: result });

    return result;
  }
}
