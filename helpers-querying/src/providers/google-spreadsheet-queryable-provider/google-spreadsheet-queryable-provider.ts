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
import type FromMethodOptions from '../base-alasql-queryable-provider/from-method/from-method-options';
import intoMethod from '../base-alasql-queryable-provider/into-method/into-method';
import type IntoMethodOptions from '../base-alasql-queryable-provider/into-method/into-method-options';
import type ICurrentQueryableProvider from '../icurrent-queryable-provider';
import type IFileQueryableProvider from '../ifile-queryable-provider';
import ProviderType from '../provider-type';
import type DestinationRange from './destination-range';
import type NamedRange from './named-range';

@setBindMetadata(GoogleSpreadsheetQueryableProviderSymbol, Scope.Transient)
export default class GoogleSpreadsheetQueryableProvider extends BaseAlaSQLQueryableProvider
  implements IFileQueryableProvider, ICurrentQueryableProvider {
  private spreadsheetInternal: GoogleAppsScript.Spreadsheet.Spreadsheet | undefined;

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

  private getNamedRange(name: string, getData: boolean): NamedRange {
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
      name,
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
  public fromNamedRange(tableName: string, _options: FromMethodOptions): unknown[] {
    this.logger.debug(`Getting data from named range '${tableName}'`);
    const namedRange = this.getNamedRange(tableName, true);

    this.logger.trace(`Converting a range '${tableName}' to a list of objects`);
    return namedRange.data
      .map((row) => <unknown>Object.fromEntries(row
        .map((column, index) => [namedRange.names[index], column === '' ? undefined : column])
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
    const columnMapping: Record<string, number> = {};
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

  private prepareTargetRange(namedRange: NamedRange, append: boolean, length: number):
  DestinationRange {
    this.logger.trace('Preparing destination range');
    let originRow: number;
    let rows: number;
    if (append) {
      originRow = this.getLastDataRow(namedRange.sheet, namedRange.originRow,
        namedRange.originColumn, namedRange.rows, namedRange.columns) + 1;
      rows = namedRange.rows - (originRow - namedRange.originRow);
      if (rows === 0) {
        this.logger.warning('Range is full; expanding');
        const lastRowRange = namedRange.sheet.getRange(originRow - 1,
          namedRange.originColumn, 1, namedRange.columns);
        lastRowRange.insertCells(SpreadsheetApp.Dimension.ROWS);

        const addedRowsRange = namedRange.sheet.getRange(originRow,
          namedRange.originColumn, 1, namedRange.columns);
        addedRowsRange.copyTo(lastRowRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
        addedRowsRange.clearContent();

        rows = 1;
      }
    } else {
      originRow = namedRange.originRow;
      rows = namedRange.rows;
      namedRange.dataRange.clearContent();
    }

    while (length > rows) {
      const rowsToAdd = Math.min(rows, length - rows);
      this.logger.trace(`Inserting ${rowsToAdd} rows into range`);
      const addedRowsRange = namedRange.sheet.getRange(originRow,
        namedRange.originColumn, rowsToAdd, namedRange.columns);
      addedRowsRange.insertCells(SpreadsheetApp.Dimension.ROWS);
      rows += rowsToAdd;
    }

    return { originRow, rows };
  }

  private setValues(namedRange: NamedRange, destination: DestinationRange, append: boolean,
    mappedValues: unknown[][]): void {
    this.logger.trace(`Setting values of ${mappedValues.length} rows`);
    const destinationRange = namedRange.sheet.getRange(destination.originRow,
      namedRange.originColumn, Math.min(mappedValues.length, destination.rows), namedRange.columns);
    destinationRange.setValues(mappedValues);

    const wholeRows = append
      ? Math.max(destination.originRow - namedRange.originRow + destination.rows + 1)
      : Math.max(namedRange.rows, destination.rows + 1);
    this.logger.trace(`Setting '${namedRange.name}'' range dimension to have ${wholeRows} rows starting from row ${namedRange.originRow - 1}`);
    const wholeRange = namedRange.sheet.getRange(namedRange.originRow - 1, namedRange.originColumn,
      wholeRows, namedRange.columns);
    namedRange.namedRange.setRange(wholeRange);
  }

  @intoMethod('NAMEDRANGE')
  public intoNamedRange(tableName: string, options: IntoMethodOptions, columnNames: string[],
    data: unknown[]): void {
    this.logger.debug(`${options.append ? 'Appending' : 'Inserting'} data ${options.append ? 'to' : 'into'} named range '${tableName}'`);
    const namedRange = this.getNamedRange(tableName, false);

    const mappedValues = this.mapValues(tableName, namedRange.names, columnNames, data);
    const destinationRange = this.prepareTargetRange(namedRange, options.append,
      mappedValues.length);
    this.setValues(namedRange, destinationRange, options.append, mappedValues);
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
