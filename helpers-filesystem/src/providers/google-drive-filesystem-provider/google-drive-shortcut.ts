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
import NoShortcutTargetError from '../../errors/no-shortcut-target-error';
import type IShortcut from '../../ishortcut';
import ItemType from '../../item-type';
import GoogleDriveItem from './google-drive-item';

export default class GoogleDriveShortcut extends GoogleDriveItem implements IShortcut {
  private targetIdInternal?: string;

  public get targetId(): string {
    if (this.targetIdInternal === undefined) {
      const targetId = this.file.getTargetId();
      if (!targetId) {
        throw new NoShortcutTargetError(this.path);
      }

      this.targetIdInternal = targetId;
    }

    return this.targetIdInternal;
  }

  constructor(private readonly file: GoogleAppsScript.Drive.File, path: string,
    public readonly target: string) {
    super(file, ItemType.Shortcut, path);
  }
}
