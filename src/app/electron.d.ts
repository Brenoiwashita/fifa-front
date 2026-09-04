import type { ApiResult, Career, CareerSnapshot, DashboardResponse, HistoryItem, Player, PublishResponse } from './models/api.models';
import type { LocalResult, LocalSaveScan, SaveInspection } from './models/local-save.models';
import type { ParsedCareerSave } from './models/career-save.models';

declare global {
  interface Window {
    electron: {
      minimize(): Promise<void>;
      toggleMaximize(): Promise<void>;
      close(): Promise<void>;
      selectFcPath(): Promise<string | null>;
      getAppInfo(): Promise<{ version: string; platform: string }>;
      fc26: {
        getDefaultPaths(): Promise<string[]>;
        scanSaves(rootPath: string, options?: { maxDepth?: number; includeAllFiles?: boolean }): Promise<LocalResult<LocalSaveScan>>;
        inspectSave(filePath: string): Promise<LocalResult<SaveInspection>>;
        selectSaveFile(): Promise<string | null>;
        parseSave(filePath: string): Promise<LocalResult<ParsedCareerSave>>;
        loadDemo(): Promise<LocalResult<ParsedCareerSave>>;
      };
      api: {
        health(baseUrl: string): Promise<ApiResult<{ ok: boolean; dataSource?: string }>>;
        listCareers(baseUrl: string): Promise<ApiResult<Career[]>>;
        getDashboard(baseUrl: string, careerId: string): Promise<ApiResult<DashboardResponse>>;
        getPlayers(baseUrl: string, careerId: string): Promise<ApiResult<Player[]>>;
        getHistory(baseUrl: string, careerId: string, limit?: number): Promise<ApiResult<HistoryItem[]>>;
        publishSnapshot(baseUrl: string, syncKey: string, snapshot: CareerSnapshot): Promise<ApiResult<PublishResponse>>;
      };
    };
  }
}

export {};
