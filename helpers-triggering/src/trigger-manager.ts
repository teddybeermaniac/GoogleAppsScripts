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
import { IExportedMethodProvider, TYPES as EXPORTING_TYPES } from 'helpers-exporting';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import {
  AlreadyInitializedError,
  getBindMetadata, getOwnerType, NotInitializedError, Scope, setBindMetadata,
} from 'helpers-utilities';
import { inject, interfaces } from 'inversify';

import { AlreadyExistsTriggerError } from './errors/already-exists-trigger-error';
import type { ITriggerManager } from './itrigger-manager';
import type { Minutes } from './minutes';
import { ITriggerManagerSymbol } from './symbols';

@setBindMetadata(ITriggerManagerSymbol, Scope.Transient)
export class TriggerManager implements ITriggerManager {
  private symbolInternal?: symbol;

  private initialized = false;

  private get symbol(): symbol {
    if (!this.initialized || !this.symbolInternal) {
      throw new NotInitializedError('TriggerManager');
    }

    return this.symbolInternal;
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(EXPORTING_TYPES.IExportedMethodProvider)
    private readonly exportedMethodProvider: IExportedMethodProvider) {}

  private getExistingTrigger(method: () => void): GoogleAppsScript.Script.Trigger | undefined {
    this.logger.trace(() => {
      const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

      return `Getting existing trigger for method '${method.name}'${descriptionMessage}`;
    });
    const exportedName = this.exportedMethodProvider
      .getExportedMethodName(this.symbol, method.name);
    const existingTrigger = ScriptApp.getProjectTriggers()
      .find((trigger) => trigger.getHandlerFunction() === exportedName);
    if (!existingTrigger) {
      this.logger.trace(() => {
        const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

        return `Trigger for method '${method.name}'${descriptionMessage} does not exist`;
      });
    }

    return existingTrigger;
  }

  private build(method: () => void,
    builder: (trigger: GoogleAppsScript.Script.ClockTriggerBuilder) => void,
    replace?: boolean): void {
    this.logger.trace(() => {
      const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

      return `Building trigger for method '${method.name}'${descriptionMessage}`;
    });
    if (this.exists(method)) {
      if (replace) {
        this.logger.debug(() => {
          const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

          return `Trigger for method '${method.name}'${descriptionMessage} already exists; replacing`;
        });
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
      throw new AlreadyInitializedError('TriggerManager');
    }

    const owner = getOwnerType(context, TriggerManager);
    this.symbolInternal = getBindMetadata(owner).symbol;
    this.initialized = true;
  }

  public addEveryMinutes(method: () => void, minutes: Minutes, replace?: boolean): void {
    this.build(method, (builder) => {
      this.logger.information(() => {
        const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

        return `Adding trigger for method '${method.name}'${descriptionMessage} running every ${minutes} minutes`;
      });
      builder.everyMinutes(minutes);
    }, replace);
  }

  public addEveryHours(method: () => void, hours: number, replace?: boolean): void {
    this.build(method, (builder) => {
      this.logger.information(() => {
        const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

        return `Adding trigger for method '${method.name}'${descriptionMessage} running every ${hours} hours`;
      });
      builder.everyHours(hours)
        .nearMinute(0);
    }, replace);
  }

  public addEveryDays(method: () => void, days: number, replace?: boolean): void {
    this.build(method, (builder) => {
      this.logger.information(() => {
        const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

        return `Adding trigger for method '${method.name}'${descriptionMessage} running every ${days} days`;
      });
      builder.everyDays(days)
        .atHour(0)
        .nearMinute(0);
    }, replace);
  }

  public exists(method: () => void): boolean {
    this.logger.debug(() => {
      const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

      return `Checking trigger for method '${method.name}'${descriptionMessage}`;
    });

    return !!this.getExistingTrigger(method);
  }

  public remove(method: () => void): void {
    this.logger.information(() => {
      const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

      return `Removing trigger for method '${method.name}'${descriptionMessage}`;
    });
    const existingTrigger = this.getExistingTrigger(method);
    if (!existingTrigger) {
      this.logger.warning(() => {
        const descriptionMessage = this.symbol.description ? ` from '${this.symbol.description}'` : '';

        return `Trigger for method '${method.name}'${descriptionMessage} doesn't exist`;
      });
      return;
    }

    ScriptApp.deleteTrigger(existingTrigger);
  }
}
