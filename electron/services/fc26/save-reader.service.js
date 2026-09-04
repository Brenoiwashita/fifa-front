const fs = require('fs/promises');
const path = require('path');

const HEADER_BYTES = 64;

async function inspectSaveFile(filePath) {
  const resolved = path.resolve(filePath);
  const stat = await fs.stat(resolved);
  if (!stat.isFile()) throw new Error('FC26_SAVE_NOT_FILE');

  const handle = await fs.open(resolved, 'r');
  try {
    const size = Math.min(HEADER_BYTES, stat.size);
    const buffer = Buffer.alloc(size);
    if (size > 0) await handle.read(buffer, 0, size, 0);

    return {
      name: path.basename(resolved),
      path: resolved,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      headerHex: buffer.toString('hex'),
      headerAscii: buffer.toString('ascii').replace(/[^\x20-\x7E]/g, '.'),
    };
  } finally {
    await handle.close();
  }
}

module.exports = { inspectSaveFile };
