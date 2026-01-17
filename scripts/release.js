#!/usr/bin/env node

/**
 * Script per rilasciare su GitHub con semantic versioning
 *
 * Uso:
 *   pnpm release "feat: aggiunta nuova funzionalità"
 *   pnpm release "fix: correzione bug"
 *   pnpm release "BREAKING CHANGE: modifica importante"
 *
 * Il messaggio di commit deve seguire il formato Conventional Commits:
 * - feat: per nuove funzionalità (minor version bump)
 * - fix: per bug fix (patch version bump)
 * - BREAKING CHANGE: o ! per breaking changes (major version bump)
 */

import { execSync } from 'child_process';
import { argv } from 'process';

// Ottieni il messaggio di commit dall'argomento o dalla variabile d'ambiente
const commitMessage =
  argv[2] || process.env.npm_config_message || 'chore: release';

if (!commitMessage || commitMessage.trim() === '') {
  console.error('❌ Errore: devi fornire un messaggio di commit');
  console.error('\nUso: pnpm release "feat: descrizione"');
  console.error('\nFormati supportati per semantic versioning:');
  console.error('  - feat: nuova funzionalità (minor)');
  console.error('  - fix: correzione bug (patch)');
  console.error('  - BREAKING CHANGE: cambiamento importante (major)');
  process.exit(1);
}

try {
  console.log('📦 Aggiungendo file modificati...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log(`💬 Creando commit con messaggio: "${commitMessage}"`);
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  console.log('🚀 Eseguendo push su GitHub...');
  execSync('git push', { stdio: 'inherit' });

  console.log('🏷️  Eseguendo push dei tag...');
  execSync('git push --tags', { stdio: 'inherit' });

  console.log('\n✅ Release completata con successo!');
  console.log(
    '📋 GitHub Actions genererà automaticamente la versione basata sul messaggio di commit.'
  );
} catch (error) {
  console.error('\n❌ Errore durante il release:', error.message);
  process.exit(1);
}
