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
import type { interfaces } from 'inversify';
import type { ILoggerSettings } from './ilogger-settings';
import type { ILoggerProvider } from './ilogger-provider';
import { ConsoleLoggerProvider } from './providers/console-logger-provider';
import type { IConsoleLoggerProviderSettings } from './providers/iconsole-logger-provider-settings';
import { IConsoleLoggerProviderSettingsSymbol, ILoggerSettingsSymbol, ILoggerProviderSymbol } from './symbols';

export class LoggingBuilder {
  constructor(private readonly container: interfaces.Container) { }

  public addSettings(settings: ILoggerSettings): LoggingBuilder {
    this.container.bind<ILoggerSettings>(ILoggerSettingsSymbol).toConstantValue(settings);

    return this;
  }

  public addConsoleProvider(settings?: IConsoleLoggerProviderSettings): LoggingBuilder {
    if (settings) {
      this.container.bind<IConsoleLoggerProviderSettings>(IConsoleLoggerProviderSettingsSymbol)
        .toConstantValue(settings);
    }
    this.container.bind<ILoggerProvider>(ILoggerProviderSymbol).to(ConsoleLoggerProvider)
      .inSingletonScope();

    return this;
  }
}
