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
import { AllRecord, Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import { IExchangeProviderSymbol } from '../../symbols';
import BaseExchangeProvider from '../base-exchange-provider';
import ProviderType from '../provider-type';
import ExchangeRateHostCurrency, { ExchangeRateHostCurrencyRuntype } from './models/exchange-rate-host-currency';
import ExchangeRateHostResponse, { ExchangeRateHostResponseRuntype } from './models/exchange-rate-host-response';

@setBindMetadata(IExchangeProviderSymbol, Scope.Singleton)
export default class ExchangeRateHostExchangeProvider
  extends BaseExchangeProvider<ExchangeRateHostResponse, ExchangeRateHostCurrency> {
  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache) {
    super(logger, cache, ProviderType.ExchangeRateHost, 3600, ExchangeRateHostResponseRuntype,
      ExchangeRateHostCurrencyRuntype);
  }

  protected getUrl(from: ExchangeRateHostCurrency, _to: ExchangeRateHostCurrency): string {
    return `https://api.exchangerate.host/latest?base=${encodeURIComponent(from)}`;
  }

  protected getRates(response: ExchangeRateHostResponse):
  AllRecord<ExchangeRateHostCurrency, number> {
    return response.rates;
  }
}
