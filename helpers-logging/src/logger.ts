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
import {
  AlreadyInitializedError, getOwnerType, NotInitializedError, Scope, setBindMetadata,
} from 'helpers-utilities';
import { inject, interfaces, multiInject } from 'inversify';

import type { ILogger } from './ilogger';
import { LogLevel, logLevelValues } from './log-level';
import type { LoggerSettings } from './logger-settings';
import type { ILoggerProvider } from './providers/ilogger-provider';
import type { ProviderType } from './providers/provider-type';
import { ILoggerProviderSymbol, ILoggerSymbol, LoggerSettingsSymbol } from './symbols';

@setBindMetadata(ILoggerSymbol, Scope.Transient)
export class Logger implements ILogger {
  private readonly logLevel: number;

  public readonly providerTypes: ProviderType[];

  private nameInternal?: string;

  private initialized = false;

  private get name(): string {
    if (!this.initialized || !this.nameInternal) {
      throw new NotInitializedError('Logger');
    }

    return this.nameInternal;
  }

  constructor(@inject(LoggerSettingsSymbol) private readonly settings: LoggerSettings,
    @multiInject(ILoggerProviderSymbol) private readonly providers: ILoggerProvider[]) {
    this.logLevel = logLevelValues[this.settings.level];
    this.providerTypes = this.providers.map((provider) => provider.providerType);
  }

  private log(level: LogLevel, message: string | (() => string), error?: Error) {
    if (logLevelValues[level] < this.logLevel) {
      return;
    }

    this.providers.forEach((provider) => {
      try {
        provider.log(this.name, level, message, error);
      } catch (providerError) {
        // eslint-disable-next-line no-console
        console.error(<Error>providerError);
      }
    });
  }

  public initialize(context: interfaces.Context): void {
    if (this.initialized) {
      throw new AlreadyInitializedError('Logger');
    }

    const owner = getOwnerType(context, Logger);
    this.nameInternal = owner.name;
    this.initialized = true;
  }

  public trace(message: string | (() => string)): void {
    this.log('Trace', message);
  }

  public debug(message: string | (() => string)): void {
    this.log('Debug', message);
  }

  public information(message: string | (() => string)): void {
    this.log('Information', message);
  }

  public warning(message: string | (() => string)): void {
    this.log('Warning', message);
  }

  public error(message: string | (() => string), error?: Error): void {
    this.log('Error', message, error);
  }
}
