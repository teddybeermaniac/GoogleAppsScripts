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
import { Cache, ICache } from './cache';
import type { ILogger } from './logging/logger';
import type { ILoggerFactory } from './logging/logger-factory';

export interface IInterruptableIterator {
  start(): void;
  restart(): void;
}

export abstract class InterruptableIterator<T> implements IInterruptableIterator {
  private readonly ITERATION_FINISHED_KEY = 'iterationFinished';

  private readonly ITERATION_TOKEN_KEY = 'iterationToken';

  protected abstract doWork(iterationToken: T | null): T | null;

  protected readonly cache: ICache;

  protected readonly logger: ILogger;

  private readonly initialized: number;

  public constructor(loggerFactory: ILoggerFactory, name: string) {
    this.cache = new Cache(loggerFactory, name);
    this.logger = loggerFactory.getLogger(name);
    this.initialized = Date.now();

    this.logger.debug(`Initialized at ${this.initialized}`);
  }

  public start(): void {
    const iterationFinished = this.cache.get<boolean>(this.ITERATION_FINISHED_KEY, false);
    if (iterationFinished) {
      this.logger.information('Iteration already finished; use restart() to start over');

      return;
    }

    let iterationToken = this.cache.get<T | null>(this.ITERATION_TOKEN_KEY, null);
    do {
      iterationToken = this.doWork(iterationToken);
      // ! Implement timeout support.

      if (iterationToken === null) {
        this.cache.set(this.ITERATION_FINISHED_KEY, true);
        this.cache.del(this.ITERATION_TOKEN_KEY);
      } else {
        this.cache.set(this.ITERATION_TOKEN_KEY, iterationToken);
      }
    } while (iterationToken !== null);
  }

  public restart(): void {
    // ! Implement.
    this.cache.delAll();
  }
}
