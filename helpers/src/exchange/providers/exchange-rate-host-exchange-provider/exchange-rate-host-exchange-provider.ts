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
import { inject, injectable } from 'inversify';

import { ICache, TYPES as CACHING_TYPES } from '../../../caching';
import { ILogger, TYPES as LOGGING_TYPES } from '../../../logging';
import { bindSymbol } from '../../../utilities';
import type { Currency } from '../../currency';
import { InvalidCurrencyError } from '../../errors';
import { RateFetchError } from '../../errors/rate-fetch-error';
import { IExchangeProviderSymbol } from '../../symbols';
import type { IExchangeProvider } from '../iexchange-provider';
import { ProviderType } from '../provider-type';

@injectable()
@bindSymbol(IExchangeProviderSymbol)
export class ExchangeRateHostExchangeProvider implements IExchangeProvider {
  private readonly supportedCurrencies = [
    'AED',
    'AFN',
    'ALL',
    'AMD',
    'ANG',
    'AOA',
    'ARS',
    'AUD',
    'AWG',
    'AZN',
    'BAM',
    'BBD',
    'BDT',
    'BGN',
    'BHD',
    'BIF',
    'BMD',
    'BND',
    'BOB',
    'BRL',
    'BSD',
    'BTC',
    'BTN',
    'BWP',
    'BYN',
    'BZD',
    'CAD',
    'CDF',
    'CHF',
    'CLF',
    'CLP',
    'CNH',
    'CNY',
    'COP',
    'CRC',
    'CUC',
    'CUP',
    'CVE',
    'CZK',
    'DJF',
    'DKK',
    'DOP',
    'DZD',
    'EGP',
    'ERN',
    'ETB',
    'EUR',
    'FJD',
    'FKP',
    'GBP',
    'GEL',
    'GGP',
    'GHS',
    'GIP',
    'GMD',
    'GNF',
    'GTQ',
    'GYD',
    'HKD',
    'HNL',
    'HRK',
    'HTG',
    'HUF',
    'IDR',
    'ILS',
    'IMP',
    'INR',
    'IQD',
    'IRR',
    'ISK',
    'JEP',
    'JMD',
    'JOD',
    'JPY',
    'KES',
    'KGS',
    'KHR',
    'KMF',
    'KPW',
    'KRW',
    'KWD',
    'KYD',
    'KZT',
    'LAK',
    'LBP',
    'LKR',
    'LRD',
    'LSL',
    'LYD',
    'MAD',
    'MDL',
    'MGA',
    'MKD',
    'MMK',
    'MNT',
    'MOP',
    'MRO',
    'MRU',
    'MUR',
    'MVR',
    'MWK',
    'MXN',
    'MYR',
    'MZN',
    'NAD',
    'NGN',
    'NIO',
    'NOK',
    'NPR',
    'NZD',
    'OMR',
    'PAB',
    'PEN',
    'PGK',
    'PHP',
    'PKR',
    'PLN',
    'PYG',
    'QAR',
    'RON',
    'RSD',
    'RUB',
    'RWF',
    'SAR',
    'SBD',
    'SCR',
    'SDG',
    'SEK',
    'SGD',
    'SHP',
    'SLL',
    'SOS',
    'SRD',
    'SSP',
    'STD',
    'STN',
    'SVC',
    'SYP',
    'SZL',
    'THB',
    'TJS',
    'TMT',
    'TND',
    'TOP',
    'TRY',
    'TTD',
    'TWD',
    'TZS',
    'UAH',
    'UGX',
    'USD',
    'UYU',
    'UZS',
    'VES',
    'VND',
    'VUV',
    'WST',
    'XAF',
    'XAG',
    'XAU',
    'XCD',
    'XDR',
    'XOF',
    'XPD',
    'XPF',
    'XPT',
    'YER',
    'ZAR',
    'ZMW',
    'ZWL',
  ];

  public get providerType(): ProviderType {
    return ProviderType.ExchangeRateHost;
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(CACHING_TYPES.ICache) private readonly cache: ICache) { }

  getRate(from: Currency, to: Currency): number {
    this.logger.trace(`Getting rate from '${from}' to '${to}'`);
    if (!this.supportedCurrencies.includes(from)) {
      throw new InvalidCurrencyError(from);
    }
    if (!this.supportedCurrencies.includes(to)) {
      throw new InvalidCurrencyError(to);
    }

    let rates = this.cache.get<{ [currency: string]: number; }>(`rates_${from}`);
    if (!rates) {
      this.logger.trace('Rates not found in cache, fetching');
      const response = UrlFetchApp.fetch(`https://api.exchangerate.host/latest?base=${encodeURIComponent(from)}`, {
        muteHttpExceptions: true,
      });
      if (response.getResponseCode() !== 200) {
        throw new RateFetchError(response.getContentText());
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      rates = <{ [currency: string]: number; }>JSON.parse(response.getContentText()).rates;
      this.cache.set(`rates_${from}`, rates, 3600);
    }

    if (rates[to] === undefined) {
      throw new InvalidCurrencyError(to);
    }

    return rates[to]!;
  }
}
