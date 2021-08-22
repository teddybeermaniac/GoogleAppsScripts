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
  exporting, logging, querying, utilities,
} from 'helpers';
import { inject, injectable } from 'inversify';

import { SpreadsheetSQLSymbol } from './symbols';

@injectable()
@utilities.bindSymbol(SpreadsheetSQLSymbol)
export class SpreadsheetSQL {
  public constructor(@inject(logging.TYPES.ILogger) private readonly logger: logging.ILogger,
    @inject(querying.TYPES.IQueryable) private readonly query: querying.IQueryable) {
  }

  @exporting.exportMethod(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public SQL(query: string, ...parameters: any[]): any[][] {
    this.logger.debug(`Running query '${query}'`);
    const queryable = this.query.fromCurrentSpreadsheet();

    return queryable.queryAny(query, ...parameters);
  }
}
