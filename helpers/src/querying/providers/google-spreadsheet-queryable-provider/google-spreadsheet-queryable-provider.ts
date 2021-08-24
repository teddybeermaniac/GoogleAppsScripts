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
import { inject, injectable } from 'inversify';

import { ICache, TYPES as CACHING_TYPES } from '../../../caching';
import type { IFile } from '../../../filesystem';
import { ILogger, TYPES as LOGGING_TYPES } from '../../../logging';
import { bindSymbol, errors as utilities_errors } from '../../../utilities';
import { InvalidQueryError, NotASpreadsheetContextError } from '../../errors';
import { GoogleSpreadsheetQueryableProviderSymbol } from '../../symbols';
import { BaseAlaSQLQueryableProvider } from '../base-alasql-queryable-provider/base-alasql-queryable-provider';
import { fromMethod } from '../base-alasql-queryable-provider/from-method';
import type { ICurrentQueryableProvider } from '../icurrent-queryable-provider';
import type { IFileQueryableProvider } from '../ifile-queryable-provider';
import { ProviderType } from '../provider-type';

@injectable()
@bindSymbol(GoogleSpreadsheetQueryableProviderSymbol)
export class GoogleSpreadsheetQueryableProvider extends BaseAlaSQLQueryableProvider
  implements IFileQueryableProvider, ICurrentQueryableProvider {
  private _spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet | undefined;

  private initialized = false;

  // eslint-disable-next-line class-methods-use-this
  public get providerType(): ProviderType {
    return ProviderType.GoogleSpreadsheet;
  }

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache) {
    super(logger, cache);
  }

  private get spreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    if (!this.initialized || this._spreadsheet === undefined) {
      throw new utilities_errors.InitializationError('Not initialized');
    }

    return this._spreadsheet;
  }

  @fromMethod('NAMEDRANGE')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fromNamedRange(tableName: string, callback: (data: any[]) => any[]): any[] {
    this.logger.trace(`Getting contents of named range '${tableName}'`);
    const range = this.spreadsheet.getRangeByName(tableName);
    if (!range) {
      throw new InvalidQueryError(`Named range '${tableName}' does not exist`);
    }

    const data = range.getValues();
    if (!data || !data[0] || !data[0][0] || data[0].every((column) => column === '')) {
      throw new InvalidQueryError(`Named range '${tableName}' is not valid`);
    }

    const names = data[0].map((column) => <string>column);
    const values = data.slice(1);

    this.logger.trace(`Converting named range '${tableName}' to a list of objects`);
    let filterEmpty = true;
    const processedData = values
      .reverse()
      .filter((row) => {
        if (filterEmpty) {
          if (row.every((column) => column === '')) {
            return false;
          }

          filterEmpty = false;
        }

        return true;
      }).reverse()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map((row) => Object.fromEntries(row.map((column, index) => [names[index]!, column])));

    if (callback) {
      return callback(processedData);
    }

    return processedData;
  }

  public loadFile(file: IFile): void {
    this.logger.trace(`Loading file '${file.path}'`);
    if (this.initialized) {
      throw new utilities_errors.InitializationError('Already initialized');
    }

    this._spreadsheet = SpreadsheetApp.openById(file.id);
    this.initialized = true;
  }

  public loadCurrent(): void {
    this.logger.trace('Loading current spreadsheet');
    if (this.initialized) {
      throw new utilities_errors.InitializationError('Already initialized');
    }

    this._spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!this._spreadsheet) {
      throw new NotASpreadsheetContextError();
    }

    this.initialized = true;
  }
}
