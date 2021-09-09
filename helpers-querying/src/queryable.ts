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
import {
  IFile, IFilesystem, ItemType, TYPES as FILESYSTEM_TYPES,
} from 'helpers-filesystem';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { bindSymbol, TYPES as UTILITIES_TYPES } from 'helpers-utilities';
import {
  inject, injectable, interfaces, optional,
} from 'inversify';

import { NotAQueryableFileError, NotConfiguredFilesystemError } from './errors';
import type { IQueryable } from './iqueryable';
import type { ICurrentQueryableProvider } from './providers/icurrent-queryable-provider';
import type { IFileQueryableProvider } from './providers/ifile-queryable-provider';
import type { IQueryableProvider } from './providers/iqueryable-provider';
import { GoogleSpreadsheetQueryableProviderSymbol, IQueryableSymbol } from './symbols';

@injectable()
@bindSymbol(IQueryableSymbol)
export class Queryable implements IQueryable {
  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger,
    @inject(UTILITIES_TYPES.Container) private readonly container: interfaces.Container,
    @inject(FILESYSTEM_TYPES.IFilesystem) @optional()
    private readonly filesystem?: IFilesystem) { }

  public fromFile(path: string): IQueryableProvider {
    this.logger.information(`Creating a queryable from file '${path}'`);
    if (!this.filesystem) {
      throw new NotConfiguredFilesystemError();
    }

    const stat = this.filesystem.stat(path, true);
    if (!stat || stat.type === ItemType.Folder) {
      throw new NotAQueryableFileError(path);
    }

    const file = <IFile>stat;
    let provider: IFileQueryableProvider;
    switch (file.mimeType) {
      case 'application/vnd.google-apps.spreadsheet':
        this.logger.debug(`File '${path}' is a Google Spreadsheet`);
        provider = this.container.get<IFileQueryableProvider>(
          GoogleSpreadsheetQueryableProviderSymbol,
        );
        break;
      default:
        throw new NotAQueryableFileError(stat.path);
    }

    provider.loadFile(file);

    return provider;
  }

  public fromCurrentSpreadsheet(): IQueryableProvider {
    this.logger.information('Creating a queryable from current Google Spreadsheet');
    const provider = this.container.get<ICurrentQueryableProvider>(
      GoogleSpreadsheetQueryableProviderSymbol,
    );
    provider.loadCurrent();

    return provider;
  }
}
