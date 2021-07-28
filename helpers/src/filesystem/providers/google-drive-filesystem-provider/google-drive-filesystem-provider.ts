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
import { inject, injectable } from 'inversify';

import { SimpleIterator } from '../../../iteration/simple-iterator';
import { ILogger, TYPES as LOGGING_TYPES } from '../../../logging';
import { bindSymbol } from '../../../utilities';
import {
  DuplicatePathError, FilesystemError, InvalidPathError, NotFoundPathError,
} from '../../errors';
import type { IItem } from '../../iitem';
import { IFilesystemProviderSymbol } from '../../symbols';
import type { IFilesystemProvider } from '../ifilesystem-provider';
import { ProviderType } from '../provider-type';
import { GoogleDriveFile } from './google-drive-file';
import { GoogleDriveFolder } from './google-drive-folder';
import { GoogleDriveShortcut } from './google-drive-shortcut';

@injectable()
@bindSymbol(IFilesystemProviderSymbol)
export class GoogleDriveFilesystemProvider implements IFilesystemProvider {
  private readonly FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

  private readonly SHORTCUT_MIME_TYPE = 'application/vnd.google-apps.shortcut';

  // eslint-disable-next-line class-methods-use-this
  public get type(): ProviderType {
    return ProviderType.GoogleDrive;
  }

  constructor(@inject(LOGGING_TYPES.ILogger) private readonly logger: ILogger) { }

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
    if (item === null) {
      throw new FilesystemError(`Item with id '${id}' does not exist`);
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

  private getIdFromPath(path: string, folder?: boolean): string {
    this.logger.trace(`Getting id for item with path '${path}'`);
    const segments = path.split('/').slice(1);
    let segmentFolder = DriveApp.getRootFolder();
    for (let i = 0; i < segments.length; i += 1) {
      let childIterator: { hasNext: () => boolean; };

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      childIterator = segmentFolder.getFoldersByName(segments[i]!);
      if (!childIterator.hasNext()) {
        if (i < segments.length - 1) {
          throw new NotFoundPathError(path);
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        childIterator = segmentFolder.getFilesByName(segments[i]!);
        if (!childIterator.hasNext()) {
          throw new NotFoundPathError(path);
        }
        if (folder === true) {
          throw new InvalidPathError(path);
        }

        const segmentFile = (childIterator as GoogleAppsScript.Drive.FileIterator)
          .next();
        if (childIterator.hasNext()) {
          throw new DuplicatePathError(path, segmentFile.getName());
        }

        return segmentFile.getId();
      }

      if (i === segments.length - 1 && folder === false) {
        throw new InvalidPathError(path);
      }

      segmentFolder = (childIterator as GoogleAppsScript.Drive.FolderIterator).next();
      if (childIterator.hasNext()) {
        throw new DuplicatePathError(path, segmentFolder.getName());
      }
    }

    return segmentFolder.getId();
  }

  public list(path: string): IItem[] {
    this.logger.trace(`Listing path '${path}'`);
    const rootFolder = DriveApp.getFolderById(this.getIdFromPath(path, true));
    if (rootFolder === null) {
      throw new InvalidPathError(path);
    }

    const items: IItem[] = [];
    this.logger.trace('Getting folders');
    new SimpleIterator(rootFolder.getFolders())
      .forEach((folder) => items.push(new GoogleDriveFolder(folder, `${path}${folder.getName()}`)));
    this.logger.trace('Getting files and shortcuts');
    new SimpleIterator(rootFolder.getFiles())
      .forEach((file) => {
        if (file.getMimeType() === this.SHORTCUT_MIME_TYPE) {
          items.push(new GoogleDriveFile(file, `${path}/${file.getName()}`));
        } else {
          items.push(new GoogleDriveShortcut(file, `${path}/${file.getName()}`,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.getPathFromId(file.getTargetId()!)));
        }
      });
    items.sort((a, b) => {
      if (a.name === b.name) {
        return 0;
      }

      return a.name < b.name ? -1 : 1;
    });

    return items;
  }

  public stat(path: string): IItem | null {
    this.logger.trace(`Stat'ing path '${path}'`);
    let id: string;
    try {
      id = this.getIdFromPath(path);
    } catch (error) {
      if (error instanceof NotFoundPathError) {
        return null;
      }

      throw error;
    }

    const file = DriveApp.getFileById(id);
    const mimeType = file.getMimeType();
    if (mimeType === this.FOLDER_MIME_TYPE) {
      const folder = DriveApp.getFolderById(id);

      return new GoogleDriveFolder(folder, path);
    } if (mimeType === this.SHORTCUT_MIME_TYPE) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return new GoogleDriveShortcut(file, path, this.getPathFromId(file.getTargetId()!));
    }

    return new GoogleDriveFile(file, path);
  }
}
