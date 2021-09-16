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
import { Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import type { IFilesystem } from './ifilesystem';
import type { IItem } from './iitem';
import type { IFilesystemProvider } from './providers/ifilesystem-provider';
import type { ProviderType } from './providers/provider-type';
import { IFilesystemProviderSymbol, IFilesystemSymbol } from './symbols';

@setBindMetadata(IFilesystemSymbol, Scope.Singleton)
export class Filesystem implements IFilesystem {
  public readonly providerType: ProviderType;

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(IFilesystemProviderSymbol) private readonly provider: IFilesystemProvider) {
    this.providerType = this.provider.providerType;
  }

  private sanitizePath(path: string): string {
    this.logger.trace(`Sanitizing path '${path}'`);
    let sanitizedPath = path;
    if (!sanitizedPath.startsWith('/')) {
      sanitizedPath = `/${sanitizedPath}`;
    }
    if (sanitizedPath.endsWith('/')) {
      sanitizedPath = sanitizedPath.slice(0, Math.max(0, sanitizedPath.length - 1));
    }

    this.logger.trace(`Sanitized path '${sanitizedPath}'`);
    return sanitizedPath;
  }

  public list(path: string): IItem[] {
    this.logger.debug(`Listing path '${path}'`);
    return this.provider.list(this.sanitizePath(path));
  }

  public stat(path: string, resolve?: boolean): IItem | undefined {
    this.logger.debug(`Stat'ing${resolve ? ' and resolving' : ''} path '${path}'`);
    return this.provider.stat(this.sanitizePath(path), resolve);
  }
}
