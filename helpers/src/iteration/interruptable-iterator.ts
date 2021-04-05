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
import type { ICache } from '../caching';
import { exportMethod } from '../exporting';
import type { ILogger } from '../logging';
import type { IInterruptableIterator } from './iinterruptable-iterator';
import type { ITriggerManager } from '../triggering';

@injectable()
export abstract class InterruptableIterator<T> implements IInterruptableIterator<T> {
  private static readonly TRIGGER_MINUTES = 1;

  private static readonly MAXIMUM_RUNTIME_SECONDS = 6 * 60;

  private static readonly ITERATION_TIME_SAFETY_BUFFER = 1.5;

  private static readonly RUNNING_KEY = 'running';

  private static readonly ITERATION_TOKEN_KEY = 'iterationToken';

  private static readonly ITERATION_INITIAL_TOKEN_KEY = 'iterationInitialToken';

  private readonly started: number = Date.now();

  private runTime = 0;

  private iterations = 0;

  private iterationStarted?: number;

  public constructor(protected readonly logger: ILogger, protected readonly cache: ICache,
    private readonly triggerManager: ITriggerManager) { }

  protected abstract next(iterationToken: T | null): T | null;

  private shouldContinue(): boolean {
    const { iterationStarted } = this;
    this.iterationStarted = Date.now();
    if (iterationStarted) {
      const iterationTime = Date.now() - iterationStarted;

      this.runTime += iterationTime;
      this.iterations += 1;
      this.logger.debug(`Iteration took ${iterationTime}ms`);
    }

    if (this.iterations > 0) {
      const averageTime = this.runTime / this.iterations;
      const leftTime = InterruptableIterator.MAXIMUM_RUNTIME_SECONDS * 1000
        - (Date.now() - this.started);
      this.logger.debug(`Average iteration time ${averageTime}ms; time left ${leftTime}ms`);

      if (averageTime * InterruptableIterator.ITERATION_TIME_SAFETY_BUFFER > leftTime) {
        return false;
      }
    }

    return true;
  }

  @exportMethod()
  public continue(): void {
    if (this.isRunning()) {
      this.logger.information('Iteration currently running; exiting');
      return;
    }

    if (this.isFinished()) {
      this.logger.information('Iteration already ended; exiting');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.triggerManager.remove(this.continue);

      return;
    }

    this.logger.information('Continuing iteration');
    this.cache.set(InterruptableIterator.RUNNING_KEY, true,
      InterruptableIterator.MAXIMUM_RUNTIME_SECONDS);
    let iterationToken = this.cache.get<T>(InterruptableIterator.ITERATION_TOKEN_KEY);
    if (iterationToken === null) {
      this.cache.get<T>(InterruptableIterator.ITERATION_INITIAL_TOKEN_KEY);
      this.cache.del(InterruptableIterator.ITERATION_INITIAL_TOKEN_KEY);
    }

    while (iterationToken !== null) {
      if (!this.shouldContinue()) {
        this.logger.information('Not enough time left; exiting');

        break;
      }

      this.logger.debug('Next step');
      iterationToken = this.next(iterationToken);

      this.cache.set(InterruptableIterator.ITERATION_TOKEN_KEY, iterationToken);
    }

    this.cache.set(InterruptableIterator.RUNNING_KEY, false);
    if (iterationToken === null) {
      this.logger.information('Iteration ended; exiting');
      this.cache.clear();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.triggerManager.remove(this.continue);
    }
  }

  public tryStart(iterationToken?: T): boolean {
    if (this.isRunning()) {
      this.logger.information('Iteration currently running');
      return false;
    }

    this.logger.information('Starting iteration; registering trigger');
    this.cache.clear();
    if (iterationToken !== undefined) {
      this.cache.set(InterruptableIterator.ITERATION_TOKEN_KEY, iterationToken,
        InterruptableIterator.TRIGGER_MINUTES * 60 * 2);
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.triggerManager.addEveryMinutes(this.continue, InterruptableIterator.TRIGGER_MINUTES);

    return true;
  }

  public start(iterationToken?: T): void {
    if (!this.tryStart(iterationToken)) {
      throw new Error('Iteration currently running');
    }
  }

  public isRunning(): boolean {
    return this.cache.get<boolean>(InterruptableIterator.RUNNING_KEY, false);
  }

  public isFinished(): boolean {
    return !this.isRunning()
      && this.cache.get<T>(InterruptableIterator.ITERATION_INITIAL_TOKEN_KEY) === null
      && this.cache.get<T>(InterruptableIterator.ITERATION_TOKEN_KEY) === null;
  }
}
