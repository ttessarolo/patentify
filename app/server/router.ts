/**
 * Router oRPC principale — assembla tutte le procedure per dominio.
 *
 * Ogni sotto-oggetto corrisponde a un dominio funzionale:
 *   quiz, errori, classifiche, statistiche, esercitazione,
 *   attempt, skull, spiegazione, version
 *
 * I tipi del router vengono inferiti automaticamente e usati
 * dal client isomorfico e dall'OpenAPI spec generator.
 */

// Quiz
import {
  generate,
  getDomanda,
  abort,
  complete,
  getBoostCounts,
  getFull,
} from './procedures/quiz';

// Errori ricorrenti
import {
  getStats as erroriGetStats,
  getTopCategorie,
  getAllCategorie,
  getMaggioriErrori,
  getMaggioriEsatte,
  getSkull as erroriGetSkull,
  getSbagliate,
  getCategorieCritiche,
  getTimeline as erroriGetTimeline,
} from './procedures/errori';

// Classifiche
import {
  getClassificaQuiz,
  getClassificaRisposte,
  addFollower,
  removeFollower,
} from './procedures/classifiche';

// Statistiche
import {
  getQuizStats,
  getQuizList,
  getQuizTimeline,
} from './procedures/statistiche';

// Esercitazione
import {
  getDomande,
  getAmbiti,
} from './procedures/esercitazione';

// Attempt
import {
  track,
  check,
  getDomandaUserStats,
} from './procedures/attempt';

// Skull
import {
  addSkull,
  removeSkull,
} from './procedures/skull';

// Spiegazione
import { getSpiegazione } from './procedures/spiegazione';

// Sfide
import {
  getAblyToken,
  createSfida,
  completeSfida,
  getSfidaResult,
  abortSfida,
  getSfideHistory,
  getSfideHistoryAll,
  getOnlineUsersDetails,
} from './procedures/sfide';

// Version
import { getVersion } from './procedures/version';

// ============================================================
// Router
// ============================================================

export const appRouter = {
  quiz: {
    generate,
    getDomanda,
    abort,
    complete,
    getBoostCounts,
    getFull,
  },
  errori: {
    getStats: erroriGetStats,
    getTopCategorie,
    getAllCategorie,
    getMaggioriErrori,
    getMaggioriEsatte,
    getSkull: erroriGetSkull,
    getSbagliate,
    getCategorieCritiche,
    getTimeline: erroriGetTimeline,
  },
  classifiche: {
    quiz: getClassificaQuiz,
    risposte: getClassificaRisposte,
    addFollower,
    removeFollower,
  },
  statistiche: {
    getQuizStats,
    getQuizList,
    getQuizTimeline,
  },
  esercitazione: {
    getDomande,
    getAmbiti,
  },
  attempt: {
    track,
    check,
    getDomandaUserStats,
  },
  sfide: {
    getAblyToken,
    create: createSfida,
    complete: completeSfida,
    result: getSfidaResult,
    abort: abortSfida,
    history: getSfideHistory,
    historyAll: getSfideHistoryAll,
    onlineUsersDetails: getOnlineUsersDetails,
  },
  skull: {
    add: addSkull,
    remove: removeSkull,
  },
  spiegazione: {
    get: getSpiegazione,
  },
  version: {
    get: getVersion,
  },
};

export type AppRouter = typeof appRouter;
