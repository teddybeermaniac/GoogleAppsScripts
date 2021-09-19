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

import { ExchangeRateApiComExchangeProviderSettingsSymbol, IExchangeProviderSymbol } from '../../symbols';
import BaseExchangeProvider from '../base-exchange-provider';
import ProviderType from '../provider-type';
import type ExchangeRateApiComExchangeProviderSettings from './exchange-rate-api-com-exchange-provider-settings';
import ExchangeRateApiComCurrency, { ExchangeRateApiComCurrencyRuntype } from './models/exchange-rate-api-com-currency';
import ExchangeRateApiComResponse, { ExchangeRateApiComResponseRuntype } from './models/exchange-rate-api-com-response';

@setBindMetadata(IExchangeProviderSymbol, Scope.Singleton)
export default class ExchangeRateApiComExchangeProvider
  extends BaseExchangeProvider<ExchangeRateApiComResponse, ExchangeRateApiComCurrency> {
  protected readonly cacheTtl = 86_400;

  protected readonly responseRuntype = ExchangeRateApiComResponseRuntype;

  public readonly currencyRuntype = ExchangeRateApiComCurrencyRuntype;

  public readonly providerType = ProviderType.ExchangeRateApiCom;

  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache,
    @inject(ExchangeRateApiComExchangeProviderSettingsSymbol) private readonly settings:
    ExchangeRateApiComExchangeProviderSettings) {
    super(logger, cache);
  }

  protected getUrl(from: ExchangeRateApiComCurrency, _to: ExchangeRateApiComCurrency): string {
    return `https://v6.exchangerate-api.com/v6/${encodeURIComponent(this.settings.apiKey)}/latest/${encodeURIComponent(from)}`;
  }

  protected getRates(response: ExchangeRateApiComResponse):
  AllRecord<ExchangeRateApiComCurrency, number> {
    return response.conversion_rates;
  }
}
