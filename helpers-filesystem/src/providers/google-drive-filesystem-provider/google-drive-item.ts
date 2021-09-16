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
import type IItem from '../../iitem';
import type ItemType from '../../item-type';

type Item = {
  getId: () => string;
  getName: () => string;
  getDateCreated: () => GoogleAppsScript.Base.Date;
  getLastUpdated: () => GoogleAppsScript.Base.Date;
  getOwner: () => GoogleAppsScript.Drive.User;
  getViewers: () => GoogleAppsScript.Drive.User[];
  getEditors: () => GoogleAppsScript.Drive.User[];
};

export default class GoogleDriveItem implements IItem {
  private idInternal?: string;

  private nameInternal?: string;

  private creationDateInternal?: Date;

  private modificationDateInternal?: Date;

  private ownerInternal?: string;

  private readersInternal?: string[];

  private editorsInternal?: string[];

  public get id(): string {
    if (this.idInternal === undefined) {
      this.idInternal = this.item.getId();
    }

    return this.idInternal;
  }

  public get name(): string {
    if (this.nameInternal === undefined) {
      this.nameInternal = this.item.getName();
    }

    return this.nameInternal;
  }

  public get creationDate(): Date {
    if (this.creationDateInternal === undefined) {
      this.creationDateInternal = new Date(this.item.getDateCreated().valueOf());
    }

    return this.creationDateInternal;
  }

  public get modificationDate(): Date {
    if (this.modificationDateInternal === undefined) {
      this.modificationDateInternal = new Date(this.item.getLastUpdated().valueOf());
    }

    return this.modificationDateInternal;
  }

  public get owner(): string {
    if (this.ownerInternal === undefined) {
      this.ownerInternal = this.item.getOwner().getEmail();
    }

    return this.ownerInternal;
  }

  public get readers(): string[] {
    if (this.readersInternal === undefined) {
      this.readersInternal = this.item.getViewers().map((viewer) => viewer.getEmail());
    }

    return this.readersInternal;
  }

  public get editors(): string[] {
    if (this.editorsInternal === undefined) {
      this.editorsInternal = this.item.getEditors().map((editor) => editor.getEmail());
    }

    return this.editorsInternal;
  }

  constructor(private readonly item: Item, public readonly type: ItemType,
    public readonly path: string) {}
}
