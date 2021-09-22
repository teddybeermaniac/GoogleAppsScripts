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
import { isMoment } from 'moment';
import {
  Array, InstanceOf, Null, Number, Record, Static, String, Undefined, Union, Unknown,
} from 'runtypes';

export const InputRuntype = Union(
  Unknown.withGuard(isMoment),
  InstanceOf(Date),
  String,
  Number,
  Array(Union(Number, String)),
  Record({
    years: Number.optional(),
    year: Number.optional(),
    y: Number.optional(),
    months: Number.optional(),
    month: Number.optional(),
    M: Number.optional(),
    days: Number.optional(),
    day: Number.optional(),
    d: Number.optional(),
    dates: Number.optional(),
    date: Number.optional(),
    D: Number.optional(),
    hours: Number.optional(),
    hour: Number.optional(),
    h: Number.optional(),
    minutes: Number.optional(),
    minute: Number.optional(),
    m: Number.optional(),
    seconds: Number.optional(),
    second: Number.optional(),
    s: Number.optional(),
    milliseconds: Number.optional(),
    millisecond: Number.optional(),
    ms: Number.optional(),
  }),
  Null,
  Undefined,
);

type Input = Static<typeof InputRuntype>;
export default Input;
