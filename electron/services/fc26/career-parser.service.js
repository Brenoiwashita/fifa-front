const fs = require('fs/promises');
const path = require('path');

const FIXTURE_MAGIC = 'FCHUBFIXTURE\n';

function asArray(value) { return Array.isArray(value) ? value : []; }
function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function pick(row, keys, fallback = undefined) {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null) return row[key];
  }
  return fallback;
}
function findTable(db0, db1, names) {
  const all = { ...(db1 || {}), ...(db0 || {}) };
  const normalized = new Map(Object.keys(all).map((k) => [k.toLowerCase(), k]));
  for (const name of names) {
    const exact = normalized.get(name.toLowerCase());
    if (exact) return asArray(all[exact]);
  }
  for (const [lower, original] of normalized.entries()) {
    if (names.some((n) => lower.includes(n.toLowerCase()))) return asArray(all[original]);
  }
  return [];
}
function mergeTables(db0, db1, predicate) {
  const out = [];
  for (const db of [db0 || {}, db1 || {}]) {
    for (const [name, rows] of Object.entries(db)) {
      if (predicate(name.toLowerCase()) && Array.isArray(rows)) out.push(...rows);
    }
  }
  return out;
}

async function parseBestSchema(buffer) {
  let parser;
  try {
    parser = require('fifa-career-save-parser');
  } catch {
    const error = new Error('PARSER_DEPENDENCY_MISSING');
    error.userMessage = 'Dependência fifa-career-save-parser não instalada. Rode npm install.';
    throw error;
  }

  const versions = ['21', '20', '19', '18', '17'];
  let best = null;
  let bestScore = -1;
  for (const version of versions) {
    try {
      const parsed = await parser(buffer, version);
      const dbs = Array.isArray(parsed) ? parsed : [parsed];
      const db0 = dbs[0] || {};
      const db1 = dbs[1] || {};
      const tables = [...Object.values(db0), ...Object.values(db1)];
      const rows = tables.reduce((sum, v) => sum + (Array.isArray(v) ? v.length : 0), 0);
      const score = (Object.keys(db0).length + Object.keys(db1).length) * 1000000 + rows;
      if (score > bestScore) {
        bestScore = score;
        best = { version, db0, db1 };
      }
    } catch (_) {}
  }
  if (!best) throw new Error('FC26_SAVE_PARSE_FAILED');
  return best;
}

function normalizeFixture(payload, filePath) {
  const players = asArray(payload.players).map((p) => ({
    id: toInt(p.id), name: String(p.name || `ID ${p.id}`), team: String(p.team || '-'),
    pos: String(p.pos || '-'), age: toInt(p.age), ovr: toInt(p.ovr), pot: toInt(p.pot),
    games: toInt(p.games), starts: toInt(p.starts), goals: toInt(p.goals), assists: toInt(p.assists),
    minutes: toInt(p.minutes), yellowCards: toInt(p.yellowCards), redCards: toInt(p.redCards),
    cleanSheets: p.cleanSheets == null ? undefined : toInt(p.cleanSheets),
    averageRating: p.averageRating == null ? undefined : toNum(p.averageRating), value: String(p.value || '-'),
  }));
  return {
    source: 'fixture', schemaVersion: 'fixture-v1', filePath,
    career: payload.career || { id: path.basename(filePath), club: 'Carreira Demo', season: '-', games: 0 },
    players, seasonStats: payload.seasonStats || {},
    diagnostics: { tables: [], warnings: ['Save demo: dados sintéticos usados apenas para testar o app no macOS.'] },
  };
}

function normalizeFbchunks(parsed, filePath) {
  const { db0, db1, version } = parsed;
  const rawPlayers = findTable(db0, db1, ['players']);
  const teams = findTable(db0, db1, ['teams']);
  const links = findTable(db0, db1, ['teamplayerlinks']);
  const names = mergeTables(db0, db1, (n) => n === 'dcplayernames');
  const contracts = mergeTables(db0, db1, (n) => n === 'career_playercontract');
  const statRows = mergeTables(db0, db1, (n) => n.includes('player') && (n.includes('stat') || n.includes('season')));
  const users = findTable(db0, db1, ['career_users']);

  const nameMap = new Map();
  for (const row of names) {
    const id = toInt(pick(row, ['nameid','id']), -1);
    const name = String(pick(row, ['name','text'], '') || '').trim();
    if (id >= 0 && name) nameMap.set(id, name);
  }
  const teamMap = new Map();
  for (const row of teams) {
    const id = toInt(pick(row, ['teamid','id']), -1);
    const name = String(pick(row, ['teamname','name','longname'], '') || '').trim();
    if (id >= 0) teamMap.set(id, name || `Time ${id}`);
  }
  const playerTeam = new Map();
  for (const row of [...links, ...contracts]) {
    const pid = toInt(pick(row, ['playerid','player_id']), -1);
    const tid = toInt(pick(row, ['teamid','team_id']), -1);
    if (pid >= 0 && tid >= 0) playerTeam.set(pid, tid);
  }
  const stats = new Map();
  for (const row of statRows) {
    const pid = toInt(pick(row, ['playerid','player_id']), -1);
    if (pid < 0) continue;
    const current = stats.get(pid) || {};
    for (const [k, v] of Object.entries(row)) if (v !== null && v !== undefined) current[k.toLowerCase()] = v;
    stats.set(pid, current);
  }
  const statValue = (s, names, fallback=0) => {
    for (const n of names) if (s[n] !== undefined) return toInt(s[n], fallback);
    return fallback;
  };

  const players = rawPlayers.map((row) => {
    const id = toInt(pick(row, ['playerid','id']));
    const commonId = toInt(pick(row, ['commonnameid']), -1);
    const firstId = toInt(pick(row, ['firstnameid']), -1);
    const lastId = toInt(pick(row, ['lastnameid','surnameid']), -1);
    const common = nameMap.get(commonId) || '';
    const full = [nameMap.get(firstId), nameMap.get(lastId)].filter(Boolean).join(' ').trim();
    const teamId = playerTeam.get(id);
    const s = stats.get(id) || {};
    return {
      id,
      name: common || full || String(pick(row, ['name','playername'], '') || `ID ${id}`),
      team: teamId == null ? '-' : (teamMap.get(teamId) || `Time ${teamId}`),
      pos: String(pick(row, ['position','preferredposition1','preferredposition'], '-') ?? '-'),
      age: toInt(pick(row, ['age']), 0),
      ovr: toInt(pick(row, ['overallrating','overall','overall_rating']), 0),
      pot: toInt(pick(row, ['potential','potentialrating']), 0),
      games: statValue(s, ['appearances','apps','games','gamesplayed','matches']),
      starts: statValue(s, ['starts','gamesstarted']),
      goals: statValue(s, ['goals','goalscored']),
      assists: statValue(s, ['assists']),
      minutes: statValue(s, ['minutes','minutesplayed']),
      yellowCards: statValue(s, ['yellowcards','yellow_cards']),
      redCards: statValue(s, ['redcards','red_cards']),
      cleanSheets: statValue(s, ['cleansheets','clean_sheets']),
      averageRating: toNum(pick(s, ['averagerating','average_rating','rating']), 0) || undefined,
      value: '-',
    };
  }).filter((p) => p.id > 0);

  const user = users[0] || {};
  const userTeamId = toInt(pick(user, ['teamid','clubteamid']), -1);
  const club = userTeamId >= 0 ? (teamMap.get(userTeamId) || `Time ${userTeamId}`) : 'Carreira FC 26';
  const tableNames = [
    ...Object.keys(db0 || {}).map((t) => `db0.${t}`),
    ...Object.keys(db1 || {}).map((t) => `db1.${t}`),
  ].sort();
  const totalGames = Math.max(0, ...players.map((p) => p.games));
  return {
    source: 'fc26-fbchunks', schemaVersion: version, filePath,
    career: { id: path.basename(filePath), club, season: String(pick(user, ['seasoncount','season'], '-') ?? '-'), games: totalGames },
    players,
    seasonStats: {
      matches: totalGames,
      goalsFor: players.reduce((n,p) => n + p.goals, 0),
      assists: players.reduce((n,p) => n + p.assists, 0),
    },
    diagnostics: {
      tables: tableNames,
      warnings: players.length ? [] : ['O container foi lido, mas a tabela de jogadores não foi normalizada. Abra Diagnóstico para inspecionar as tabelas.'],
    },
  };
}

async function parseCareerSave(filePath) {
  const buffer = await fs.readFile(filePath);
  const prefix = buffer.subarray(0, FIXTURE_MAGIC.length).toString('utf8');
  if (prefix === FIXTURE_MAGIC) {
    const payload = JSON.parse(buffer.subarray(FIXTURE_MAGIC.length).toString('utf8'));
    return normalizeFixture(payload, filePath);
  }
  const parsed = await parseBestSchema(buffer);
  return normalizeFbchunks(parsed, filePath);
}

module.exports = { parseCareerSave };
