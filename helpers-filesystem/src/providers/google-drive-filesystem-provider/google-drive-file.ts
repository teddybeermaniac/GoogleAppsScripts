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
import type IFile from '../../ifile';
import ItemType from '../../item-type';
import GoogleDriveItem from './google-drive-item';

export default class GoogleDriveFile extends GoogleDriveItem implements IFile {
  private sizeInternal: number | undefined;

  private mimeTypeInternal: string | undefined;

  public get size(): number {
    if (this.sizeInternal === undefined) {
      this.sizeInternal = this.file.getSize();
    }

    return this.sizeInternal;
  }

  public get mimeType(): string {
    if (this.mimeTypeInternal === undefined) {
      this.mimeTypeInternal = this.file.getMimeType();
    }

    return this.mimeTypeInternal;
  }

  constructor(private readonly file: GoogleAppsScript.Drive.File, path: string) {
    super(file, ItemType.File, path);
  }
}
