import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { WordController } from '../controllers/wordController.ts';
import { ReviewController } from '../controllers/reviewController.ts';
import { SentenceController } from '../controllers/sentenceController.ts';
import { DictionaryController } from '../controllers/dictionaryController.ts';
import { StatisticsController } from '../controllers/statisticsController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

export const apiRouter = Router();

// Apply auth middleware for context
apiRouter.use(authMiddleware);

// Auth
apiRouter.post('/auth/register', AuthController.register);
apiRouter.post('/auth/login', AuthController.login);
apiRouter.get('/auth/me', AuthController.getCurrentUser);

// Words
apiRouter.get('/words/today', WordController.getTodayWords);
apiRouter.get('/words/wrong', WordController.getWrongWords);
apiRouter.get('/words/:id', WordController.getWordById);
apiRouter.get('/words/:id/phonics', WordController.getWordPhonics);
apiRouter.get('/words/:id/meanings', WordController.getWordMeanings);
apiRouter.post('/words/:id/answer', WordController.checkAnswer);
apiRouter.post('/words/:id/learn', WordController.markLearned);

// Review
apiRouter.get('/review/today', ReviewController.getTodayReview);
apiRouter.post('/review/:id', ReviewController.submitReview);

// Sentences
apiRouter.get('/sentences', SentenceController.getAllSentences);
apiRouter.get('/sentences/today', SentenceController.getTodaySentences);
apiRouter.get('/sentences/:id', SentenceController.getSentenceById);
apiRouter.get('/sentences/:id/steps', SentenceController.getSentenceSteps);
apiRouter.post('/sentences/:id/complete', SentenceController.completeSentence);

// Dictionary Config
apiRouter.get('/dictionary/config', DictionaryController.getConfig);
apiRouter.post('/dictionary/config', DictionaryController.updateConfig);
apiRouter.put('/dictionary/config', DictionaryController.updateConfig);

// Statistics
apiRouter.get('/statistics/today', StatisticsController.getTodayStatistics);
apiRouter.get('/statistics/overview', StatisticsController.getOverviewStatistics);
