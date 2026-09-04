const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const MAX_DEPTH = 4;
const MAX_RESULTS = 250;
const SKIP_DIRS = new Set(['node_modules', '.git', 'Cache', 'cache', 'Temp', 'temp']);

function defaultCandidatePaths() {
  const home = os.homedir();
  const docs = path.join(home, 'Documents');
  const candidates = [];

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    candidates.push(
      path.join(docs, 'FC 26', 'settings'),
      path.join(appData, 'EA Sports', 'FC 26'),
      path.join(localAppData, 'EA Sports', 'FC 26'),
      path.join(localAppData, 'EA SPORTS FC 26'),
      path.join(localAppData, 'EA SPORTS FC 26', 'settings'),
      path.join(docs, 'EA SPORTS FC 26', 'settings')
    );
  }

  return [...new Set(candidates)];
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function looksLikeCareerSave(fileName) {
  const lower = fileName.toLowerCase();
  return (
    lower.startsWith('cmmgrc') ||
    lower.startsWith('cmmgr') ||
    lower.includes('career') ||
    lower.includes('careermode') ||
    lower.startsWith('career') ||
    lower.includes('save') ||
    lower.endsWith('.sav') ||
    lower.endsWith('.save')
  );
}

async function scanDirectory(rootPath, options = {}) {
  const maxDepth = Number.isInteger(options.maxDepth) ? Math.min(Math.max(options.maxDepth, 0), 8) : MAX_DEPTH;
  const includeAllFiles = Boolean(options.includeAllFiles);
  const normalizedRoot = path.resolve(rootPath);

  const rootStat = await fs.stat(normalizedRoot);
  if (!rootStat.isDirectory()) throw new Error('FC26_PATH_NOT_DIRECTORY');

  const results = [];

  async function visit(currentPath, depth) {
    if (depth > maxDepth || results.length >= MAX_RESULTS) return;

    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= MAX_RESULTS) break;
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) await visit(fullPath, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!includeAllFiles && !looksLikeCareerSave(entry.name)) continue;

      try {
        const stat = await fs.stat(fullPath);
        results.push({
          id: Buffer.from(fullPath).toString('base64url'),
          name: entry.name,
          path: fullPath,
          directory: currentPath,
          extension: path.extname(entry.name).toLowerCase(),
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
          modifiedAt: stat.mtime.toISOString(),
          likelyCareerSave: looksLikeCareerSave(entry.name),
        });
      } catch {
        // O arquivo pode ter sido removido enquanto a pasta era varrida.
      }
    }
  }

  await visit(normalizedRoot, 0);
  results.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

  return {
    rootPath: normalizedRoot,
    scannedAt: new Date().toISOString(),
    count: results.length,
    files: results,
  };
}

async function findExistingDefaultPaths() {
  const candidates = defaultCandidatePaths();
  const results = [];
  for (const candidate of candidates) {
    if (await pathExists(candidate)) results.push(candidate);
  }
  return results;
}

module.exports = {
  findExistingDefaultPaths,
  scanDirectory,
};
