const fs = require('fs');
const path = require('path');

const ignoreDirs = new Set(['node_modules', '.git', '.next', 'backups']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ignoreDirs.has(ent.name)) continue;
    try {
      if (ent.isFile()) {
        const stat = fs.statSync(full);
        if (stat.size === 0) console.log(path.relative(process.cwd(), full));
      } else if (ent.isDirectory()) {
        walk(full);
      }
    } catch (e) {
      // ignore permission errors
    }
  }
}

walk(process.cwd());
