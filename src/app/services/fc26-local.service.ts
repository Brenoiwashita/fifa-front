import { Injectable, NgZone } from '@angular/core';
import { LocalResult, LocalSaveScan, SaveInspection } from '../models/local-save.models';
import { ParsedCareerSave } from '../models/career-save.models';

@Injectable({ providedIn: 'root' })
export class Fc26LocalService {
  constructor(private readonly zone: NgZone) {}

  private ipc<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      operation().then(
        (value) => this.zone.run(() => resolve(value)),
        (error) => this.zone.run(() => reject(error)),
      );
    });
  }

  getDefaultPaths(): Promise<string[]> {
    return this.ipc(() => window.electron.fc26.getDefaultPaths());
  }

  scanSaves(rootPath: string, includeAllFiles = false): Promise<LocalResult<LocalSaveScan>> {
    return this.ipc(() => window.electron.fc26.scanSaves(rootPath, { maxDepth: 4, includeAllFiles }));
  }

  inspectSave(filePath: string): Promise<LocalResult<SaveInspection>> {
    return this.ipc(() => window.electron.fc26.inspectSave(filePath));
  }

  selectSaveFile(): Promise<string | null> {
    return this.ipc(() => window.electron.fc26.selectSaveFile());
  }

  parseSave(filePath: string): Promise<LocalResult<ParsedCareerSave>> {
    return this.ipc(() => window.electron.fc26.parseSave(filePath));
  }

  loadDemo(): Promise<LocalResult<ParsedCareerSave>> {
    return this.ipc(() => window.electron.fc26.loadDemo());
  }
}
