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
import type IFromMethodOptions from '../providers/base-alasql-queryable-provider/from-method/ifrom-method-options';
import type IIntoMethodOptions from '../providers/base-alasql-queryable-provider/into-method/iinto-method-options';

interface FromMethodCallback {
  (data: unknown[], index: number, query: unknown): unknown;
}

interface FromMethod {
  (tableName: string, options: IFromMethodOptions, callback: FromMethodCallback, index: number,
    query: unknown): unknown | undefined
}

interface ColumnDefinition {
  columnid: string;
}

interface IntoMethodCallback {
  (data?: unknown): void;
}

interface IntoMethod {
  (tableName: string, options: IIntoMethodOptions, data: unknown[], columns: ColumnDefinition[],
    callback: IntoMethodCallback): unknown | undefined;
}

interface CustomFunction {
  (...parameters: unknown[]): unknown | undefined;
}

export interface AlaSQL {
  (sql: string, parameters?: unknown): unknown[] | null | undefined;
  fn: Record<string, CustomFunction>;
  from: Record<string, FromMethod>;
  into: Record<string, IntoMethod>;
}

declare const alasql: AlaSQL;
export default alasql;
