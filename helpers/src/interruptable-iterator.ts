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
import { injectable } from 'inversify';
import type { ICache } from './caching';
import type { ILogger } from './logging';

export interface IInterruptableIterator {
  isFinished(): boolean;
  start(): void;
  restart(): void;
}

@injectable()
export abstract class InterruptableIterator<T> implements IInterruptableIterator {
  private readonly MAXIMUM_RUNTIME = 6 * 60 * 1000;

  private readonly ITERATION_TIME_BUFFER = 1.5;

  private readonly ITERATION_FINISHED_KEY = 'iterationFinished';

  private readonly ITERATION_TOKEN_KEY = 'iterationToken';

  protected abstract doWork(iterationToken: T | null): T | null;

  private readonly initialized: number;

  private readonly iterationTimes: number[];

  private iterationStarted?: number;

  public constructor(private readonly logger: ILogger, protected readonly cache: ICache) {
    this.initialized = Date.now() + 5 * 1000;
    this.iterationTimes = [];

    this.logger.debug(`Initialized at ${this.initialized}`);
  }

  private shouldContinue(): boolean {
    if (this.iterationStarted) {
      const iterationTime = Date.now() - this.iterationStarted;
      this.iterationTimes.push(iterationTime);
      this.logger.debug(`Iteration took ${iterationTime}ms`);
    }
    this.iterationStarted = Date.now();

    if (this.iterationTimes.length > 0) {
      const averageTime = this.iterationTimes.reduce((total, current) => total + current)
          / this.iterationTimes.length;
      const leftTime = this.MAXIMUM_RUNTIME - (Date.now() - this.initialized);
      this.logger.debug(`Average iteration time ${averageTime}ms; time left ${leftTime}ms`);

      if (averageTime * this.ITERATION_TIME_BUFFER > leftTime) {
        return false;
      }
    }

    return true;
  }

  public isFinished(): boolean {
    return this.cache.get<boolean>(this.ITERATION_FINISHED_KEY, false);
  }

  public start(): void {
    this.logger.information('Starting iteration');

    if (this.isFinished()) {
      this.logger.information('Iteration already finished; use restart() to start over');

      return;
    }

    let iterationToken = this.cache.get<T | null>(this.ITERATION_TOKEN_KEY, null);
    do {
      if (!this.shouldContinue()) {
        this.logger.information('Not enough time left; exiting');

        break;
      }

      this.logger.debug('Doing next iteration');
      iterationToken = this.doWork(iterationToken);

      if (iterationToken === null) {
        this.cache.set(this.ITERATION_FINISHED_KEY, true);
        this.cache.del(this.ITERATION_TOKEN_KEY);
      } else {
        this.cache.set(this.ITERATION_TOKEN_KEY, iterationToken);
      }
    } while (iterationToken !== null);
  }

  public restart(): void {
    this.logger.information('Restarting iteration');

    // ! Implement triggers.
    this.cache.delAll();
  }
}
