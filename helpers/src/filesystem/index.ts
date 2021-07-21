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

import { getSymbol } from '../utilities';
import * as errors from './errors';
import { Filesystem } from './filesystem';
import { FilesystemBuilder } from './filesystem-builder';
import type { IFilesystem } from './ifilesystem';
import { ProviderType } from './providers/provider-type';
import { IFilesystemSymbol } from './symbols';

export function add(container: interfaces.Container, build: (builder: FilesystemBuilder) => void)
  : void {
  const builder = new FilesystemBuilder(container);
  build(builder);

  container.bind<IFilesystem>(getSymbol(Filesystem)).to(Filesystem).inTransientScope();
}

export const TYPES = {
  IFilesystem: IFilesystemSymbol,
};

export type {
  IFilesystem,
};

export {
  errors,
  ProviderType,
};
