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
import { bind, BuilderCallback } from 'helpers-utilities';
import type { interfaces } from 'inversify';

import type Currency from './currency';
import BadRateFetchResponseError from './errors/bad-rate-fetch-response-error';
import ExchangeError from './errors/exchange-error';
import InvalidCurrencyError from './errors/invalid-currency-error';
import Exchange from './exchange';
import ExchangeBuilder from './exchange-builder';
import type IExchange from './iexchange';
import type ProviderType from './providers/provider-type';
import { IExchangeSymbol } from './symbols';

export default function addExchange(container: interfaces.Container,
  build: BuilderCallback<ExchangeBuilder>): void {
  const builder = new ExchangeBuilder(container);
  build(builder);

  bind(container, Exchange);
}

export const TYPES = {
  IExchange: IExchangeSymbol,
};

export type {
  Currency,
  IExchange,
};

export {
  BadRateFetchResponseError,
  ExchangeError,
  InvalidCurrencyError,
  ProviderType,
};
