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
import { errors as utilities_errors, getSymbol } from 'helpers-utilities';
import type { interfaces } from 'inversify';

import type { ILoggerSettings } from './ilogger-settings';
import { GoogleAppsScriptLoggerProvider } from './providers/google-apps-script-logger-provider/google-apps-script-logger-provider';
import type { IGoogleAppsScriptLoggerProviderSettings } from './providers/google-apps-script-logger-provider/igoogle-apps-script-logger-provider-settings';
import type { ILoggerProvider } from './providers/ilogger-provider';
import { IGoogleAppsScriptLoggerProviderSettingsSymbol, ILoggerSettingsSymbol } from './symbols';

export class LoggingBuilder {
  private appScriptProvider = false;

  constructor(private readonly container: interfaces.Container) { }

  public addSettings(settings: ILoggerSettings): LoggingBuilder {
    this.container.bind<ILoggerSettings>(ILoggerSettingsSymbol).toConstantValue(settings);

    return this;
  }

  public addGoogleAppsScriptProvider(settings?: IGoogleAppsScriptLoggerProviderSettings):
  LoggingBuilder {
    if (this.appScriptProvider) {
      throw new utilities_errors.BuilderError('LoggingBuilder', 'GoogleAppsScript logger provider already added');
    }

    if (settings) {
      this.container
        .bind<IGoogleAppsScriptLoggerProviderSettings>(
        IGoogleAppsScriptLoggerProviderSettingsSymbol,
      ).toConstantValue(settings);
    }
    this.container.bind<ILoggerProvider>(getSymbol(GoogleAppsScriptLoggerProvider))
      .to(GoogleAppsScriptLoggerProvider).inSingletonScope();
    this.appScriptProvider = true;

    return this;
  }
}