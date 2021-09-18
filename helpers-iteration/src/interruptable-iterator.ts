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
import type { ICache } from 'helpers-caching';
import { exportMethod } from 'helpers-exporting';
import type { ILogger } from 'helpers-logging';
import type { ITriggerManager } from 'helpers-triggering';
import { injectable } from 'inversify';

import AlreadyRunningIterationError from './errors/already-running-iteration-error';
import type IInterruptableIterator from './iinterruptable-iterator';

@injectable()
export default abstract class InterruptableIterator<TToken = string>
implements IInterruptableIterator<TToken> {
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

  constructor(protected readonly logger: ILogger, protected readonly cache: ICache,
    private readonly triggerManager: ITriggerManager) {}

  protected abstract next(iterationToken?: TToken): TToken | undefined;

  private shouldContinue(): boolean {
    const iterationStartedPrevious = this.iterationStarted;
    this.iterationStarted = Date.now();
    if (iterationStartedPrevious) {
      const iterationTime = Date.now() - iterationStartedPrevious;

      this.runTime += iterationTime;
      this.iterations += 1;
      this.logger.trace(`Iteration took ${iterationTime}ms`);
    }

    if (this.iterations > 0) {
      const averageTime = this.runTime / this.iterations;
      const leftTime = InterruptableIterator.MAXIMUM_RUNTIME_SECONDS * 1000
        - (Date.now() - this.started);
      this.logger.trace(`Average iteration time ${averageTime}ms; time left ${leftTime}ms`);

      if (averageTime * InterruptableIterator.ITERATION_TIME_SAFETY_BUFFER > leftTime) {
        return false;
      }
    }

    return true;
  }

  @exportMethod()
  public continue(): void {
    this.logger.information('Restarting iteration');
    if (this.isRunning()) {
      this.logger.information('Iteration currently running; exiting');
      return;
    }

    if (this.isFinished()) {
      this.logger.information('Iteration already finished; exiting');
      this.triggerManager.remove(this.continue.name);

      return;
    }

    this.logger.debug('Continuing iteration');
    this.cache.set(InterruptableIterator.RUNNING_KEY, true,
      InterruptableIterator.MAXIMUM_RUNTIME_SECONDS);
    let iterationToken = this.cache.get<TToken>(InterruptableIterator.ITERATION_TOKEN_KEY);
    if (iterationToken === undefined) {
      iterationToken = this.cache.pop<TToken>(InterruptableIterator.ITERATION_INITIAL_TOKEN_KEY);
    }

    while (iterationToken !== undefined) {
      if (!this.shouldContinue()) {
        this.logger.information('Not enough time left; exiting');

        break;
      }

      this.logger.debug('Next step');
      iterationToken = this.next(iterationToken);

      this.cache.set(InterruptableIterator.ITERATION_TOKEN_KEY, iterationToken);
    }

    this.cache.set(InterruptableIterator.RUNNING_KEY, false);
    if (iterationToken === undefined) {
      this.logger.information('Iteration finished; exiting');
      this.cache.clear();
      this.triggerManager.remove(this.continue.name);
    }
  }

  public tryStart(iterationToken?: TToken): boolean {
    this.logger.information('Starting iteration');
    if (this.isRunning()) {
      this.logger.information('Iteration currently running');
      return false;
    }

    this.logger.debug('Starting iteration; registering trigger');
    this.cache.clear();
    if (iterationToken !== undefined) {
      this.cache.set(InterruptableIterator.ITERATION_TOKEN_KEY, iterationToken,
        InterruptableIterator.TRIGGER_MINUTES * 60 * 2);
    }

    this.triggerManager.addEveryMinutes(this.continue.name, InterruptableIterator.TRIGGER_MINUTES);

    return true;
  }

  public start(iterationToken?: TToken): void {
    if (!this.tryStart(iterationToken)) {
      throw new AlreadyRunningIterationError();
    }
  }

  public isRunning(): boolean {
    this.logger.trace('Checking if iteration is running');
    return this.cache.get<boolean>(InterruptableIterator.RUNNING_KEY, false);
  }

  public isFinished(): boolean {
    this.logger.trace('Checking if iteration was finished');
    return !this.isRunning()
      && this.cache.get<TToken>(InterruptableIterator.ITERATION_INITIAL_TOKEN_KEY) === undefined
      && this.cache.get<TToken>(InterruptableIterator.ITERATION_TOKEN_KEY) === undefined;
  }
}
