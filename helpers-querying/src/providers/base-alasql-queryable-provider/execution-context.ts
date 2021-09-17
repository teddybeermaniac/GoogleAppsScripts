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
import createContext from 'context';
import { Scope, setBindMetadata } from 'helpers-utilities';
import { v4 } from 'uuid';

import MissingExecutionContextError from '../../errors/missing-execution-context-error';
import { IExecutionContextSymbol } from '../../symbols';
import type BaseAlaSQLQueryableProvider from './base-alasql-queryable-provider';
import type IExecutionContext from './iexecution-context';
import type IExecutionContextData from './iexecution-context-data';

@setBindMetadata(IExecutionContextSymbol, Scope.Singleton)
export default class ExecutionContext implements IExecutionContext {
  private readonly context = createContext<IExecutionContextData>();

  private get executionContextData(): IExecutionContextData {
    const executionContextData = this.context.use();
    if (!executionContextData) {
      throw new MissingExecutionContextError();
    }

    return executionContextData;
  }

  public get id(): string {
    return this.executionContextData.id;
  }

  public get data(): Record<string, unknown> {
    return this.executionContextData.data;
  }

  public get provider(): BaseAlaSQLQueryableProvider {
    return this.executionContextData.provider;
  }

  public execute<TReturn>(provider: BaseAlaSQLQueryableProvider, callback: () => TReturn): TReturn {
    return this.context.run(
      {
        id: v4({ random: Array.from({ length: 16 }).map(() => Math.floor(Math.random() * 255)) }),
        data: {},
        provider,
      }, callback,
    );
  }
}
