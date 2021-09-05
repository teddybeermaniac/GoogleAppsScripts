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
import { bindSymbol, errors as utilities_errors, getOwnerType } from 'helpers-utilities';
import {
  inject, injectable, interfaces, multiInject, optional,
} from 'inversify';

import type { ILogger } from './ilogger';
import type { ILoggerSettings } from './ilogger-settings';
import { LogLevel } from './log-level';
import type { ILoggerProvider } from './providers/ilogger-provider';
import type { ProviderType } from './providers/provider-type';
import { ILoggerProviderSymbol, ILoggerSettingsSymbol, ILoggerSymbol } from './symbols';

@injectable()
@bindSymbol(ILoggerSymbol)
export class Logger implements ILogger {
  private _name: string | undefined;

  private initialized = false;

  public get providerTypes(): ProviderType[] {
    return this.providers.map((provider) => provider.providerType);
  }

  constructor(@inject(ILoggerSettingsSymbol) @optional()
  private readonly settings: ILoggerSettings,
  @multiInject(ILoggerProviderSymbol) private readonly providers: ILoggerProvider[]) { }

  private get name(): string {
    if (!this.initialized || this._name === undefined) {
      throw new utilities_errors.InitializationError('Not initialized');
    }

    return this._name;
  }

  private log(level: LogLevel, message: string, error: Error | undefined) {
    if (this.settings && this.settings.level !== undefined && level < this.settings.level) {
      return;
    }

    this.providers.forEach((provider) => {
      try {
        provider.log(this.name, level, message, error);
      } catch (providerError) {
        // eslint-disable-next-line no-console
        console.error(providerError);
      }
    });
  }

  public initialize(context: interfaces.Context): void {
    if (this.initialized) {
      throw new utilities_errors.InitializationError('Already initialized');
    }

    const owner = getOwnerType(context, Logger);
    this._name = owner.name;
    this.initialized = true;
  }

  public trace(message: string): void {
    this.log(LogLevel.Trace, message, undefined);
  }

  public debug(message: string): void {
    this.log(LogLevel.Debug, message, undefined);
  }

  public information(message: string): void {
    this.log(LogLevel.Information, message, undefined);
  }

  public warning(message: string): void {
    this.log(LogLevel.Warning, message, undefined);
  }

  public error(message: string, error?: Error): void {
    this.log(LogLevel.Error, message, error);
  }
}