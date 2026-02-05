#!/usr/bin/env node

/**
 * Script per rilasciare su GitHub con semantic versioning
 *
 * Uso:
 *   pnpm release "fix: correzione bug"      -> patch (1.0.0 -> 1.0.1)
 *   pnpm release "minor: nuova feature"     -> minor (1.0.0 -> 1.1.0)
 *   pnpm release "major: breaking change"   -> major (1.0.0 -> 2.0.0)
 *
 * Di default (senza prefisso riconosciuto) viene applicata una patch.
 */

import { execSync } from 'child_process';
import { argv } from 'process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');

/**
 * Determina il tipo di bump dalla stringa di commit
 * @param {string} message - Il messaggio di commit
 * @returns {'major' | 'minor' | 'patch'} Il tipo di bump
 */
function getBumpType(message) {
  const lowerMessage = message.toLowerCase().trim();

  if (lowerMessage.startsWith('major')) {
    return 'major';
  }
  if (lowerMessage.startsWith('minor')) {
    return 'minor';
  }
  // fix o qualsiasi altro prefisso -> patch (default)
  return 'patch';
}

/**
 * Incrementa la versione in base al tipo di bump
 * @param {string} version - La versione attuale (es. "1.2.3")
 * @param {'major' | 'minor' | 'patch'} bumpType - Il tipo di bump
 * @returns {string} La nuova versione
 */
function bumpVersion(version, bumpType) {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// Ottieni il messaggio di commit dall'argomento o dalla variabile d'ambiente
const commitMessage =
  argv[2] || process.env.npm_config_message || 'chore: release';

if (!commitMessage || commitMessage.trim() === '') {
  console.error('❌ Errore: devi fornire un messaggio di commit');
  console.error('\nUso: pnpm release "fix: descrizione"');
  console.error('\nFormati supportati per semantic versioning:');
  console.error('  - fix: correzione bug (patch) - default');
  console.error('  - minor: nuova funzionalità (minor)');
  console.error('  - major: cambiamento importante (major)');
  process.exit(1);
}

try {
  // Leggi e aggiorna la versione in package.json
  console.log('📖 Leggendo package.json...');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const currentVersion = packageJson.version;
  const bumpType = getBumpType(commitMessage);
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`📊 Tipo di bump: ${bumpType}`);
  console.log(`📦 Versione: ${currentVersion} → ${newVersion}`);

  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ package.json aggiornato');

  console.log('\n📦 Aggiungendo file modificati...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log(`💬 Creando commit con messaggio: "${commitMessage}"`);
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  console.log('🚀 Eseguendo push su GitHub...');
  execSync('git push', { stdio: 'inherit' });

  console.log('🏷️  Eseguendo push dei tag...');
  execSync('git push --tags', { stdio: 'inherit' });

  console.log(`\n✅ Release v${newVersion} completata con successo!`);
} catch (error) {
  console.error('\n❌ Errore durante il release:', error.message);
  process.exit(1);
}
