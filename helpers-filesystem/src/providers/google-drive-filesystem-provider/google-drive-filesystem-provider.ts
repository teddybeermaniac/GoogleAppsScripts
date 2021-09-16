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
import { SimpleIterator } from 'helpers-iteration';
import { ILogger, TYPES as LOGGING_TYPES } from 'helpers-logging';
import { Scope, setBindMetadata } from 'helpers-utilities';
import { inject } from 'inversify';

import { DuplicatePathError } from '../../errors/duplicate-path-error';
import { InternalProviderError } from '../../errors/internal-provider-error';
import { InvalidPathError } from '../../errors/invalid-path-error';
import { NoShortcutTargetError } from '../../errors/no-shortcut-target-error';
import { NotFoundPathError } from '../../errors/not-found-path-error';
import type { IItem } from '../../iitem';
import { IFilesystemProviderSymbol } from '../../symbols';
import type { IFilesystemProvider } from '../ifilesystem-provider';
import { ProviderType } from '../provider-type';
import { GoogleDriveFile } from './google-drive-file';
import { GoogleDriveFolder } from './google-drive-folder';
import { GoogleDriveShortcut } from './google-drive-shortcut';

@setBindMetadata(IFilesystemProviderSymbol, Scope.Singleton)
export class GoogleDriveFilesystemProvider implements IFilesystemProvider {
  private readonly FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

  private readonly SHORTCUT_MIME_TYPE = 'application/vnd.google-apps.shortcut';

  public readonly providerType = ProviderType.GoogleDrive;

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger) {}

  private getPathFromId(id: string): string {
    this.logger.trace(`Getting path for item with id '${id}'`);
    const rootFolder = DriveApp.getRootFolder();
    if (id === rootFolder.getId()) {
      this.logger.trace(`Item with id '${id}' is the root folder`);
      return '/';
    }

    let item: {
      getId: () => string,
      getName: () => string,
      getParents: () => GoogleAppsScript.Drive.FolderIterator
    };
    item = DriveApp.getFileById(id);
    if (!item) {
      throw new InternalProviderError(`Item with id '${id}' does not exist`);
    }

    let path = `/${item.getName()}`;
    let parents = item.getParents();
    while (parents.hasNext()) {
      item = parents.next();
      if (item.getId() === rootFolder.getId()) {
        break;
      }

      path = `/${item.getName()}${path}`;
      parents = item.getParents();
    }

    return path;
  }

  private getFile(searchFolder: GoogleAppsScript.Drive.Folder, name: string, path: string):
  GoogleAppsScript.Drive.File {
    const fileIterator = searchFolder.getFilesByName(name);
    if (!fileIterator.hasNext()) {
      if (searchFolder.getFoldersByName(name).hasNext()) {
        throw new InvalidPathError(path);
      }

      throw new NotFoundPathError(path);
    }

    const file = fileIterator.next();
    if (fileIterator.hasNext()) {
      throw new DuplicatePathError(path, name);
    }

    return file;
  }

  private getFolder(searchFolder: GoogleAppsScript.Drive.Folder, name: string, path: string):
  GoogleAppsScript.Drive.Folder {
    const folderIterator = searchFolder.getFoldersByName(name);
    if (!folderIterator.hasNext()) {
      if (searchFolder.getFilesByName(name).hasNext()) {
        throw new InvalidPathError(path);
      }

      throw new NotFoundPathError(path);
    }

    const folder = folderIterator.next();
    if (folderIterator.hasNext()) {
      throw new DuplicatePathError(path, name);
    }

    return folder;
  }

  private getIdFromPath(path: string, folder?: boolean): string {
    this.logger.trace(`Getting id for item with path '${path}'`);
    const pathElements = path.split('/').slice(1);
    const lastElement = pathElements.slice(-1)[0];
    if (!lastElement) {
      throw new InvalidPathError(path);
    }

    let searchFolder = DriveApp.getRootFolder();
    for (const element of pathElements.slice(0, -1)) {
      searchFolder = this.getFolder(searchFolder, element, path);
    }

    if (folder) {
      return this.getFolder(searchFolder, lastElement, path).getId();
    }

    return this.getFile(searchFolder, lastElement, path).getId();
  }

  public list(path: string): IItem[] {
    this.logger.trace(`Listing path '${path}'`);
    const rootFolder = DriveApp.getFolderById(this.getIdFromPath(path, true));
    if (!rootFolder) {
      throw new InvalidPathError(path);
    }

    const items: IItem[] = [];
    this.logger.trace('Getting folders');
    for (const folder of new SimpleIterator(rootFolder.getFolders())) items.push(new GoogleDriveFolder(folder, `${path}${folder.getName()}`));
    this.logger.trace('Getting files and shortcuts');
    for (const file of new SimpleIterator(rootFolder.getFiles())) {
      if (file.getMimeType() === this.SHORTCUT_MIME_TYPE) {
        items.push(new GoogleDriveFile(file, `${path}/${file.getName()}`));
      } else {
        const targetId = file.getTargetId();
        if (!targetId) {
          throw new NoShortcutTargetError(path);
        }

        items.push(new GoogleDriveShortcut(file, `${path}/${file.getName()}`,
          this.getPathFromId(targetId)));
      }
    }
    items.sort((a, b) => {
      if (a.name === b.name) {
        return 0;
      }

      return a.name < b.name ? -1 : 1;
    });

    return items;
  }

  public stat(path: string, resolve?: boolean): IItem | undefined {
    this.logger.trace(`Stat'ing path '${path}'`);
    let id: string;
    try {
      id = this.getIdFromPath(path);
    } catch (error) {
      if (error instanceof NotFoundPathError) {
        return undefined;
      }

      throw error;
    }

    let file = DriveApp.getFileById(id);
    let mimeType = file.getMimeType();
    if (mimeType === this.SHORTCUT_MIME_TYPE) {
      this.logger.trace(`Path '${path}' is a shortcut`);
      const targetId = file.getTargetId();
      if (!targetId) {
        throw new NoShortcutTargetError(path);
      }

      if (resolve) {
        file = DriveApp.getFileById(targetId);
        mimeType = file.getMimeType();
      } else {
        return new GoogleDriveShortcut(file, path, this.getPathFromId(targetId));
      }
    }

    if (mimeType === this.FOLDER_MIME_TYPE) {
      this.logger.trace(`Path '${path}' is a folder`);
      const folder = DriveApp.getFolderById(id);

      return new GoogleDriveFolder(folder, path);
    }

    this.logger.trace(`Path '${path}' is a file with MIME type '${mimeType}'`);
    return new GoogleDriveFile(file, path);
  }
}
