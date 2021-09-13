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
  bind, bindSettings, errors as utilities_errors,
} from 'helpers-utilities';
import type { interfaces } from 'inversify';

import type { LoggerSettings } from './logger-settings';
import { LoggerSettings as LoggerSettingsRuntype } from './logger-settings';
import { GoogleAppsScriptLoggerProvider } from './providers/google-apps-script-logger-provider/google-apps-script-logger-provider';
import type { GoogleAppsScriptLoggerProviderSettings } from './providers/google-apps-script-logger-provider/google-apps-script-logger-provider-settings';
import { GoogleAppsScriptLoggerProviderSettings as GoogleAppsScriptLoggerProviderSettingsRuntype } from './providers/google-apps-script-logger-provider/google-apps-script-logger-provider-settings';
import { GoogleAppsScriptLoggerProviderSettingsSymbol, LoggerSettingsSymbol } from './symbols';

export class LoggingBuilder {
  private appScriptProvider = false;

  constructor(private readonly container: interfaces.Container) { }

  public addSettings(settings?: Partial<LoggerSettings>): LoggingBuilder {
    bindSettings(this.container, LoggerSettingsSymbol, 'Logger', LoggerSettingsRuntype, {
      level: 'Information',
    }, settings);

    return this;
  }

  public addGoogleAppsScriptProvider(settings?: Partial<GoogleAppsScriptLoggerProviderSettings>):
  LoggingBuilder {
    if (this.appScriptProvider) {
      throw new utilities_errors.BuilderError('LoggingBuilder', 'GoogleAppsScript logger provider already added');
    }

    bindSettings(this.container, GoogleAppsScriptLoggerProviderSettingsSymbol,
      'GoogleAppsScriptLoggerProvider', GoogleAppsScriptLoggerProviderSettingsRuntype, {
        level: 'Trace',
      }, settings);

    bind(this.container, GoogleAppsScriptLoggerProvider);
    this.appScriptProvider = true;

    return this;
  }
}
