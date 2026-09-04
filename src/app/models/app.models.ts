export interface PlayerMock {
  id: number;
  name: string;
  team: string;
  pos: string;
  age: number;
  ovr: number;
  pot: number;
  games: number;
  goals: number;
  assists: number;
  value: string;
}

export interface CareerMock {
  id: string;
  club: string;
  season: string;
  games: number;
  manager?: string;
  lastModified: string;
  syncStatus: 'synced' | 'pending';
}

export interface StandingMock {
  position: number;
  club: string;
  games: number;
  points: number;
  active?: boolean;
}

export interface RankingMock {
  name: string;
  value: number;
}
