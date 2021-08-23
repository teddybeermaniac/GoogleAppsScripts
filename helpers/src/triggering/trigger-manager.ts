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
import { inject, injectable, interfaces } from 'inversify';

import { IExportedMethodProvider, TYPES as EXPORTING_TYPES } from '../exporting';
import { ILogger, TYPES as LOGGING_TYPES } from '../logging';
import {
  bindSymbol, errors as utilities_errors, getOwnerType, getSymbol,
} from '../utilities';
import { AlreadyExistsTriggerError, TriggeringError } from './errors';
import type { ITriggerManager } from './itrigger-manager';
import { ITriggerManagerSymbol } from './symbols';

@injectable()
@bindSymbol(ITriggerManagerSymbol)
export class TriggerManger implements ITriggerManager {
  private static readonly ALLOWED_MINUTES = [1, 5, 10, 15, 30];

  private _symbol: symbol | undefined;

  private initialized = false;

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(EXPORTING_TYPES.IExportedMethodProvider)
    private readonly exportedMethodProvider: IExportedMethodProvider) { }

  private get symbol(): symbol {
    if (!this.initialized || this._symbol === undefined) {
      throw new utilities_errors.InitializationError('Not initialized');
    }

    return this._symbol;
  }

  private getExistingTrigger(method: () => void): GoogleAppsScript.Script.Trigger | null {
    const exportedName = this.exportedMethodProvider
      .getExportedMethodName(this.symbol, method.name);
    const existingTrigger = ScriptApp.getProjectTriggers()
      .filter((trigger) => trigger.getHandlerFunction() === exportedName)[0];

    return existingTrigger ?? null;
  }

  private build(method: () => void,
    builder: (trigger: GoogleAppsScript.Script.ClockTriggerBuilder) => void,
    replace: boolean | undefined): void {
    if (this.exists(method)) {
      if (replace) {
        this.logger.debug(`Trigger for method '${method.name}'${this.symbol.description
          ? ` from '${this.symbol.description}'`
          : ''} already exists; replacing`);
        this.remove(method);
      }

      throw new AlreadyExistsTriggerError(method.name, this.symbol.description);
    }

    const exportedName = this.exportedMethodProvider
      .getExportedMethodName(this.symbol, method.name);
    const triggerBuilder = ScriptApp.newTrigger(exportedName)
      .timeBased();

    builder(triggerBuilder);
    triggerBuilder.create();
  }

  public initialize(context: interfaces.Context): void {
    if (this.initialized) {
      throw new utilities_errors.InitializationError('Already initialized');
    }

    const owner = getOwnerType(context, TriggerManger);
    this._symbol = getSymbol(owner);
    this.initialized = true;
  }

  public addEveryMinutes(method: () => void, minutes: number, replace?: boolean): void {
    if (!TriggerManger.ALLOWED_MINUTES.includes(minutes)) {
      throw new TriggeringError(`Invalid minutes ${minutes}, only ${TriggerManger.ALLOWED_MINUTES.join(', ')} allowed`);
    }

    this.build(method, (builder) => {
      this.logger.debug(`Adding trigger for method '${method.name}'${this.symbol.description
        ? ` from '${this.symbol.description}'`
        : ''} running every ${minutes} minutes`);
      builder.everyMinutes(minutes);
    }, replace);
  }

  public addEveryHours(method: () => void, hours: number, replace?: boolean): void {
    this.build(method, (builder) => {
      this.logger.debug(`Adding trigger for method '${method.name}'${this.symbol.description
        ? ` from '${this.symbol.description}'`
        : ''} running every ${hours} hours`);
      builder.everyHours(hours)
        .nearMinute(0);
    }, replace);
  }

  public addEveryDays(method: () => void, days: number, replace?: boolean): void {
    this.build(method, (builder) => {
      this.logger.debug(`Adding trigger for method '${method.name}'${this.symbol.description
        ? ` from '${this.symbol.description}'`
        : ''} running every ${days} days`);
      builder.everyDays(days)
        .atHour(0)
        .nearMinute(0);
    }, replace);
  }

  public exists(method: () => void): boolean {
    this.logger.debug(`Checking trigger for method '${method.name}'${this.symbol.description
      ? ` from '${this.symbol.description}'`
      : ''}`);

    return this.getExistingTrigger(method) !== null;
  }

  public remove(method: () => void): void {
    this.logger.debug(`Removing trigger for method '${method.name}'${this.symbol.description
      ? ` from '${this.symbol.description}'`
      : ''}`);
    const existingTrigger = this.getExistingTrigger(method);
    if (existingTrigger === null) {
      this.logger.warning(`Trigger for method '${method.name}'${this.symbol.description
        ? ` from '${this.symbol.description}'`
        : ''} doesn't exist`);
      return;
    }

    ScriptApp.deleteTrigger(existingTrigger);
  }
}
