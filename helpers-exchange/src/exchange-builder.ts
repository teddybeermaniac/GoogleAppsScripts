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
import { errors as utilities_errors, getSymbol } from 'helpers-utilities';
import type { interfaces } from 'inversify';

import { ExchangeRateApiComExchangeProvider } from './providers/exchange-rate-api-com-exchange-provider/exchange-rate-api-com-exchange-provider';
import type { IExchangeRateApiComExchangeProviderSettings } from './providers/exchange-rate-api-com-exchange-provider/iexchange-rate-api-com-exchange-provider-settings';
import { ExchangeRateHostExchangeProvider } from './providers/exchange-rate-host-exchange-provider/exchange-rate-host-exchange-provider';
import type { IExchangeProvider } from './providers/iexchange-provider';
import { IExchangeRateApiComExchangeProviderSettingsSymbol } from './symbols';

export class ExchangeBuilder {
  private provider = false;

  constructor(private readonly container: interfaces.Container) { }

  public addExchangeRateApiComProvider(settings: IExchangeRateApiComExchangeProviderSettings)
    : ExchangeBuilder {
    if (this.provider) {
      throw new utilities_errors.BuilderError('ExchangeBuilder', 'An exchange provider was already added');
    }

    this.container.bind<IExchangeRateApiComExchangeProviderSettings>(
      IExchangeRateApiComExchangeProviderSettingsSymbol,
    ).toConstantValue(settings);
    this.container.bind<IExchangeProvider>(getSymbol(ExchangeRateApiComExchangeProvider))
      .to(ExchangeRateApiComExchangeProvider).inSingletonScope();
    this.provider = true;

    return this;
  }

  public addExchangeRateHostProvider(): ExchangeBuilder {
    if (this.provider) {
      throw new utilities_errors.BuilderError('ExchangeBuilder', 'An exchange provider was already added');
    }

    this.container.bind<IExchangeProvider>(getSymbol(ExchangeRateHostExchangeProvider))
      .to(ExchangeRateHostExchangeProvider).inSingletonScope();
    this.provider = true;

    return this;
  }
}
