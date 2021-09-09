# Google Spreadsheet SQL
This script adds a `SQL` function, which allows to query spreadsheet's named ranges using SQL.

## Installation
To install this script:
1. Remove the `.clasp.json` file.
2. Run `dry -v --dry-keep-package-json` to generate `package.json`.
3. Run `yarn` to install dependencies.
4. Run `yarn exec clasp login` to log-in into your Google account *(if you used **clasp** previously, you don't neet to do this)*.
5. Run `yarn exec clasp create -- --title GoogleSpreadsheetSQL` to create a new script on Google Apps Script.
6. Run `yarn run push` to build and push the script.
7. In your Spreadsheet's script file add the reference to the script created in step **5**.
8. Then in that script add:
```js
function SQL(query, cacheKey, ...parameters) {
  return GoogleSpreadsheetSQL.sql(query, cacheKey, ...parameters);
}

function CACHEKEY(...parameters) {
  return GoogleSpreadsheetSQL.cacheKey(...parameters);
}

function NOOP(..._) { }
```

## Example
Given a named range `People`:
| Id | Name    |
| -: | ------- |
|  1 | Michael |
|  2 | John    |

and a named range `Orders`:
| Id | PersonId | Date       | Value |
| -: | -------: | ---------- | ----: |
|  1 |        1 | 15/12/2020 |     2 |
|  2 |        1 | 17/12/2020 |    10 |
|  3 |        2 | 18/12/2020 |    15 |

and this formula **(remember to use `MATRIX OF SELECT`)**:
```excel
=SQL("MATRIX OF SELECT
    [People].[Name],
    COUNT(1) AS [Count],
    SUM([Orders].[Value]) AS [Value]
FROM
    NAMEDRANGE('People') AS [People]
INNER JOIN
    NAMEDRANGE('Orders') AS [Orders]
ON
    [Orders].[PersonId] = [People].[Id]
GROUP BY
    [People].[Id],
    [People].[Name]", NOOP(People, Orders))
```

the result will be:
|         |   |    |
| ------- | - | -- |
| Michael | 2 | 12 |
| John    | 1 | 15 |

The `NOOP` function is required, because Google Sheets won't recalculate the data unless the formula, or data in references which are a part of the formula change, but the script gets named ranges in the code, so the function ignores it. Of course you don't need to use the tables - you can for example put a reference to a cell with a date, updated daily by a trigger, to recalculate the query every day.

To enable internal caching, replace `NOOP` function with `CACHEKEY`.

## Notes
See [AlaSQL](https://github.com/agershun/alasql) for more details.
