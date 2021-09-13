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

import { IExecutionContextSymbol } from '../../symbols';
import type { BaseAlaSQLQueryableProvider } from './base-alasql-queryable-provider';
import type { IExecutionContext } from './iexecution-context';

@setBindMetadata(IExecutionContextSymbol, Scope.Singleton)
export class ExecutionContext implements IExecutionContext {
  private readonly context = createContext<{
    id: string,
    data: { [key: string]: any; },
    provider: BaseAlaSQLQueryableProvider
  }>();

  public get id(): string {
    return this.context.use()!.id;
  }

  public get data(): { [key: string]: any; } {
    return this.context.use()!.data;
  }

  public get provider(): BaseAlaSQLQueryableProvider {
    return this.context.use()!.provider;
  }

  public execute<TReturn>(provider: BaseAlaSQLQueryableProvider, callback: () => TReturn): TReturn {
    return this.context.run(
      {
        id: v4({ random: Array(16).fill(null).map(() => Math.floor(Math.random() * 255)) }),
        data: {},
        provider,
      }, callback,
    );
  }
}
