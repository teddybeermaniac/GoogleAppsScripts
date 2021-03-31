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
  inject, injectable, multiInject, optional,
} from 'inversify';
import { ILoggerSettingsSymbol, ILoggerProviderSymbol } from './symbols';
import type { ILogger } from './ilogger';
import { LogLevel } from './log-level';
import type { ILoggerSettings } from './ilogger-settings';
import type { ILoggerProvider } from './providers/ilogger-provider';

@injectable()
export class Logger implements ILogger {
  private name?: string;

  private initialized = false;

  public constructor(@inject(ILoggerSettingsSymbol) @optional()
  private readonly settings: ILoggerSettings,
  @multiInject(ILoggerProviderSymbol) private readonly providers: ILoggerProvider[]) {
  }

  private log(level: LogLevel, message: string, error?: Error) {
    if (this.settings && this.settings.level !== undefined && level < this.settings.level) {
      return;
    }

    this.providers.forEach((provider) => {
      try {
        provider.log(level, message, this.name, error);
      } catch (providerError) {
        // eslint-disable-next-line no-console
        console.error(providerError);
      }
    });
  }

  public initialize(name: string): void {
    if (this.initialized) {
      throw new Error('Already initialized');
    }

    this.name = name;
    this.initialized = true;
  }

  public trace(message: string): void {
    this.log(LogLevel.Trace, message);
  }

  public debug(message: string): void {
    this.log(LogLevel.Debug, message);
  }

  public information(message: string): void {
    this.log(LogLevel.Information, message);
  }

  public warning(message: string): void {
    this.log(LogLevel.Warning, message);
  }

  public error(message: string, error?: Error): void {
    this.log(LogLevel.Error, message, error);
  }
}
