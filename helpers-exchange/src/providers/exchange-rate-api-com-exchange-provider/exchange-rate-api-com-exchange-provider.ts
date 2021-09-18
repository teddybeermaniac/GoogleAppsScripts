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
import { ICache, TYPES as CACHING_TYPES } from 'helpers-caching';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import BadRateFetchResponseError from '../../errors/bad-rate-fetch-response-error';
import { ExchangeRateApiComExchangeProviderSettingsSymbol, IExchangeProviderSymbol } from '../../symbols';
import BaseExchangeProvider from '../base-exchange-provider';
import ProviderType from '../provider-type';
import currencies from './currencies.json';
import type ExchangeRateApiComExchangeProviderSettings from './exchange-rate-api-com-exchange-provider-settings';

@setBindMetadata(IExchangeProviderSymbol, Scope.Singleton)
export default class ExchangeRateApiComExchangeProvider extends BaseExchangeProvider {
  public readonly supportedCurrencies = currencies;

  public readonly providerType = ProviderType.ExchangeRateApiCom;

  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache,
    @inject(ExchangeRateApiComExchangeProviderSettingsSymbol) private readonly settings:
    ExchangeRateApiComExchangeProviderSettings) {
    super(logger, cache);
  }

  getRate(from: string, to: string): number {
    return this.getRateInternal(from, to,
      `https://v6.exchangerate-api.com/v6/${encodeURIComponent(this.settings.apiKey)}/latest/${encodeURIComponent(from)}`,
      86_400, (result) => {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        if ((<any>result).result !== 'success') {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          throw new BadRateFetchResponseError((<any>result).result);
        }

        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        return <{ [currency: string]: number; }>(<any>result).conversion_rates;
      });
  }
}
