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
import {
  AlreadyInitializedError, NotInitializedError, Scope, setBindMetadata, TYPES as UTILITIES_TYPES,
} from 'helpers-utilities';
import { inject, interfaces } from 'inversify';

import InvalidQueryError from '../../errors/invalid-query-error';
import NotASpreadsheetContextError from '../../errors/not-a-spreadsheet-context-error';
import { GoogleSpreadsheetQueryableProviderSymbol } from '../../symbols';
import BaseAlaSQLQueryableProvider from '../base-alasql-queryable-provider/base-alasql-queryable-provider';
import fromMethod from '../base-alasql-queryable-provider/from-method/from-method';
import type IFromMethodOptions from '../base-alasql-queryable-provider/from-method/ifrom-method-options';
import type IIntoMethodOptions from '../base-alasql-queryable-provider/into-method/iinto-method-options';
import intoMethod from '../base-alasql-queryable-provider/into-method/into-method';
import type ICurrentQueryableProvider from '../icurrent-queryable-provider';
import type IFileQueryableProvider from '../ifile-queryable-provider';
import ProviderType from '../provider-type';

@setBindMetadata(GoogleSpreadsheetQueryableProviderSymbol, Scope.Transient)
export default class GoogleSpreadsheetQueryableProvider extends BaseAlaSQLQueryableProvider
  implements IFileQueryableProvider, ICurrentQueryableProvider {
  private spreadsheetInternal?: GoogleAppsScript.Spreadsheet.Spreadsheet;

  private initialized = false;

  public readonly providerType = ProviderType.GoogleSpreadsheet;

  private get spreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    if (!this.initialized || !this.spreadsheetInternal) {
      throw new NotInitializedError('GoogleSpreadsheetQueryableProvider');
    }

    return this.spreadsheetInternal;
  }

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(@inject(LOGGING_TYPES.ILogger) logger: ILogger,
    @inject(CACHING_TYPES.ICache) cache: ICache,
    @inject(UTILITIES_TYPES.Container) container: interfaces.Container) {
    super(logger, cache, container);
  }

  private getLastDataRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, originRow: number,
    originColumn: number, rows: number, columns: number): number {
    this.logger.trace('Getting last data row');
    const lastRowRange = sheet.getRange(originRow + rows - 1, originColumn, 1, columns);
    const lastRowData = lastRowRange.getValues();
    if (lastRowData[0] && lastRowData[0].some((column) => column !== '')) {
      return lastRowRange.getRow();
    }

    return lastRowRange.getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
  }

  private getNamedRange(name: string, getData: boolean): {
    sheet: GoogleAppsScript.Spreadsheet.Sheet, namedRange: GoogleAppsScript.Spreadsheet.NamedRange,
    dataRange: GoogleAppsScript.Spreadsheet.Range, names: string[], data: unknown[][],
    originRow: number, originColumn: number, rows: number, columns: number
  } {
    this.logger.trace(`Reading named range '${name}'`);
    const namedRange = this.spreadsheet.getNamedRanges()
      .find((range) => range.getName() === name);
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
      this.logger.warning(() => `Named range '${name}' rows go outside of sheet '${sheet.getName()}'`);
      rows = sheetRows - originRow + 1;
    }

    const originColumn = range.getColumn();
    let columns = range.getNumColumns();
    if (columns < 1) {
      throw new InvalidQueryError(`Named range '${name}' is not valid - not enough columns`);
    }
    const sheetColumns = sheet.getMaxColumns();
    if (originColumn + columns - 1 > sheetColumns) {
      this.logger.warning(() => `Named range '${name}' columns go outside of sheet '${sheet.getName()}'`);
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
    let data: unknown[][] = [];
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
  public fromNamedRange(tableName: string, _options?: IFromMethodOptions): unknown[] {
    this.logger.debug(`Getting data from named range '${tableName}'`);
    const { names, data } = this.getNamedRange(tableName, true);

    this.logger.trace(`Converting a range '${tableName}' to a list of objects`);
    return data
      .map((row) => <unknown>Object.fromEntries(row
        .map((column, index) => [names[index], column === '' ? undefined : column])
        .filter((entry) => entry[0])));
  }

  private mapValues(tableName: string, names: string[], columnNames: string[], data: unknown[]):
  unknown[][] {
    const unknownColumns = columnNames.filter((column) => column === '' || !names.includes(column));
    if (unknownColumns.length > 0) {
      throw new InvalidQueryError(`Unknown columns '${unknownColumns.join('\', \'')}'`);
    }

    const missingColumns = names.filter((column) => column === '' || !columnNames.includes(column));
    if (missingColumns.length > 0) {
      throw new InvalidQueryError(`Missing columns '${missingColumns.join('\', \'')}'`);
    }

    this.logger.trace(`Converting a list of objects to range '${tableName}'`);
    const columnMapping: { [index: string]: number; } = {};
    for (const [index, column] of names.entries()) {
      columnMapping[column] = index;
    }

    const mappedValues: unknown[][] = [];
    for (const row of data) {
      const mappedRow: unknown[] = [];
      for (const [name, value] of Object.entries(<Record<string, unknown>>row)) {
        const mappedName = columnMapping[name];
        if (!mappedName) {
          throw new InvalidQueryError(`Unknown column '${name}'`);
        }
        mappedRow[mappedName] = value;
      }
      mappedValues.push(mappedRow);
    }

    return mappedValues;
  }

  private prepareTargetRange(append: boolean, sheet: GoogleAppsScript.Spreadsheet.Sheet,
    originRow: number, originColumn: number, rows: number, columns: number,
    dataRange: GoogleAppsScript.Spreadsheet.Range, length: number):
    { destinationOriginRow: number, destinationRows: number; } {
    this.logger.trace('Preparing destination range');
    let destinationOriginRow: number;
    let destinationRows: number;
    if (append) {
      destinationOriginRow = this.getLastDataRow(sheet, originRow, originColumn, rows,
        columns) + 1;
      destinationRows = rows - (destinationOriginRow - originRow);
      if (destinationRows === 0) {
        this.logger.warning('Range is full; expanding');
        const lastRowRange = sheet.getRange(destinationOriginRow - 1, originColumn, 1, columns);
        lastRowRange.insertCells(SpreadsheetApp.Dimension.ROWS);

        const addedRowsRange = sheet.getRange(destinationOriginRow, originColumn, 1, columns);
        addedRowsRange.copyTo(lastRowRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
        addedRowsRange.clearContent();

        destinationRows = 1;
      }
    } else {
      destinationOriginRow = originRow;
      destinationRows = rows;
      dataRange.clearContent();
    }

    while (length > destinationRows) {
      const rowsToAdd = Math.min(destinationRows, length - destinationRows);
      this.logger.trace(`Inserting ${rowsToAdd} rows into range`);
      const addedRowsRange = sheet.getRange(destinationOriginRow, originColumn, rowsToAdd, columns);
      addedRowsRange.insertCells(SpreadsheetApp.Dimension.ROWS);
      destinationRows += rowsToAdd;
    }

    return { destinationOriginRow, destinationRows };
  }

  private setValues(tableName: string, sheet: GoogleAppsScript.Spreadsheet.Sheet,
    namedRange: GoogleAppsScript.Spreadsheet.NamedRange, append: boolean, mappedValues: unknown[][],
    originRow: number, originColumn: number, rows: number, columns: number,
    destinationOriginRow: number, destinationRows: number): void {
    this.logger.trace(`Setting values of ${mappedValues.length} rows`);
    const destinationRange = sheet.getRange(destinationOriginRow, originColumn,
      Math.min(mappedValues.length, destinationRows), columns);
    destinationRange.setValues(mappedValues);

    const wholeRows = append
      ? Math.max(destinationOriginRow - originRow + destinationRows + 1)
      : Math.max(rows, destinationRows + 1);
    this.logger.trace(`Setting '${tableName}'' range dimension to have ${wholeRows} rows starting from row ${originRow - 1}`);
    const wholeRange = sheet.getRange(originRow - 1, originColumn, wholeRows, columns);
    namedRange.setRange(wholeRange);
  }

  @intoMethod('NAMEDRANGE')
  public intoNamedRange(tableName: string, options: IIntoMethodOptions, columnNames: string[],
    data: unknown[]): void {
    this.logger.debug(`${options.append ? 'Appending' : 'Inserting'} data ${options.append ? 'to' : 'into'} named range '${tableName}'`);
    const {
      sheet, dataRange, namedRange, names, originRow, originColumn, rows, columns,
    } = this.getNamedRange(tableName, false);

    const mappedValues = this.mapValues(tableName, names, columnNames, data);
    const { destinationOriginRow, destinationRows } = this.prepareTargetRange(options.append, sheet,
      originRow, originColumn, rows, columns, dataRange, mappedValues.length);
    this.setValues(tableName, sheet, namedRange, options.append, mappedValues, originRow,
      originColumn, rows, columns, destinationOriginRow, destinationRows);
  }

  public loadFile(file: IFile): void {
    this.logger.trace(`Loading file '${file.path}'`);
    if (this.initialized) {
      throw new AlreadyInitializedError('GoogleSpreadsheetQueryableProvider');
    }

    this.spreadsheetInternal = SpreadsheetApp.openById(file.id);

    this.initialized = true;
  }

  public loadCurrent(): void {
    this.logger.trace('Loading current spreadsheet');
    if (this.initialized) {
      throw new AlreadyInitializedError('GoogleSpreadsheetQueryableProvider');
    }

    this.spreadsheetInternal = SpreadsheetApp.getActiveSpreadsheet();
    if (!this.spreadsheetInternal) {
      throw new NotASpreadsheetContextError();
    }

    this.initialized = true;
  }
}
