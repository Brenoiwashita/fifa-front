export interface LocalSaveFile {
  id: string;
  name: string;
  path: string;
  directory: string;
  extension: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  likelyCareerSave: boolean;
}

export interface LocalSaveScan {
  rootPath: string;
  scannedAt: string;
  count: number;
  files: LocalSaveFile[];
}

export interface SaveInspection {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  headerHex: string;
  headerAscii: string;
}

export interface LocalResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
