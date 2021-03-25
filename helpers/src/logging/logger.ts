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
import { inject, injectable } from 'inversify';
import { LOGGING_TYPES } from './types';
import type { ILogger } from './ilogger';
import { LogLevel } from './log-level';
import type { ILoggerSettings } from './ilogger-settings';

@injectable()
export class Logger implements ILogger {
  private initialized: boolean;

  private name?: string;

  public constructor(@inject(LOGGING_TYPES.ILoggerSettings)
  private readonly settings: ILoggerSettings) {
    this.initialized = false;
    this.name = undefined;
  }

  private log(level: LogLevel, message: string, method: (message: string) => void) {
    if (level < this.settings.logLevel) {
      return;
    }

    method(this.name ? `[${this.name}] ${message}` : message);
  }

  initialize(name: string): void {
    if (this.initialized) {
      throw new Error('Already initialized');
    }

    this.name = name;
    this.initialized = true;
  }

  public debug(message: string): void {
    // eslint-disable-next-line no-console
    this.log(LogLevel.Debug, message, console.log);
  }

  public information(message: string): void {
    // eslint-disable-next-line no-console
    this.log(LogLevel.Info, message, console.info);
  }

  public warning(message: string): void {
    // eslint-disable-next-line no-console
    this.log(LogLevel.Warning, message, console.warn);
  }

  public error(message: string): void {
    // eslint-disable-next-line no-console
    this.log(LogLevel.Error, message, console.error);
  }
}
