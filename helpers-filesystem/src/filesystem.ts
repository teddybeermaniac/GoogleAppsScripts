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
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { bindSymbol } from 'helpers-utilities';
import { inject, injectable } from 'inversify';

import type { IFilesystem } from './ifilesystem';
import type { IItem } from './iitem';
import type { IFilesystemProvider } from './providers/ifilesystem-provider';
import type { ProviderType } from './providers/provider-type';
import { IFilesystemProviderSymbol, IFilesystemSymbol } from './symbols';

@injectable()
@bindSymbol(IFilesystemSymbol)
export class Filesystem implements IFilesystem {
  public get providerType(): ProviderType {
    return this.provider.providerType;
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(IFilesystemProviderSymbol) private readonly provider: IFilesystemProvider) { }

  private static sanitizePath(path: string): string {
    let sanitizedPath = path;
    if (!sanitizedPath.startsWith('/')) {
      sanitizedPath = `/${sanitizedPath}`;
    }
    if (sanitizedPath.endsWith('/')) {
      sanitizedPath = sanitizedPath.substring(0, sanitizedPath.length - 1);
    }

    return sanitizedPath;
  }

  public list(path: string): IItem[] {
    this.logger.debug(`Listing path '${path}'`);
    return this.provider.list(Filesystem.sanitizePath(path));
  }

  public stat(path: string, resolve: boolean): IItem | null {
    this.logger.debug(`Stat'ing${resolve ? ' and resolving' : ''} path '${path}'`);
    return this.provider.stat(Filesystem.sanitizePath(path), resolve);
  }
}
