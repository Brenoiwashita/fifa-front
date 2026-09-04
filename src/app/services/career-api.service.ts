import { Injectable, NgZone } from '@angular/core';
import {
  ApiResult,
  Career,
  CareerSnapshot,
  DashboardResponse,
  HistoryItem,
  Player,
  PublishResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CareerApiService {
  private apiUrl = localStorage.getItem('fc-career-hub.apiUrl') || 'http://127.0.0.1:3333';
  private syncKey = localStorage.getItem('fc-career-hub.syncKey') || 'dev-secret';

  constructor(private readonly zone: NgZone) {}

  private ipc<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      operation().then(
        (value) => this.zone.run(() => resolve(value)),
        (error) => this.zone.run(() => reject(error)),
      );
    });
  }

  getApiUrl() {
    return this.apiUrl;
  }

  getSyncKey() {
    return this.syncKey;
  }

  setConnection(apiUrl: string, syncKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.syncKey = syncKey;
    localStorage.setItem('fc-career-hub.apiUrl', this.apiUrl);
    localStorage.setItem('fc-career-hub.syncKey', this.syncKey);
  }

  health(): Promise<ApiResult<{ ok: boolean; dataSource?: string }>> {
    return this.ipc(() => window.electron.api.health(this.apiUrl));
  }

  listCareers(): Promise<ApiResult<Career[]>> {
    return this.ipc(() => window.electron.api.listCareers(this.apiUrl));
  }

  getDashboard(careerId: string): Promise<ApiResult<DashboardResponse>> {
    return this.ipc(() => window.electron.api.getDashboard(this.apiUrl, careerId));
  }

  getPlayers(careerId: string): Promise<ApiResult<Player[]>> {
    return this.ipc(() => window.electron.api.getPlayers(this.apiUrl, careerId));
  }

  getHistory(careerId: string, limit = 20): Promise<ApiResult<HistoryItem[]>> {
    return this.ipc(() => window.electron.api.getHistory(this.apiUrl, careerId, limit));
  }

  publishSnapshot(snapshot: CareerSnapshot): Promise<ApiResult<PublishResponse>> {
    return this.ipc(() => window.electron.api.publishSnapshot(this.apiUrl, this.syncKey, snapshot));
  }
}
