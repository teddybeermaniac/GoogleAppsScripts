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
import { camelCase, constantCase } from 'change-case';
import type { interfaces } from 'inversify';
import type { RuntypeBase } from 'runtypes/lib/runtype';

import UnableToLoadSettingsError from '../errors/unable-to-load-settings-error';

declare let process: {
  env: { [key: string]: string }
};

export default function bindSettings<TSettings>(container: interfaces.Container, symbol: symbol,
  name: string, runtype: RuntypeBase<TSettings>, defaults: Partial<TSettings>,
  statics?: Partial<TSettings>): void {
  const prefixRegex = new RegExp(`^${constantCase(name)}_`);
  const environment = Object.fromEntries(Object.entries(process.env)
    .filter(([key, _value]) => prefixRegex.test(key))
    .map(([key, value]) => [camelCase(key.replace(prefixRegex, '')), value]));
  const settings = { ...defaults, ...statics, ...environment };

  let strongSettings: TSettings;
  try {
    strongSettings = runtype.check(settings);
  } catch (error) {
    if (error instanceof Error) {
      throw new UnableToLoadSettingsError(name, error);
    }

    throw error;
  }

  container.bind<TSettings>(symbol).toConstantValue(strongSettings);
}
