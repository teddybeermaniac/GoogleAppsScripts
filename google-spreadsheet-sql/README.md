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
function SQL(query, cacheKey, parameters) {
  return GoogleSpreadsheetSQL.SQL(query, cacheKey, parameters);
}

function CACHEKEY(...parameters) {
  return GoogleSpreadsheetSQL.CACHEKEY(...parameters);
}

function NOCACHE(..._) { }
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
|  4 |        2 | 19/12/2020 |    20 |
|  5 |        1 | 20/12/2020 |     1 |

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
WHERE
    [Orders].[Value] <= $MaxValue
    AND [Orders].[Value] >= $MinValue
GROUP BY
    [People].[Id],
    [People].[Name]", NOCACHE(People, Orders), { "MinValue", 2; "MaxValue", 15 })
```

the result will be:
|         |   |    |
| ------- | - | -- |
| Michael | 2 | 12 |
| John    | 1 | 15 |

The `NOCACHE` function is required, because Google Sheets won't recalculate the data unless the formula, or data in references which are a part of the formula change, but the script gets named ranges in the code, so the function ignores it. Of course you don't need to use the tables - you can for example put a reference to a cell with a date, updated daily by a trigger, to recalculate the query every day.

To enable internal caching, replace `NOCACHE` function with `CACHEKEY`.

Parameters are passed as a two dimensional array, with each row containing the name of the parameter and the value as described [here](https://support.google.com/docs/answer/6208276) e.g.
```excel
{ "Param1", 1; "Param2", "2" }
```

## Notes
See [AlaSQL](https://github.com/agershun/alasql) for more details.
