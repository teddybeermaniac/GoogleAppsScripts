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
/* eslint-disable no-console */
import { inject, injectable, optional } from 'inversify';
import { LogLevel } from '../log-level';
import type { ILoggerProvider } from './ilogger-provider';
import { IAppsScriptLoggerProviderSettingsSymbol } from '../symbols';
import type { IAppsScriptLoggerProviderSettings } from './iapps-script-logger-provider-settings';

@injectable()
export class AppsScriptLoggerProvider implements ILoggerProvider {
  constructor(@inject(IAppsScriptLoggerProviderSettingsSymbol) @optional()
  private readonly settings: IAppsScriptLoggerProviderSettings) { }

  public log(level: LogLevel, message: string, name?: string, error?: Error): void {
    if (this.settings && this.settings.level !== undefined && level < this.settings.level) {
      return;
    }

    let method: (message: string) => void;
    // eslint-disable-next-line default-case
    switch (level) {
      case LogLevel.Trace:
      case LogLevel.Debug:
        method = console.log;
        break;
      case LogLevel.Information:
        method = console.info;
        break;
      case LogLevel.Warning:
        method = console.warn;
        break;
      case LogLevel.Error:
        method = console.error;
        break;
    }

    const fullMessage = (name ? `[${name}] ` : '')
      + message
      + (level === LogLevel.Error && error
        ? `; ${error.name}: ${error.message}${error.stack ? `; ${error.stack}` : ''}`
        : '');

    method(fullMessage);
  }
}
