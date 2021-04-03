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
import * as caching from '../caching';
import * as exporting from '../exporting';
import * as logging from '../logging';
import type { IInterruptableIterator } from './iinterruptable-iterator';

@injectable()
export abstract class InterruptableIterator<T> implements IInterruptableIterator {
  private static readonly MAXIMUM_RUNTIME = 6 * 60 * 1000;

  private static readonly ITERATION_TIME_SAFETY_BUFFER = 1.5;

  private static readonly ITERATION_FINISHED_KEY = 'iterationFinished';

  private static readonly ITERATION_TOKEN_KEY = 'iterationToken';

  private readonly started: number = Date.now();

  private iterationsTime = 0;

  private iterations = 0;

  private iterationStarted?: number;

  public constructor(protected readonly logger: logging.ILogger,
    protected readonly cache: caching.ICache) {
  }

  protected abstract next(iterationToken: T | null): T | null;

  private shouldContinue(): boolean {
    const { iterationStarted } = this;
    this.iterationStarted = Date.now();
    if (iterationStarted) {
      const iterationTime = Date.now() - iterationStarted;

      this.iterationsTime += iterationTime;
      this.iterations += 1;
      this.logger.debug(`Iteration took ${iterationTime}ms`);
    }

    if (this.iterations > 0) {
      const averageTime = this.iterationsTime / this.iterations;
      const leftTime = InterruptableIterator.MAXIMUM_RUNTIME - (Date.now() - this.started);
      this.logger.debug(`Average iteration time ${averageTime}ms; time left ${leftTime}ms`);

      if (averageTime * InterruptableIterator.ITERATION_TIME_SAFETY_BUFFER > leftTime) {
        return false;
      }
    }

    return true;
  }

  @exporting.exportMethod()
  public continue(): void {
    this.logger.information('Continuing iteration');

    if (this.isFinished()) {
      this.logger.information('Nothing to do; exiting');
      return;
    }

    let iterationToken = this.cache.get<T>(InterruptableIterator.ITERATION_TOKEN_KEY);
    do {
      if (!this.shouldContinue()) {
        this.logger.information('Not enough time left; exiting');

        break;
      }

      this.logger.debug('Next step');
      iterationToken = this.next(iterationToken);

      if (iterationToken === null) {
        this.cache.set(InterruptableIterator.ITERATION_FINISHED_KEY, true);
        this.cache.del(InterruptableIterator.ITERATION_TOKEN_KEY);
      } else {
        this.cache.set(InterruptableIterator.ITERATION_TOKEN_KEY, iterationToken);
      }
    } while (iterationToken !== null);
  }

  public start(): void {
    this.logger.information('Starting iteration');

    // ! Implement triggers.
    this.cache.clear();
    this.cache.set(InterruptableIterator.ITERATION_FINISHED_KEY, false);
  }

  public isFinished(): boolean {
    const finished = this.cache.get<boolean>(InterruptableIterator.ITERATION_FINISHED_KEY);

    return finished === null ? true : finished;
  }
}
