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
  caching, createContainer, exchange, exporting, logging, querying,
} from 'helpers';
import type { interfaces } from 'inversify';

import { GoogleSpreadsheetSQL } from './google-spreadsheet-sql';

const container: interfaces.Container = createContainer();
caching.add(container, (builder) => {
  builder.addGoogleAppsScriptProvider();
});
exchange.add(container, (builder) => {
  if (process.env['EXCHANGE_RATE_API_COM_EXCHANGE_PROVIDER_API_KEY'] === undefined) {
    throw new Error('EXCHANGE_RATE_API_COM_EXCHANGE_PROVIDER_API_KEY is not defined');
  }

  builder.addExchangeRateApiComProvider({
    apiKey: process.env['EXCHANGE_RATE_API_COM_EXCHANGE_PROVIDER_API_KEY'],
  });
});
exporting.add(container, (builder) => {
  builder.addContainer(GoogleSpreadsheetSQL, true);
});
logging.add(container, (builder) => {
  builder.addSettings({
    level: logging.LogLevel.Information,
  });
  builder.addGoogleAppsScriptProvider();
});
querying.add(container);

export {
  container,
};
