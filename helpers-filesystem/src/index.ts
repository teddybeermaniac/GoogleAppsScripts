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

import DuplicatePathError from './errors/duplicate-path-error';
import FilesystemError from './errors/filesystem-error';
import InternalProviderError from './errors/internal-provider-error';
import InvalidPathError from './errors/invalid-path-error';
import NoShortcutTargetError from './errors/no-shortcut-target-error';
import NotFoundPathError from './errors/not-found-path-error';
import Filesystem from './filesystem';
import FilesystemBuilder from './filesystem-builder';
import type IFile from './ifile';
import type IFilesystem from './ifilesystem';
import type IFolder from './ifolder';
import type IItem from './iitem';
import type IShortcut from './ishortcut';
import ItemType from './item-type';
import ProviderType from './providers/provider-type';
import { IFilesystemSymbol } from './symbols';

export default function addFilesystem(container: interfaces.Container,
  build: BuilderCallback<FilesystemBuilder>): void {
  const builder = new FilesystemBuilder(container);
  build(builder);

  bind(container, Filesystem);
}

export const TYPES = {
  IFilesystem: IFilesystemSymbol,
};

export type {
  IFile,
  IFilesystem,
  IFolder,
  IItem,
  IShortcut,
};

export {
  DuplicatePathError,
  FilesystemError,
  InternalProviderError,
  InvalidPathError,
  ItemType,
  NoShortcutTargetError,
  NotFoundPathError,
  ProviderType,
};
