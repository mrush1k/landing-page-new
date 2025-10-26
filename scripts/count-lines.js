const fs = require('fs');
const path = require('path');

const IGNORED = new Set(['node_modules', '.git', '.next', '.vercel', 'dist', 'build', 'out']);
const root = process.cwd();

function isBinary(buf) {
  for (let i = 0; i < 24 && i < buf.length; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function walk(dir) {
  const results = [];
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch (err) {
    return results;
  }
  for (const name of names) {
    if (IGNORED.has(name)) continue;
    const full = path.join(dir, name);
    let stat;
    try {
      stat = fs.lstatSync(full);
    } catch (err) {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (stat.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function countLines(file) {
  try {
    const buf = fs.readFileSync(file);
    if (isBinary(buf)) return null;
    const text = buf.toString('utf8');
    // normalize to \n
    const lines = text.split(/\r\n|\n/).length;
    return { lines, bytes: buf.length };
  } catch (err) {
    return null;
  }
}

const files = walk(root);
const results = [];
for (const f of files) {
  const stats = countLines(f);
  if (!stats) continue;
  results.push({ path: path.relative(root, f), lines: stats.lines, bytes: stats.bytes });
}
results.sort((a, b) => b.lines - a.lines || b.bytes - a.bytes);
const top = results.slice(0, 50);
if (top.length === 0) {
  console.log('No text files found.');
  process.exit(0);
}
console.log('lines\tbytes\tpath');
for (const r of top) {
  console.log(`${r.lines}\t${r.bytes}\t${r.path}`);
}

// also print a summary
const totalFiles = results.length;
const totalLines = results.reduce((s, r) => s + r.lines, 0);
console.log('\nSummary:');
console.log('Total text files scanned: ' + totalFiles);
console.log('Total lines across scanned files: ' + totalLines);
