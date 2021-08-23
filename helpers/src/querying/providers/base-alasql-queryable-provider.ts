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
import alasql from 'alasql';
import { injectable } from 'inversify';

import type { ILogger } from '../../logging';
import type { IQueryableProvider } from './iqueryable-provider';
import type { ProviderType } from './provider-type';

@injectable()
export abstract class BaseAlaSQLQueryableProvider implements IQueryableProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract getTable(name: string): any[] | null;

  public abstract get providerType(): ProviderType;

  constructor(protected readonly logger: ILogger) { }

  private getTables(query: string): string[] {
    this.logger.debug('Getting all tables used in query');
    const tables = query.match(/(?<=(FROM|JOIN)\s+\[?)[A-Za-z0-9_!]+(?=\]?)?/gi);
    if (!tables) {
      this.logger.debug('Query is not using any tables');
      return [];
    }

    const withs = query.match(/(?<=WITH\s+\[?)[A-Za-z0-9_]+(?=\]?)?/gi);
    if (withs) {
      this.logger.debug(`Query is using '${withs.join('\', \'')}' withs`);
    }
    const aliases = query.match(/(?<=AS\s+\[?)[A-Za-z0-9_]+(?=\]?)?/gi);
    if (aliases) {
      this.logger.debug(`Query is using '${aliases.join('\', \'')}' aliases`);
    }

    const usedTables = tables.filter((table) => !withs?.includes(table)
      && !aliases?.includes(table));
    this.logger.debug(`Query is using '${usedTables.join('\', \'')}' tables`);

    return usedTables;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processQuery(query: string, parameters: any[]): [string, any[]] {
    this.logger.debug(`Processing query '${query}'`);
    const tables = this.getTables(query);

    let processedQuery = query;
    let processedParameters = parameters;

    const withQueries: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withParameters: any[] = [];
    tables?.forEach((table) => {
      const data = this.getTable(table);

      if (data) {
        withQueries.push(`[${table}] AS (SELECT * FROM ?)`);
        withParameters.push(data);
      }
    });

    if (withQueries.length > 0) {
      if (/^WITH/i.test(processedQuery)) {
        processedQuery = `,${processedQuery.substring(4)}`;
      }
      processedQuery = `WITH ${withQueries.join(', ')} ${processedQuery}`;
      processedParameters = withParameters.concat(processedParameters);
    }

    return [processedQuery, processedParameters];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public query<TRow>(query: string, ...parameters: any[]): TRow[] {
    this.logger.debug('Querying a model');
    const [processedQuery, processedParameters] = this.processQuery(query, parameters);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (<any[]>alasql(processedQuery, processedParameters)).map((row) => <TRow>row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public queryAny(query: string, ...parameters: any[]): any[][] {
    this.logger.debug('Querying any');
    const [processedQuery, processedParameters] = this.processQuery(query, parameters);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <any[][]>alasql(processedQuery, processedParameters);
  }
}
