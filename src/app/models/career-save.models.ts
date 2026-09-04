import type { Player } from './api.models';

export interface ParsedCareerInfo {
  id: string;
  club: string;
  season: string;
  manager?: string;
  games: number;
}

export interface ParsedSeasonStats {
  matches?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  assists?: number;
}

export interface ParsedCareerSave {
  source: 'fixture' | 'fc26-fbchunks';
  schemaVersion: string;
  filePath: string;
  career: ParsedCareerInfo;
  players: Player[];
  seasonStats: ParsedSeasonStats;
  diagnostics: {
    tables: string[];
    warnings: string[];
  };
}
