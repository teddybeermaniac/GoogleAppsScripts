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
import type { interfaces } from 'inversify';

import { UnableToFindOwnerTypeError } from '../errors/unable-to-find-owner-type-error';
import { getBindMetadata } from './get-bind-metadata';

export function getOwnerType<TContainer>(context: interfaces.Context,
  constructor: interfaces.Newable<TContainer>): interfaces.Newable<unknown> {
  const { symbol } = getBindMetadata(constructor);
  let request: interfaces.Request | null = context.currentRequest;
  while (request) {
    if (request.serviceIdentifier === symbol) {
      break;
    }

    request = request.parentRequest;
  }

  if (!request?.bindings[0]?.implementationType) {
    throw new UnableToFindOwnerTypeError(symbol.description ?? 'unknown');
  }

  return request.bindings[0].implementationType;
}
