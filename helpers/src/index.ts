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
import 'core-js';

import { Container, interfaces } from 'inversify';

import * as caching from './caching';
import * as exporting from './exporting';
import * as filesystem from './filesystem';
import * as iteration from './iteration';
import * as logging from './logging';
import * as triggering from './triggering';
import * as utilities from './utilities';
import { TYPES as UTILITIES_TYPES } from './utilities';

export function createContainer(): interfaces.Container {
  const container = new Container();
  container.bind<interfaces.Container>(UTILITIES_TYPES.Container).toConstantValue(container);

  return container;
}

export {
  caching,
  exporting,
  filesystem,
  iteration,
  logging,
  triggering,
  utilities,
};
