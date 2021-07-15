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
import { Shortcut } from '../../shortcut';
import type { IGoogleDriveItem } from './igoogle-drive-item';

export class GoogleDriveShortcut extends Shortcut implements IGoogleDriveItem {
  private _id?: string;

  private _name?: string;

  private _targetId?: string;

  public get id(): string {
    if (this._id === undefined) {
      this._id = this.file.getId();
    }

    return this._id;
  }

  public get name(): string {
    if (this._name === undefined) {
      this._name = this.file.getName();
    }

    return this._name;
  }

  public get targetId(): string {
    if (this._targetId === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._targetId = this.file.getTargetId()!;
    }

    return this._targetId;
  }

  public constructor(private readonly file: GoogleAppsScript.Drive.File, path: string,
    target: string) {
    super(path, target);
  }
}
