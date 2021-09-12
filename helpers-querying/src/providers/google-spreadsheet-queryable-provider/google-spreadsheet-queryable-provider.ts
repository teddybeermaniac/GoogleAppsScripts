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
import { ICache, TYPES as CACHING_TYPES } from 'helpers-caching';
import type { IFile } from 'helpers-filesystem';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { bindSymbol, errors as utilities_errors, TYPES as UTILITIES_TYPES } from 'helpers-utilities';
import { inject, injectable, interfaces } from 'inversify';

import { InvalidQueryError, NotASpreadsheetContextError } from '../../errors';
import { GoogleSpreadsheetQueryableProviderSymbol } from '../../symbols';
import { BaseAlaSQLQueryableProvider } from '../base-alasql-queryable-provider/base-alasql-queryable-provider';
import { fromMethod } from '../base-alasql-queryable-provider/from-method/from-method';
import type { IFromMethodOptions } from '../base-alasql-queryable-provider/from-method/ifrom-method-options';
import type { IIntoMethodOptions } from '../base-alasql-queryable-provider/into-method/iinto-method-options';
import { intoMethod } from '../base-alasql-queryable-provider/into-method/into-method';
import type { ICurrentQueryableProvider } from '../icurrent-queryable-provider';
import type { IFileQueryableProvider } from '../ifile-queryable-provider';
import { ProviderType } from '../provider-type';

@injectable()
@bindSymbol(GoogleSpreadsheetQueryableProviderSymbol)
export class GoogleSpreadsheetQueryableProvider extends BaseAlaSQLQueryableProvider
  implements IFileQueryableProvider, ICurrentQueryableProvider {
  private _spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet | undefined;

  private initialized = false;

  public get providerType(): ProviderType {
    return ProviderType.GoogleSpreadsheet;
  }

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache,
    @inject(UTILITIES_TYPES.Container) container: interfaces.Container) {
    super(logger, cache, container);
  }

  private get spreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    if (!this.initialized || this._spreadsheet === undefined) {
      throw new utilities_errors.InitializationError('Not initialized');
    }

    return this._spreadsheet;
  }

  private getLastDataRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, originRow: number,
    originColumn: number, rows: number, columns: number): number {
    this.logger.trace('Getting last data row');
    const lastRowRange = sheet.getRange(originRow + rows - 1, originColumn, 1, columns);
    const lastRowData = lastRowRange.getValues();
    if (lastRowData[0]!.some((column) => column !== '')) {
      return lastRowRange.getRow();
    }

    return lastRowRange.getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
  }

  private getNamedRange(name: string, getData: boolean): {
    sheet: GoogleAppsScript.Spreadsheet.Sheet, namedRange: GoogleAppsScript.Spreadsheet.NamedRange,
    dataRange: GoogleAppsScript.Spreadsheet.Range, names: string[], data: any[][],
    originRow: number, originColumn: number, rows: number, columns: number
  } {
    this.logger.trace(`Reading named range '${name}'`);
    const namedRange = this.spreadsheet.getNamedRanges()
      .filter((range) => range.getName() === name)[0];
    if (!namedRange) {
      throw new InvalidQueryError(`Named range '${name}' does not exist`);
    }

    const range = namedRange.getRange();
    const sheet = range.getSheet();

    let originRow = range.getRow();
    let rows = range.getNumRows();
    if (rows <= 1) {
      throw new InvalidQueryError(`Named range '${name}' is not valid - not enough rows`);
    }
    const sheetRows = sheet.getMaxRows();
    if (originRow + rows - 1 > sheetRows) {
      this.logger.warning(`Named range '${name}' rows go outside of sheet '${sheet.getName()}'`);
      rows = sheetRows - originRow + 1;
    }

    const originColumn = range.getColumn();
    let columns = range.getNumColumns();
    if (columns < 1) {
      throw new InvalidQueryError(`Named range '${name}' is not valid - not enough columns`);
    }
    const sheetColumns = sheet.getMaxColumns();
    if (originColumn + columns - 1 > sheetColumns) {
      this.logger.warning(`Named range '${name}' columns go outside of sheet '${sheet.getName()}'`);
      columns = sheetColumns - originColumn + 1;
    }

    const headerRange = sheet.getRange(originRow, originColumn, 1, columns);
    const headerData = headerRange.getValues();
    if (!headerData || !headerData[0] || headerData[0].every((column) => column === '')) {
      throw new InvalidQueryError(`Named range '${name}' is not valid - empty header cell`);
    }
    const names = <string[]>headerData[0];

    originRow += 1;
    rows -= 1;
    const dataRange = sheet.getRange(originRow, originColumn, rows, columns);
    let data: any[][] = [];
    if (getData) {
      const lastDataRow = this.getLastDataRow(sheet, originRow, originColumn, rows, columns);
      const dataRows = lastDataRow - originRow + 1;
      this.logger.trace(`Reading ${dataRows} rows of data from named range '${name}'`);
      if (dataRows > 0) {
        data = sheet.getRange(originRow, originColumn, dataRows, columns).getValues();
      }
    }

    return {
      sheet,
      namedRange,
      dataRange,
      names,
      data,
      originRow,
      originColumn,
      rows,
      columns,
    };
  }

  @fromMethod('NAMEDRANGE')
  public fromNamedRange(tableName: string, _?: IFromMethodOptions): any[] {
    this.logger.debug(`Getting data from named range '${tableName}'`);
    const { names, data } = this.getNamedRange(tableName, true);

    this.logger.trace(`Converting a range '${tableName}' to a list of objects`);
    return data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .map((row) => Object.fromEntries(row
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .map((column, index) => [names[index]!, column === '' ? null : column])
        .filter((entry) => entry[0] !== '')));
  }

  @intoMethod('NAMEDRANGE')
  public intoNamedRange(tableName: string, options: IIntoMethodOptions, columnNames: string[],
    data: any[]): void {
    this.logger.debug(`${options.append ? 'Appending' : 'Inserting'} data ${options.append ? 'to' : 'into'} range '${tableName}'`);
    const {
      sheet, dataRange, namedRange, names, originRow, originColumn, rows, columns,
    } = this.getNamedRange(tableName, false);

    const unknownColumns = columnNames.filter((column) => column === '' || !names.includes(column));
    if (unknownColumns.length > 0) {
      throw new InvalidQueryError(`Unknown columns '${unknownColumns.join('\', \'')}'`);
    }

    const missingColumns = names.filter((column) => column === '' || !columnNames.includes(column));
    if (missingColumns.length > 0) {
      throw new InvalidQueryError(`Missing columns '${missingColumns.join('\', \'')}'`);
    }

    this.logger.trace(`Converting a list of objects to range '${tableName}'`);
    const columnMapping = columnNames.reduce((mapping, column) => {
      // eslint-disable-next-line no-param-reassign
      mapping[column] = names.indexOf(column);

      return mapping;
    }, <{ [index: string]: number; }>{});

    const mappedValues: any[][] = [];
    data.forEach((row) => {
      const mappedRow = Object.entries(row).reduce((mapped, [name, value]) => {
        // eslint-disable-next-line no-param-reassign
        mapped[columnMapping[name]!] = value;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return mapped;
      }, <any[]>[]);
      mappedValues.push(mappedRow);
    });

    this.logger.trace('Preparing destination range');
    let destinationOriginRow: number;
    let destinationRows: number;
    if (options.append) {
      destinationOriginRow = this.getLastDataRow(sheet, originRow, originColumn, rows,
        columns) + 1;
      destinationRows = rows - (destinationOriginRow - originRow);
      if (destinationRows === 0) {
        this.logger.warning('Range is full; expanding');
        const lastRowRange = sheet.getRange(destinationOriginRow - 1, originColumn, 1, columns);
        lastRowRange.insertCells(SpreadsheetApp.Dimension.ROWS);

        const newRowRange = sheet.getRange(destinationOriginRow, originColumn, 1, columns);
        newRowRange.copyTo(lastRowRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
        newRowRange.clearContent();

        destinationRows = 1;
      }
    } else {
      destinationOriginRow = originRow;
      destinationRows = rows;
      dataRange.clearContent();
    }

    while (mappedValues.length > destinationRows) {
      const rowsToAdd = Math.min(destinationRows, mappedValues.length - destinationRows);
      this.logger.trace(`Inserting ${rowsToAdd} rows into range`);
      const newRowsRange = sheet.getRange(destinationOriginRow, originColumn, rowsToAdd, columns);
      newRowsRange.insertCells(SpreadsheetApp.Dimension.ROWS);
      destinationRows += rowsToAdd;
    }

    this.logger.trace(`Setting values of ${mappedValues.length} rows`);
    const destinationRange = sheet.getRange(destinationOriginRow, originColumn,
      Math.min(mappedValues.length, destinationRows), columns);
    destinationRange.setValues(mappedValues);

    const wholeRows = options.append
      ? Math.max(destinationOriginRow - originRow + destinationRows + 1)
      : Math.max(rows, destinationRows + 1);
    this.logger.trace(`Setting '${tableName}'' range dimension to have ${wholeRows} rows starting from row ${originRow - 1}`);
    const wholeRange = sheet.getRange(originRow - 1, originColumn, wholeRows, columns);
    namedRange.setRange(wholeRange);
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
