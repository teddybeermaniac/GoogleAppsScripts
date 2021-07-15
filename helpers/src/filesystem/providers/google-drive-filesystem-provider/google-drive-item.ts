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
import type { ItemType } from '../../item-type';
import type { IGoogleDriveItem } from './igoogle-drive-item';

type Item = {
  getId: () => string;
  getName: () => string;
  getDateCreated: () => GoogleAppsScript.Base.Date;
  getLastUpdated: () => GoogleAppsScript.Base.Date;
  getOwner: () => GoogleAppsScript.Drive.User;
  getViewers: () => GoogleAppsScript.Drive.User[];
  getEditors: () => GoogleAppsScript.Drive.User[];
};

export class GoogleDriveItem implements IGoogleDriveItem {
  private _id?: string;

  private _name?: string;

  private _creationDate?: Date;

  private _modificationDate?: Date;

  private _owner?: string;

  private _readers?: string[];

  private _editors?: string[];

  public get id(): string {
    if (this._id === undefined) {
      this._id = this.item.getId();
    }

    return this._id;
  }

  public get name(): string {
    if (this._name === undefined) {
      this._name = this.item.getName();
    }

    return this._name;
  }

  public get creationDate(): Date {
    if (this._creationDate === undefined) {
      this._creationDate = new Date(this.item.getDateCreated().valueOf());
    }

    return this._creationDate;
  }

  public get modificationDate(): Date {
    if (this._modificationDate === undefined) {
      this._modificationDate = new Date(this.item.getLastUpdated().valueOf());
    }

    return this._modificationDate;
  }

  public get owner(): string {
    if (this._owner === undefined) {
      this._owner = this.item.getOwner().getEmail();
    }

    return this._owner;
  }

  public get readers(): string[] {
    if (this._readers === undefined) {
      this._readers = this.item.getViewers().map((viewer) => viewer.getEmail());
    }

    return this._readers;
  }

  public get editors(): string[] {
    if (this._editors === undefined) {
      this._editors = this.item.getEditors().map((editor) => editor.getEmail());
    }

    return this._editors;
  }

  public constructor(private readonly item: Item, public readonly type: ItemType,
    public readonly path: string) { }
}
