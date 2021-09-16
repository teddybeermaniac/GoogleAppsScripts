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
import { Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import InvalidLogLevelError from '../../errors/invalid-log-level-error';
import LogLevel, { logLevelValues } from '../../log-level';
import { GoogleAppsScriptLoggerProviderSettingsSymbol, ILoggerProviderSymbol } from '../../symbols';
import type ILoggerProvider from '../ilogger-provider';
import ProviderType from '../provider-type';
import type GoogleAppsScriptLoggerProviderSettings from './google-apps-script-logger-provider-settings';

@setBindMetadata(ILoggerProviderSymbol, Scope.Singleton)
export default class GoogleAppsScriptLoggerProvider implements ILoggerProvider {
  private readonly logLevel: number;

  public readonly providerType = ProviderType.GoogleAppsScript;

  constructor(@inject(GoogleAppsScriptLoggerProviderSettingsSymbol)
  private readonly settings: GoogleAppsScriptLoggerProviderSettings) {
    this.logLevel = logLevelValues[this.settings.level];
  }

  public log(name: string, level: LogLevel, message: string | (() => string), error?: Error): void {
    if (logLevelValues[level] < this.logLevel) {
      return;
    }

    let method: (message: string) => void;
    let prefix: string;
    switch (level) {
      case 'Trace':
        // eslint-disable-next-line no-console
        method = console.log;
        prefix = 'TRC';
        break;
      case 'Debug':
        // eslint-disable-next-line no-console
        method = console.log;
        prefix = 'DBG';
        break;
      case 'Information':
        // eslint-disable-next-line no-console
        method = console.info;
        prefix = 'INF';
        break;
      case 'Warning':
        // eslint-disable-next-line no-console
        method = console.warn;
        prefix = 'WRN';
        break;
      case 'Error':
        // eslint-disable-next-line no-console
        method = console.error;
        prefix = 'ERR';
        break;
      default:
        throw new InvalidLogLevelError(level);
    }

    const logMessage = message instanceof Function ? message() : message;

    let errorMessage = '';
    if (level === 'Error' && error) {
      const errorStack = error.stack ? `; ${error.stack}` : '';
      errorMessage = `; ${error.name}: ${error.message}${errorStack}`;
    }

    method(`[${prefix}][${name}] ${logMessage}${errorMessage}`);
  }
}
