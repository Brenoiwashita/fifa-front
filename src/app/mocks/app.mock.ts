import { CareerMock, PlayerMock, RankingMock, StandingMock } from '../models/app.models';

export const APP_MOCK = {
  app: {
    version: '0.2.0',
    game: 'EA SPORTS FC 26',
    gameShort: 'FC 26',
    databaseVersion: '2026.09.04.1',
    databaseBadge: 'v26.09.4',
    lastRead: 'Hoje, 14:32',
    defaultFcPath: 'C:\\Games\\EA Sports FC 26',
  },

  activeCareer: {
    id: 'santos-career',
    club: 'Santos FC',
    shortClub: 'Santos',
    season: '2027/28',
    manager: 'Breno',
    position: '2º',
    points: 59,
    games: 27,
    goals: 54,
    nextMatch: 'Santos × Palmeiras',
    competition: 'Brasileirão Série A',
    saveName: 'Santos Career',
    lastModified: 'Hoje 14:28',
  },

  squadSummary: {
    players: 32,
    averageOverall: 76.4,
    averageAge: 23.8,
    value: '€186M',
  },

  seasonStats: {
    goalsFor: 54,
    goalsAgainst: 28,
    winRate: '61%',
    goalsPerGame: 2.0,
  },

  database: {
    players: 612,
    brazilianClubs: 20,
    competitions: 38,
    integrity: [
      'IDs de jogadores válidos',
      'Clubes relacionados',
      'Save ativo identificado',
      'Backup disponível',
    ],
  },

  careers: <CareerMock[]>[
    {
      id: 'santos-career',
      club: 'Santos FC',
      season: '2027/28',
      games: 27,
      lastModified: 'Hoje 14:28',
      syncStatus: 'synced',
    },
    {
      id: 'sunderland-career',
      club: 'Sunderland',
      season: '2029/30',
      games: 12,
      lastModified: '02/09/2026',
      syncStatus: 'pending',
    },
  ],

  players: <PlayerMock[]>[
    {id:190871,name:'Neymar Jr',team:'Santos',pos:'LW',age:34,ovr:87,pot:87,games:28,goals:17,assists:11,value:'€32M'},
    {id:900001,name:'João Pedro',team:'Santos',pos:'CAM',age:19,ovr:76,pot:91,games:19,goals:6,assists:8,value:'€18M'},
    {id:231832,name:'Yuri Alberto',team:'Corinthians',pos:'ST',age:25,ovr:79,pot:81,games:25,goals:14,assists:4,value:'€22M'},
    {id:900002,name:'Rodrigo Garro',team:'Corinthians',pos:'CAM',age:28,ovr:81,pot:81,games:24,goals:7,assists:10,value:'€24M'},
    {id:900003,name:'Hugo Souza',team:'Corinthians',pos:'GK',age:27,ovr:78,pot:80,games:27,goals:0,assists:0,value:'€13M'},
  ],

  formation: [
    [
      {name:'Neymar',ovr:87},
      {name:'João Pedro',ovr:76},
      {name:'Ângelo',ovr:77},
    ],
    [
      {name:'Garro',ovr:81},
      {name:'Volante',ovr:75},
    ],
    [
      {name:'LE',ovr:74},
      {name:'ZAG',ovr:78},
      {name:'ZAG',ovr:77},
      {name:'LD',ovr:75},
    ],
    [{name:'GK',ovr:79}],
  ],

  standings: <StandingMock[]>[
    {position:1,club:'Palmeiras',games:27,points:61},
    {position:2,club:'Santos',games:27,points:59,active:true},
    {position:3,club:'Flamengo',games:27,points:57},
    {position:4,club:'Corinthians',games:27,points:51},
  ],

  cup: {
    name: 'Copa do Brasil',
    stage: 'Semifinal',
    match: 'Santos × Grêmio',
    nextGame: 'Próximo jogo em 6 dias',
  },

  topScorers: <RankingMock[]>[
    {name:'Neymar Jr',value:17},
    {name:'Yuri Alberto',value:14},
    {name:'João Pedro',value:9},
  ],

  topAssists: <RankingMock[]>[
    {name:'Neymar Jr',value:11},
    {name:'Rodrigo Garro',value:10},
    {name:'João Pedro',value:8},
  ],

  ai: {
    defaultPrompt: 'Atualize os elencos do Brasileirão',
    changesCount: 17,
    changes: [
      {name:'Yuri Alberto',type:'update',summary:'OVR 78 → 79',detail:'Finalização 79 → 81'},
      {name:'Jogador X',type:'new',summary:'NOVO JOGADOR',detail:'OVR 72 • POT 79'},
    ],
  },

  mod: {
    name: 'Brasileirão 2026',
    clubs: 20,
    players: 612,
    build: '2026.09.04.1',
    backupDate: '04/09/2026 13:10',
  },

  publish: {
    players: 32,
    matches: 27,
    statistics: 854,
    version: '2026.09.04.1',
    lastSync: 'Hoje, 13:42',
  },

  history: [
    {date:'Hoje 14:32',title:'Base atualizada',description:'17 jogadores alterados • 3 transferências • 2 novos jogadores'},
    {date:'Hoje 13:42',title:'Aplicativo sincronizado',description:'Versão 2026.09.04.1 publicada com sucesso.'},
    {date:'02/09/2026',title:'Carreira atualizada',description:'Santos FC • Temporada 2027/28'},
  ],
};
