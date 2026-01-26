#!/usr/bin/env node
import { execSync } from 'child_process';

const isWin = process.platform === 'win32';
const cmd = isWin ? 'scripts\\setup-dev.bat' : 'bash scripts/setup-dev.sh';

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}
