import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Volume2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  Flag,
  ChevronRight,
  Layers,
  BookOpen
} from 'lucide-react';
import { api } from '../api/client.ts';
import { SentencePracticeSession, SentencePracticeItem, SentencePhrase } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';

interface SentencePracticeViewProps {
  sessionId: string;
  navigate: (route: string) => void;
  config?: any;
}

export const SentencePracticeView: React.FC<SentencePracticeViewProps> = ({
  sessionId,
  navigate,
  config
}) => {
  const [session, setSession] = useState<SentencePracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User input and feedback state
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    correctAnswer?: string;
  } | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSentencePracticeSessionById(sessionId);
      if (!data) {
        setError('未找到该句子练习任务');
        return;
      }
      setSession(data);
      // Reset input on load
      setUserInput('');
      setFeedback(null);
    } catch (e: any) {
      setError(e.message || '加载练习任务失败');
    } finally {
      setLoading(false);
    }
  };

  const currentSentenceIndex = session?.currentSentenceIndex ?? 0;
  const currentItem: SentencePracticeItem | undefined = session?.items?.[currentSentenceIndex];
  const phrases: SentencePhrase[] = currentItem?.phrases || [];
  const currentPhraseIndex = currentItem?.currentPhraseIndex ?? 0;
  const currentPhrase: SentencePhrase | undefined = phrases[currentPhraseIndex];
  const currentPhase = currentItem?.currentPhase || 'PHRASE';

  // Focus input automatically
  useEffect(() => {
    if (!loading && !submitting && session?.status === 'IN_PROGRESS') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [loading, currentSentenceIndex, currentPhraseIndex, currentPhase, session?.status]);

  // Pronunciation handler
  const playAudio = useCallback(async (textToSpeak?: string) => {
    const text = textToSpeak || (
      currentPhase === 'REBUILD'
        ? currentItem?.sentence?.content
        : currentPhrase?.english
    );
    if (!text) return;

    setIsSpeaking(true);
    try {
      const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
      await SpeechPlayer.speak(text, { lang, rate: 0.95 });
    } catch (e) {
      console.warn('Speech error:', e);
    } finally {
      setIsSpeaking(false);
    }
  }, [currentPhase, currentItem, currentPhrase, config]);

  // Submit answer to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || submitting || !session) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await api.submitSentencePracticeAnswer(session.id, userInput.trim());

      if (res.isCorrect) {
        // Backend confirms correct!
        setFeedback({
          isCorrect: true,
          message: res.message || '✓ 正确',
          correctAnswer: res.correctAnswer
        });

        // Play audio confirmation
        playAudio(res.correctAnswer);

        // Update local session state immediately from returned backend data
        if (res.session) {
          setSession(res.session);
        } else {
          // Re-fetch clean session
          const fresh = await api.getSentencePracticeSessionById(session.id);
          if (fresh) setSession(fresh);
        }

        setUserInput('');
      } else {
        // Backend confirms wrong! Stay on current step!
        setFeedback({
          isCorrect: false,
          message: res.message || '❌ 再试一次',
          correctAnswer: undefined // Do NOT disclose answer directly on wrong
        });
        // Select input to allow easy edit/retry
        setTimeout(() => {
          inputRef.current?.select();
        }, 30);
      }
    } catch (e: any) {
      setFeedback({
        isCorrect: false,
        message: e.message || '提交答案失败，请重试'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSession = async () => {
    if (!session) return;
    if (window.confirm('确定要取消本次渐进句子练习吗？')) {
      try {
        await api.cancelSentencePracticeSession(session.id);
        navigate('/');
      } catch (e) {
        navigate('/');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
        <p className="text-stone-500 text-sm">正在加载渐进句子练习...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="text-rose-500 text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-stone-900">{error || '练习任务不存在'}</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800"
        >
          返回首页
        </button>
      </div>
    );
  }

  // Session completed celebration view
  if (session.status === 'COMPLETED' || currentSentenceIndex >= session.totalCount) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
          <Sparkles className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            SESSION COMPLETED
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            太棒了！渐进句子练习完成
          </h1>
          <p className="text-sm text-stone-600 max-w-sm mx-auto">
            你已顺利完成本次 {session.totalCount} 个句子的短语分步输入与整句精准重建。
          </p>
        </div>

        <div className="p-6 bg-white border border-stone-200 rounded-3xl shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between text-sm border-b border-stone-100 pb-3">
            <span className="text-stone-500">练习难度</span>
            <span className="font-bold text-stone-900 font-mono">{session.difficulty}</span>
          </div>
          <div className="flex items-center justify-between text-sm border-b border-stone-100 pb-3">
            <span className="text-stone-500">完成句子总数</span>
            <span className="font-bold text-emerald-700 font-mono">{session.totalCount} / {session.totalCount} 句</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">训练能力</span>
            <span className="text-xs font-semibold text-stone-700">短语积木拆解 + 整句语法输出</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => navigate('/')}
            className="py-3.5 px-8 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl shadow-sm text-sm transition-all"
          >
            返回学习中心
          </button>
        </div>
      </div>
    );
  }

  // Active in-progress practice view
  const sentence = currentItem?.sentence;
  const totalPhrases = phrases.length;
  const isRebuildPhase = currentPhase === 'REBUILD';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Top Session Progress Bar & Controls */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-medium py-1 px-2.5 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首页</span>
        </button>

        <div className="flex items-center gap-2 font-mono font-bold text-stone-700 text-sm">
          <span>第 {currentSentenceIndex + 1} / {session.totalCount} 个句子</span>
          <span className="text-stone-300">|</span>
          <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {session.difficulty}
          </span>
        </div>

        <button
          onClick={handleCancelSession}
          className="text-stone-400 hover:text-rose-600 transition-colors text-xs"
        >
          放弃本次
        </button>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
          style={{
            width: `${Math.round(
              ((currentSentenceIndex + (isRebuildPhase ? 0.8 : (currentPhraseIndex / Math.max(1, totalPhrases)) * 0.7)) /
                session.totalCount) *
                100
            )}%`
          }}
        />
      </div>

      {/* Main Practice Container */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 animate-fadeIn">
        {/* Phase Badge & Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isRebuildPhase
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              {isRebuildPhase ? '✨ 阶段二：完整句子重建' : '🧱 阶段一：短语逐步输入'}
            </span>
          </div>

          <div className="text-xs font-mono font-semibold text-stone-500">
            {isRebuildPhase
              ? '整句输出'
              : `短语 ${currentPhraseIndex + 1} / ${totalPhrases}`}
          </div>
        </div>

        {/* Chinese Prompt & Task */}
        <div className="space-y-3 text-center">
          <span className="text-xs text-stone-400 font-medium tracking-wide">
            {isRebuildPhase ? '请根据完整中文翻译输入整句英文：' : '请根据中文提示输入对应的英文短语：'}
          </span>

          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-snug">
            {isRebuildPhase
              ? (sentence?.translation || '暂无译文')
              : (currentPhrase?.chinese || '暂无短语提示')}
          </h2>

          {/* If there is phonetic for this phrase */}
          {!isRebuildPhase && currentPhrase?.phonetic && (
            <div className="text-stone-400 font-mono text-sm">
              {currentPhrase.phonetic}
            </div>
          )}
        </div>

        {/* Completed building blocks preview so far (helps context) */}
        {!isRebuildPhase && currentPhraseIndex > 0 && (
          <div className="bg-stone-50/80 border border-stone-100 rounded-2xl p-4 text-xs space-y-2">
            <div className="text-stone-400 font-medium text-[11px] uppercase tracking-wide">
              已构建的前置语块：
            </div>
            <div className="flex flex-wrap gap-2">
              {phrases.slice(0, currentPhraseIndex).map((p, idx) => (
                <span
                  key={p.id || idx}
                  className="bg-white border border-emerald-200 text-emerald-900 font-mono px-2.5 py-1 rounded-lg text-xs font-medium shadow-2xs"
                >
                  ✓ {p.english}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={userInput}
              onChange={e => {
                setUserInput(e.target.value);
                if (feedback && !feedback.isCorrect) {
                  setFeedback(null);
                }
              }}
              placeholder={
                isRebuildPhase
                  ? '输入完整的英文句子...'
                  : '输入对应的英文短语...'
              }
              className={`w-full py-4 px-5 rounded-2xl border-2 text-center text-lg sm:text-xl font-medium tracking-wide transition-all focus:outline-hidden ${
                feedback?.isCorrect
                  ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 focus:ring-4 focus:ring-emerald-100'
                  : feedback && !feedback.isCorrect
                  ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-4 focus:ring-rose-100'
                  : 'border-stone-300 bg-white text-stone-900 focus:border-stone-800 focus:ring-4 focus:ring-stone-100'
              }`}
            />

            {/* Audio Button for audio reference */}
            <button
              type="button"
              onClick={() => playAudio()}
              disabled={isSpeaking}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="播放当前标准发音"
            >
              <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-emerald-600 animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Feedback Display */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 animate-fadeIn ${
                feedback.isCorrect
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{feedback.message}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{feedback.message}</span>
                </>
              )}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!userInput.trim() || submitting}
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-base disabled:opacity-50 select-none cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>正在验证答案...</span>
                </>
              ) : (
                <>
                  <span>检查答案</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Auxiliary info / Grammatical analysis (available during rebuild or on demand) */}
        {sentence && sentence.analyses && sentence.analyses.length > 0 && (
          <div className="border-t border-stone-100 pt-6 text-left">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>语法与句法精析</span>
            </div>
            <div className="space-y-2">
              {sentence.analyses.map(a => (
                <div key={a.id} className="bg-stone-50 rounded-xl p-3 text-xs border border-stone-100">
                  <div className="font-semibold text-stone-800">{a.text} ({a.type})</div>
                  <div className="text-stone-500 mt-0.5">{a.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
