import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APP_MOCK } from './mocks/app.mock';
import {
  Career,
  CareerSnapshot,
  DashboardResponse,
  HistoryItem,
  Player,
  Ranking,
  Standing,
} from './models/api.models';
import { CareerApiService } from './services/career-api.service';
import { Fc26LocalService } from './services/fc26-local.service';
import { LocalSaveFile, SaveInspection } from './models/local-save.models';
import { ParsedCareerSave } from './models/career-save.models';

type ViewKey = 'dashboard'|'careers'|'players'|'squad'|'competitions'|'stats'|'database'|'ai'|'mods'|'publish'|'history'|'settings';
interface NavItem { key: ViewKey; label: string; icon: string; badge?: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  active: ViewKey = 'dashboard';
  search = '';
  readonly mock = APP_MOCK;

  aiPrompt = APP_MOCK.ai.defaultPrompt;
  fcPath = APP_MOCK.app.defaultFcPath;
  apiUrl = '';
  syncKey = '';

  apiConnected = false;
  apiLoading = false;
  apiError = '';

  publishing = false;
  publishProgress = 0;
  publishError = '';
  lastSync = APP_MOCK.publish.lastSync;
  aiRunning = false;
  aiDone = false;

  careers: Career[] = [];
  activeCareer: Career | null = null;
  dashboard: DashboardResponse | null = null;
  players: Player[] = [];
  standings: Standing[] = [];
  topScorers: Ranking[] = [];
  topAssists: Ranking[] = [];
  history: HistoryItem[] = [];

  localSaves: LocalSaveFile[] = [];
  localScanLoading = false;
  localScanError = '';
  localScannedAt = '';
  selectedSaveInspection: SaveInspection | null = null;
  parsedCareer: ParsedCareerSave | null = null;
  parseLoading = false;
  parseError = '';
  localDataSource = 'Nenhum save carregado';

  sections: { title?: string; items: NavItem[] }[] = [
    { items: [{ key: 'dashboard', label: 'Dashboard', icon: '▦' }] },
    { title: 'Modo Carreira', items: [
      { key: 'careers', label: 'Minhas Carreiras', icon: '▣' },
      { key: 'players', label: 'Jogadores', icon: '◎' },
      { key: 'squad', label: 'Elenco', icon: '◉' },
      { key: 'competitions', label: 'Competições', icon: '★' },
      { key: 'stats', label: 'Estatísticas', icon: '⌁' },
    ] },
    { title: 'FC 26', items: [
      { key: 'database', label: 'Database', icon: '◫', badge: APP_MOCK.app.databaseBadge },
      { key: 'ai', label: 'Atualizar com IA', icon: '✦', badge: 'IA' },
      { key: 'mods', label: 'Mods', icon: '⬡' },
    ] },
    { title: 'Sincronização', items: [
      { key: 'publish', label: 'Publicar no App', icon: '⇧', badge: 'API' },
      { key: 'history', label: 'Histórico', icon: '↺' },
    ] },
    { title: 'Configurações', items: [{ key: 'settings', label: 'Configurações', icon: '⚙' }] },
  ];

  constructor(
    private readonly careerApi: CareerApiService,
    private readonly fc26Local: Fc26LocalService
  ) {
    this.apiUrl = careerApi.getApiUrl();
    this.syncKey = careerApi.getSyncKey();
  }

  async ngOnInit() {
    const storedPath = localStorage.getItem('fc-career-hub.fcPath');
    if (storedPath) this.fcPath = storedPath;

    if (!storedPath) {
      const defaults = await this.fc26Local.getDefaultPaths();
      if (defaults.length) this.fcPath = defaults[0];
    }

    await Promise.all([
      this.loadFromApi(),
      this.fcPath ? this.scanLocalSaves() : Promise.resolve(),
    ]);
  }

  get title() {
    const item = this.sections.flatMap((s) => s.items).find((i) => i.key === this.active);
    return item?.label ?? 'FC Career Hub';
  }

  get activePosition() {
    const row = this.standings.find((item) => item.active) || this.standings.find((item) => item.club === this.activeCareer?.club);
    return row ? `${row.position}º` : '-';
  }

  get activePoints() {
    const row = this.standings.find((item) => item.active) || this.standings.find((item) => item.club === this.activeCareer?.club);
    return row?.points ?? 0;
  }

  get activeGoals() {
    return this.players.reduce((total, player) => total + player.goals, 0);
  }

  get squadValue() {
    // O backend ainda devolve value formatado por jogador. Quando vier valor numérico do parser,
    // este cálculo poderá ser real sem alterar o template.
    return APP_MOCK.squadSummary.value;
  }

  setView(view: ViewKey) {
    this.active = view;
  }

  async pickPath() {
    const path = await window.electron?.selectFcPath();
    if (path) {
      this.fcPath = path;
      localStorage.setItem('fc-career-hub.fcPath', path);
      await this.scanLocalSaves();
    }
  }

  async scanLocalSaves() {
    if (!this.fcPath) return;
    this.localScanLoading = true;
    this.localScanError = '';
    this.selectedSaveInspection = null;

    const result = await this.fc26Local.scanSaves(this.fcPath);
    this.localScanLoading = false;

    if (!result.ok || !result.data) {
      this.localSaves = [];
      this.localScanError = result.error || 'Não foi possível ler a pasta selecionada.';
      return;
    }

    this.localSaves = result.data.files;
    this.localScannedAt = result.data.scannedAt;
  }

  async inspectLocalSave(save: LocalSaveFile) {
    const result = await this.fc26Local.inspectSave(save.path);
    if (!result.ok || !result.data) {
      this.localScanError = result.error || 'Não foi possível inspecionar o save.';
      return;
    }
    this.selectedSaveInspection = result.data;
  }

  async loadDemoSave() {
    if (this.parseLoading) return;
    this.parseLoading = true;
    this.parseError = '';

    try {
      const result = await this.fc26Local.loadDemo();
      if (!result.ok || !result.data) {
        this.parseError = result.error || 'Não foi possível carregar o save demo.';
        return;
      }

      this.applyParsedCareer(result.data);
      const published = await this.publish();
      if (published) this.setView('dashboard');
    } catch (error) {
      this.parseError = error instanceof Error ? error.message : 'Não foi possível carregar o save demo.';
    } finally {
      this.parseLoading = false;
    }
  }

  async openRealSave() {
    const filePath = await this.fc26Local.selectSaveFile();
    if (!filePath) return;
    await this.parseSavePath(filePath);
  }

  async parseLocalSave(save: LocalSaveFile) {
    await this.parseSavePath(save.path);
  }

  async parseSavePath(filePath: string) {
    if (this.parseLoading) return;
    this.parseLoading = true;
    this.parseError = '';

    try {
      const result = await this.fc26Local.parseSave(filePath);
      if (!result.ok || !result.data) {
        this.parseError = result.error || 'Não foi possível interpretar o save.';
        return;
      }

      this.applyParsedCareer(result.data);
      const published = await this.publish();
      if (published) this.setView('dashboard');
    } catch (error) {
      this.parseError = error instanceof Error ? error.message : 'Não foi possível interpretar o save.';
    } finally {
      this.parseLoading = false;
    }
  }

  get seasonGoalsFor() {
    return this.parsedCareer?.seasonStats.goalsFor ?? this.players.reduce((n, p) => n + p.goals, 0);
  }

  get seasonGoalsAgainst() {
    return this.parsedCareer?.seasonStats.goalsAgainst ?? 0;
  }

  get seasonMatches() {
    return this.parsedCareer?.seasonStats.matches ?? this.activeCareer?.games ?? 0;
  }

  get seasonWins() {
    return this.parsedCareer?.seasonStats.wins ?? 0;
  }

  get winRate() {
    return this.seasonMatches ? `${Math.round((this.seasonWins / this.seasonMatches) * 100)}%` : '-';
  }

  formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  localDate(value: string) {
    return new Date(value).toLocaleString('pt-BR');
  }

  minimize() { window.electron?.minimize(); }
  maximize() { window.electron?.toggleMaximize(); }
  close() { window.electron?.close(); }

  async saveApiSettings() {
    this.careerApi.setConnection(this.apiUrl, this.syncKey);
    await this.loadFromApi();
  }

  async loadFromApi() {
    this.apiLoading = true;
    this.apiError = '';

    const health = await this.careerApi.health();
    if (!health.ok) {
      this.apiConnected = false;
      this.apiLoading = false;
      this.apiError = `API/Mongo obrigatórios e indisponíveis: ${health.error || 'erro desconhecido'}`;
      this.clearRemoteData();
      return;
    }

    this.apiConnected = true;

    const careersResult = await this.careerApi.listCareers();
    if (!careersResult.ok) {
      this.apiLoading = false;
      this.apiError = `Não foi possível carregar carreiras: ${careersResult.error || 'erro desconhecido'}`;
      this.clearRemoteData();
      return;
    }

    this.careers = careersResult.data ?? [];
    if (this.careers.length) {
      await this.selectCareer(this.careers[0].id);
    } else {
      this.activeCareer = null;
      this.dashboard = null;
      this.players = [];
      this.history = [];
    }
    this.updateBadges();
    this.apiLoading = false;
  }

  async selectCareer(careerId: string) {
    const [dashboardResult, playersResult, historyResult] = await Promise.all([
      this.careerApi.getDashboard(careerId),
      this.careerApi.getPlayers(careerId),
      this.careerApi.getHistory(careerId, 20),
    ]);

    if (!dashboardResult.ok || !dashboardResult.data) {
      this.apiError = `Erro ao carregar dashboard: ${dashboardResult.error || 'resposta inválida'}`;
      return;
    }

    this.dashboard = dashboardResult.data;
    this.activeCareer = dashboardResult.data.career;
    this.standings = dashboardResult.data.standings;
    this.topScorers = dashboardResult.data.topScorers;
    this.topAssists = dashboardResult.data.topAssists;
    this.players = playersResult.data ?? [];
    this.history = historyResult.data ?? [];

    if (dashboardResult.data.generatedAt) {
      this.lastSync = new Date(dashboardResult.data.generatedAt).toLocaleString('pt-BR');
    }
  }

  async refreshCareer() {
    if (!this.activeCareer) return;
    this.apiLoading = true;
    await this.selectCareer(this.activeCareer.id);
    this.apiLoading = false;
  }

  runAi() {
    this.aiRunning = true;
    this.aiDone = false;
    setTimeout(() => {
      this.aiRunning = false;
      this.aiDone = true;
    }, 1200);
  }

  async publish(): Promise<boolean> {
    if (this.publishing || !this.activeCareer || !this.dashboard) return false;

    this.publishing = true;
    this.publishProgress = 15;
    this.publishError = '';

    try {
      const careerId = this.activeCareer.id;
      const snapshot: CareerSnapshot = {
        careerId,
        generatedAt: new Date().toISOString(),
        version: this.nextVersion(),
        career: {
          ...this.activeCareer,
          syncStatus: 'synced',
          lastModified: new Date().toISOString(),
        },
        players: this.players,
        standings: this.standings,
        topScorers: this.topScorers,
        topAssists: this.topAssists,
        metadata: {
          source: 'fc-career-hub-electron',
          fcPath: this.fcPath,
          publishedBy: 'desktop',
        },
      };

      this.publishProgress = 45;
      const result = await this.careerApi.publishSnapshot(snapshot);

      if (!result.ok || !result.data) {
        this.publishError = `Falha ao publicar: ${result.error || 'erro desconhecido'}`;
        this.publishProgress = 0;
        return false;
      }

      this.publishProgress = 80;
      this.lastSync = new Date(result.data.generatedAt).toLocaleString('pt-BR');
      await this.loadFromApi();

      // Garante que a carreira recém-sincronizada seja a selecionada mesmo quando
      // já existirem outras carreiras no MongoDB.
      if (this.careers.some((career) => career.id === careerId)) {
        await this.selectCareer(careerId);
      }

      this.publishProgress = 100;
      return true;
    } catch (error) {
      this.publishError = `Falha ao publicar: ${error instanceof Error ? error.message : 'erro desconhecido'}`;
      this.publishProgress = 0;
      return false;
    } finally {
      this.publishing = false;
    }
  }

  historyDate(item: HistoryItem) {
    return new Date(item.generatedAt).toLocaleString('pt-BR');
  }

  private applyParsedCareer(parsed: ParsedCareerSave) {
    this.parsedCareer = parsed;
    this.apiError = '';
    this.localDataSource = parsed.source === 'fixture' ? 'Save Demo' : `FC 26 / schema ${parsed.schemaVersion}`;
    const now = new Date().toISOString();
    const career: Career = {
      id: parsed.career.id,
      club: parsed.career.club || 'Carreira FC 26',
      season: parsed.career.season || '-',
      games: parsed.career.games || parsed.seasonStats.matches || 0,
      manager: parsed.career.manager,
      lastModified: now,
      syncStatus: 'pending',
    };
    this.activeCareer = career;
    this.careers = [career];
    this.players = parsed.players;
    this.topScorers = [...this.players].sort((a,b) => b.goals-a.goals).slice(0,5).map((p) => ({ name:p.name, value:p.goals }));
    this.topAssists = [...this.players].sort((a,b) => b.assists-a.assists).slice(0,5).map((p) => ({ name:p.name, value:p.assists }));
    this.standings = [];
    const avg = (values: number[]) => values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : 0;
    this.dashboard = {
      career,
      version: parsed.schemaVersion,
      generatedAt: now,
      squadSummary: { players: this.players.length, averageOverall: avg(this.players.map((p)=>p.ovr).filter(Boolean)), averageAge: avg(this.players.map((p)=>p.age).filter(Boolean)) },
      standings: [],
      topScorers: this.topScorers,
      topAssists: this.topAssists,
    };
    this.updateBadges();
  }

  private nextVersion() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${now.getTime()}`;
  }

  private updateBadges() {
    const careersNav = this.sections.flatMap((section) => section.items).find((item) => item.key === 'careers');
    const playersNav = this.sections.flatMap((section) => section.items).find((item) => item.key === 'players');
    if (careersNav) careersNav.badge = String(this.careers.length);
    if (playersNav) playersNav.badge = String(this.players.length);
  }

  private clearRemoteData() {
    this.careers = [];
    this.activeCareer = null;
    this.players = [];
    this.standings = [];
    this.topScorers = [];
    this.topAssists = [];
    this.dashboard = null;
    this.history = [];
    this.updateBadges();
   }
}
