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
import addCaching from 'helpers-caching';
import addExchange from 'helpers-exchange';
import addExporting from 'helpers-exporting';
import addLogging from 'helpers-logging';
import addQuerying from 'helpers-querying';
import { createContainer } from 'helpers-utilities';
import type { interfaces } from 'inversify';

import GoogleSpreadsheetSQL from './google-spreadsheet-sql';

const container: interfaces.Container = createContainer();
addCaching(container, (builder) => {
  builder.addGoogleAppsScriptProvider();
});
addExchange(container, (builder) => {
  builder.addExchangeRateApiComProvider();
});
addExporting(container, (builder) => {
  builder.addContainer(GoogleSpreadsheetSQL, true);
});
addLogging(container, (builder) => {
  builder.addSettings();
  builder.addGoogleAppsScriptProvider();
});
addQuerying(container);

export default {
  container,
};
