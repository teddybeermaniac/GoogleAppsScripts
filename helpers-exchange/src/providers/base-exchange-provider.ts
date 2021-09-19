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
import { AllRecord, JSONEx } from 'helpers-utilities';
import { injectable } from 'inversify';
import type { RuntypeBase } from 'runtypes/lib/runtype';

import type Currency from '../currency';
import BadRateFetchResponseError from '../errors/bad-rate-fetch-response-error';
import InvalidCurrencyError from '../errors/invalid-currency-error';
import type IExchangeProvider from './iexchange-provider';
import type ProviderType from './provider-type';

@injectable()
export default abstract class BaseExchangeProvider<TResponse, TCurrency extends string>
implements IExchangeProvider {
  protected abstract readonly cacheTtl: number;

  protected abstract readonly responseRuntype: RuntypeBase<TResponse>;

  public abstract readonly currencyRuntype: RuntypeBase<TCurrency>;

  public abstract readonly providerType: ProviderType;

  constructor(protected readonly logger: ILogger, protected readonly cache: ICache) {}

  protected abstract getUrl(from: Currency, to: Currency): string;

  protected abstract getRates(response: TResponse): AllRecord<TCurrency, number>;

  public getRate(from: Currency, to: Currency): number {
    this.logger.debug(`Getting conversion rate from '${from}' to '${to}'`);
    let rates = this.cache.get<AllRecord<TCurrency, number>>(`rates_${from}`);
    if (!rates) {
      this.logger.trace('Conversion rates not found in cache; fetching');
      const response = UrlFetchApp.fetch(this.getUrl(from, to), { muteHttpExceptions: true });
      const responseText = response.getContentText();
      if (response.getResponseCode() !== 200) {
        throw new BadRateFetchResponseError(responseText);
      }

      this.logger.trace(`Fetched conversion rates: ${responseText}`);
      const result = JSONEx.parse<TResponse>(responseText);
      if (!this.responseRuntype.guard(result)) {
        throw new BadRateFetchResponseError(`Invalid response: ${responseText}`);
      }

      rates = this.getRates(result);
      this.cache.set(`rates_${from}`, rates, this.cacheTtl);
    }

    const rate = rates[<TCurrency>to];
    if (!rate) {
      throw new InvalidCurrencyError(to);
    }

    return rate;
  }
}
