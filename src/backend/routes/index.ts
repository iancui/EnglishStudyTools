import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { WordController } from '../controllers/wordController.ts';
import { ReviewController } from '../controllers/reviewController.ts';
import { SentenceController } from '../controllers/sentenceController.ts';
import { DictionaryController } from '../controllers/dictionaryController.ts';
import { StatisticsController } from '../controllers/statisticsController.ts';
import { StudySessionController } from '../controllers/studySessionController.ts';
import { SentencePracticeController } from '../controllers/sentencePracticeController.ts';
import { AdminSentenceAIToolController } from '../controllers/adminSentenceAIToolController.ts';
import { AdminExcelImportController } from '../controllers/adminExcelImportController.ts';
import { RbacController } from '../controllers/rbacController.ts';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware.ts';

export const apiRouter = Router();

// Public authentication endpoints
apiRouter.get('/auth/captcha', AuthController.captcha);
apiRouter.post('/auth/register', AuthController.register);
apiRouter.post('/auth/login', AuthController.login);

// All business APIs require authentication
apiRouter.use(authMiddleware);
apiRouter.get('/auth/me', AuthController.getCurrentUser);

// Dictionaries (User & Public)
apiRouter.get('/dictionaries/my', DictionaryController.getMyDictionaries);
apiRouter.get('/dictionaries/my/:dictionaryId/words', DictionaryController.getMyDictionaryWords);
apiRouter.get('/dictionaries', DictionaryController.getAllDictionaries);
apiRouter.post('/dictionaries', DictionaryController.createDictionary);
apiRouter.get('/dictionaries/:id', DictionaryController.getDictionaryById);
apiRouter.put('/dictionaries/:id', DictionaryController.updateDictionary);
apiRouter.delete('/dictionaries/:id', DictionaryController.deleteDictionary);
apiRouter.post('/dictionaries/:id/words/:wordId', DictionaryController.addWord);
apiRouter.post('/dictionaries/:id/words', DictionaryController.addWord);
apiRouter.delete('/dictionaries/:id/words/:wordId', DictionaryController.removeWord);
apiRouter.post('/dictionaries/:id/words/batch', DictionaryController.batchAddWords);

// Word in User's Dictionaries
apiRouter.get('/words/:wordId/my-dictionaries', DictionaryController.getWordMyDictionaries);
apiRouter.post('/words/:wordId/my-dictionaries', DictionaryController.syncWordMyDictionaries);

// AI sentence import tool
apiRouter.post('/admin/ai-sentence-tool/analyze', requirePermission('ai.sentence.generate'), AdminSentenceAIToolController.analyze);
apiRouter.post('/admin/ai-sentence-tool/import', requirePermission('ai.sentence.import'), AdminSentenceAIToolController.import);
apiRouter.post('/admin/excel-import', requirePermission('import.excel'), AdminExcelImportController.import);

// RBAC administration
apiRouter.get('/admin/users', requirePermission('user.read'), RbacController.listUsers);
apiRouter.get('/admin/roles', requirePermission('role.read'), RbacController.listRoles);
apiRouter.post('/admin/roles', requirePermission('role.create'), RbacController.createRole);
apiRouter.put('/admin/roles/:id', requirePermission('role.update'), RbacController.updateRole);
apiRouter.delete('/admin/roles/:id', requirePermission('role.delete'), RbacController.deleteRole);
apiRouter.get('/admin/permissions', requirePermission('permission.read'), RbacController.listPermissions);
apiRouter.get('/admin/roles/:id/permissions', requirePermission('role.read'), RbacController.getRolePermissions);
apiRouter.put('/admin/roles/:id/permissions', requirePermission('role.update'), RbacController.setRolePermissions);
apiRouter.get('/admin/users/:userId/roles', requirePermission('role.read'), RbacController.getUserRoles);
apiRouter.put('/admin/users/:userId/roles', requirePermission('role.assign'), RbacController.setUserRoles);

// Admin Dictionaries
apiRouter.get('/admin/dictionaries', requirePermission('dictionary.read'), DictionaryController.getAdminDictionaries);
apiRouter.post('/admin/dictionaries', requirePermission('dictionary.create'), DictionaryController.createAdminDictionary);
apiRouter.put('/admin/dictionaries/:id', requirePermission('dictionary.update'), DictionaryController.updateAdminDictionary);
apiRouter.delete('/admin/dictionaries/:id', requirePermission('dictionary.delete'), DictionaryController.deleteAdminDictionary);
apiRouter.post('/admin/dictionaries/:id/import', requirePermission('word.import'), DictionaryController.importAdminWords);

// Dictionary Config (Preferences)
apiRouter.get('/dictionary/config', DictionaryController.getConfig);
apiRouter.post('/dictionary/config', DictionaryController.updateConfig);
apiRouter.put('/dictionary/config', DictionaryController.updateConfig);

// Study Sessions (Unified Learn & Write Step)
apiRouter.post('/study-sessions/preview', StudySessionController.previewSession);
apiRouter.post('/study-sessions', StudySessionController.createSession);
apiRouter.get('/study-sessions/current', StudySessionController.getActiveSession);
apiRouter.get('/study-sessions/:id', StudySessionController.getSessionById);
apiRouter.post('/study-sessions/:id/learn/:wordId', StudySessionController.markWordLearned);
apiRouter.post('/study-sessions/:id/write/:wordId', StudySessionController.writeWord);
apiRouter.post('/study-sessions/:id/next', StudySessionController.nextWord);
apiRouter.post('/study-sessions/:id/cancel', StudySessionController.cancelSession);

// Words (Legacy / auxiliary catalogue compatibility)
apiRouter.get('/words/today', WordController.getTodayWords);
apiRouter.get('/words/wrong', WordController.getWrongWords);
apiRouter.get('/words/lookup', WordController.lookupWord);
apiRouter.get('/words/:id', WordController.getWordById);
apiRouter.get('/words/:id/phonics', WordController.getWordPhonics);
apiRouter.get('/words/:id/meanings', WordController.getWordMeanings);
apiRouter.post('/words/:id/answer', WordController.checkAnswer);
apiRouter.post('/words/:id/learn', WordController.markLearned);

// Review
apiRouter.get('/review/today', ReviewController.getTodayReview);
apiRouter.post('/review/:id', ReviewController.submitReview);

// Sentences (Preserved 100%)
apiRouter.get('/sentences', SentenceController.getAllSentences);
apiRouter.get('/sentences/today', SentenceController.getTodaySentences);
apiRouter.get('/sentences/:id', SentenceController.getSentenceById);
apiRouter.get('/sentences/:id/steps', SentenceController.getSentenceSteps);
apiRouter.post('/sentences/:id/complete', SentenceController.completeSentence);

// Sentence Practice (Progressive Phrase -> Rebuild Sessions)
apiRouter.get('/sentence-practice/preview', SentencePracticeController.preview);
apiRouter.post('/sentence-practice', SentencePracticeController.createSession);
apiRouter.get('/sentence-practice/current', SentencePracticeController.getCurrentSession);
apiRouter.get('/sentence-practice/:id', SentencePracticeController.getSessionById);
apiRouter.post('/sentence-practice/:id/answer', SentencePracticeController.submitAnswer);
apiRouter.post('/sentence-practice/:id/retry', SentencePracticeController.retryCurrentSentence);
apiRouter.post('/sentence-practice/:id/cancel', SentencePracticeController.cancelSession);

// Statistics
apiRouter.get('/statistics/today', StatisticsController.getTodayStatistics);
apiRouter.get('/statistics/overview', StatisticsController.getOverviewStatistics);
