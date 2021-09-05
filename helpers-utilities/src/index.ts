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

import { bindSymbol } from './binding/bind-symbol';
import { getSymbol } from './binding/get-symbol';
import * as errors from './errors';
import { getOwnerType } from './initialization/get-owner-type';
import type { IInitializable } from './initialization/iinitializable';
import { onInitializableActivation } from './initialization/on-initializable-activation';
import { ContainerSymbol } from './symbols';

export function createContainer(): interfaces.Container {
  const container = new Container();
  container.bind<interfaces.Container>(ContainerSymbol).toConstantValue(container);

  return container;
}

export const TYPES = {
  Container: ContainerSymbol,
};

export type {
  IInitializable,
};

export {
  bindSymbol,
  errors,
  getOwnerType,
  getSymbol,
  onInitializableActivation,
};
