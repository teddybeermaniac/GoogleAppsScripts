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
import alasql from 'alasql';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { JSONEx, Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import InvalidParameterError from '../../../../errors/invalid-parameter-error';
import { IAlaSQLFunctionSymbol, IExecutionContextSymbol } from '../../../../symbols';
import type Parameters from '../../../parameters';
import { ParametersRuntype } from '../../../parameters';
import type IExecutionContext from '../../execution-context/iexecution-context';
import type IAlaSQLFunction from '../ialasql-function';
import type WindowFunctionItem from './window-function-item';

@setBindMetadata(IAlaSQLFunctionSymbol, Scope.Transient, 'WINDOW')
export default class WindowFunction implements IAlaSQLFunction {
  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(IExecutionContextSymbol) private readonly context: IExecutionContext) {}

  callback(id: string, query: string, partition: string, value: unknown, parameters?: Parameters):
  unknown {
    this.logger.trace(() => `Running in context '${this.context.id}' with id '${id}', query '${query}', partition '${partition}', value '${JSONEx.stringify(value)}' and parameters '${JSONEx.stringify(parameters)}'`);
    if (!id || typeof id !== 'string') {
      throw new InvalidParameterError('WINDOW', 'id', id);
    }
    if (!query || typeof query !== 'string') {
      throw new InvalidParameterError('WINDOW', 'query', query);
    }
    if (!partition || typeof partition !== 'string') {
      throw new InvalidParameterError('WINDOW', 'partition', partition);
    }
    if (parameters && !ParametersRuntype.guard(parameters)) {
      throw new InvalidParameterError('WINDOW', 'parameters', parameters);
    }

    if (!this.context.data[`WINDOW_${id}`]) {
      this.context.data[`WINDOW_${id}`] = {};
    }
    const data = <Record<string, WindowFunctionItem[]>> this.context.data[`WINDOW_${id}`];

    let partitionData = data[partition];
    if (!partitionData) {
      partitionData = [];
      data[partition] = partitionData;
    }

    const result: unknown = alasql(query,
      { ...parameters, PastValues: partitionData, CurrentValue: value });

    partitionData.push({ Number: partitionData.length + 1, Value: result });

    return result;
  }
}
