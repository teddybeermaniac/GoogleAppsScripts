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
import type { ICache } from 'helpers-caching';
import type { ILogger } from 'helpers-logging';
import { injectable } from 'inversify';

import { InvalidCurrencyError, RateFetchError } from '../errors';
import type { IExchangeProvider } from './iexchange-provider';
import type { ProviderType } from './provider-type';

@injectable()
export abstract class BaseExchangeProvider implements IExchangeProvider {
  public abstract providerType: ProviderType;

  public abstract supportedCurrencies: string[];

  constructor(protected readonly logger: ILogger, protected readonly cache: ICache) { }

  public abstract getRate(from: string, to: string): number;

  protected getRateInternal(from: string, to: string, url: string, cacheTtl: number,
    callback: (result: any) => { [currency: string]: number; }): number {
    this.logger.debug(`Getting conversion rate from '${from}' to '${to}'`);
    let rates = this.cache.get<{ [currency: string]: number; }>(`rates_${from}`);
    if (!rates) {
      this.logger.trace('Conversion rates not found in cache; fetching');
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) {
        throw new RateFetchError(response.getContentText());
      }

      this.logger.trace('Fetched conversion rates');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = JSON.parse(response.getContentText());
      rates = callback(result);

      if (!rates) {
        throw new RateFetchError('No rates found');
      }

      this.cache.set(`rates_${from}`, rates, cacheTtl);
    }

    if (rates[to] === undefined) {
      throw new InvalidCurrencyError(to);
    }

    return rates[to]!;
  }
}
