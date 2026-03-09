#!/usr/bin/env node
/**
 * Project structure check — run from repo root.
 * Fails (exit 1) if any staged or tracked file violates structure rules.
 * Used by pre-commit hook so "if not followed, can't commit".
 */
import { execSync } from 'child_process';

const root = process.cwd();

function git(command) {
  try {
    return execSync(`git ${command}`, { encoding: 'utf8', cwd: root }).trim();
  } catch {
    return '';
  }
}

// Normalize path separators to /
function norm(p) {
  return p.replace(/\\/g, '/');
}

// Forbidden patterns (regex or string match). Any staged/tracked file matching fails.
const FORBIDDEN = [
  { pattern: /^client\/vite\.config\.js\.timestamp/i, msg: 'Vite cache file (add client/vite.config.js.timestamp* to .gitignore)' },
  { pattern: /^client\/dist\//i, msg: 'Build output (client/dist/ must be gitignored)' },
  { pattern: /\/node_modules\//i, msg: 'node_modules must not be committed' },
  { pattern: /^\.env$/i, msg: 'Do not commit .env (use .env.example)' },
  { pattern: /^server\/\.env$/i, msg: 'Do not commit server/.env' },
  { pattern: /^server\/data\/.*\.(db|db-wal|db-shm)$/i, msg: 'Do not commit server/data/*.db files' },
  { pattern: /\.(log|tmp|temp)(\/|$)/i, msg: 'No .log or temp files in repo' },
];

// Allowed files/dirs at repo root (if we want to forbid unknown root files, enable ROOT_STRICT)
const ROOT_ALLOWED = new Set([
  'package.json', 'package-lock.json', 'README.md', 'render.yaml', '.gitignore',
  'docs', 'client', 'server', 'scripts', '.cursor', '.husky', '.env.example',
]);
const ROOT_STRICT = true; // block any other top-level path

function check(paths) {
  const violations = [];
  const rootFiles = new Set();

  for (const raw of paths) {
    const p = norm(raw);
    if (!p) continue;

    for (const { pattern, msg } of FORBIDDEN) {
      if (pattern.test(p)) {
        violations.push({ path: p, msg });
        break;
      }
    }

    const top = p.split('/')[0];
    if (ROOT_STRICT && top && !ROOT_ALLOWED.has(top)) {
      rootFiles.add(top);
    }
  }

  for (const top of rootFiles) {
    violations.push({ path: top + '/', msg: `Unexpected top-level path "${top}" (not in allowed list; see docs/PROJECT_STRUCTURE.md)` });
  }

  return violations;
}

// Pre-commit: check staged files. Otherwise: check all tracked files.
const isPreCommit = process.env.HUSKY === '1' || process.argv.includes('--staged');
const list = isPreCommit ? git('diff --cached --name-only') : git('ls-files');
const paths = list ? list.split(/\r?\n/).filter(Boolean) : [];

const violations = check(paths);
if (violations.length > 0) {
  console.error('\n❌ Project structure check failed. Commit blocked.\n');
  const seen = new Set();
  for (const { path: p, msg } of violations) {
    const key = p + msg;
    if (seen.has(key)) continue;
    seen.add(key);
    console.error(`  ${p}`);
    console.error(`    → ${msg}\n`);
  }
  console.error('Fix the paths above (or add to .gitignore) and try again.');
  console.error('See docs/PROJECT_STRUCTURE.md for rules.\n');
  process.exit(1);
}

console.log('✓ Project structure OK');
process.exit(0);
