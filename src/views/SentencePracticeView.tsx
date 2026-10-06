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
import { ImmersionHeader } from '../components/ImmersionHeader.tsx';

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
          const fresh = await api.getSentencePracticeSessionById(session.id);
          if (fresh) setSession(fresh);
        }

        setUserInput('');
      } else {
        // Backend confirms wrong! Stay on current step!
        setFeedback({
          isCorrect: false,
          message: res.message || '❌ 再试一次',
          correctAnswer: undefined
        });
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

  const handleExit = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#4F7DF3]" />
        <p className="text-[#8BA0BD] text-sm">正在加载渐进句子练习...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 border border-[#E7EEF8] shadow-xs">
          <h2 className="text-xl font-bold text-[#29466F]">{error || '练习任务不存在'}</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#4F7DF3] text-white rounded-xl text-sm font-semibold hover:bg-[#3D6CE5] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // Session completed celebration view
  if (session.status === 'COMPLETED' || currentSentenceIndex >= session.totalCount) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col">
        <ImmersionHeader
          title="渐进句子完成"
          currentIndex={session.totalCount}
          totalCount={session.totalCount}
          onExit={() => navigate('/')}
        />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn flex flex-col justify-center">
          <div className="w-20 h-20 bg-[#EBF2FE] text-[#4F7DF3] rounded-3xl mx-auto flex items-center justify-center shadow-xs">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#4F7DF3] bg-[#EBF2FE] px-3.5 py-1 rounded-full">
              PRACTICE COMPLETED
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#29466F]">
              渐进句子练习完成！
            </h1>
            <p className="text-sm text-[#8BA0BD] max-w-sm mx-auto">
              你已顺利完成本次 {session.totalCount} 个句子的分步短语输入与整句精准重建。
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E7EEF8] rounded-3xl shadow-2xs space-y-4 text-left">
            <div className="flex items-center justify-between text-sm border-b border-[#E7EEF8] pb-3">
              <span className="text-[#8BA0BD]">练习难度</span>
              <span className="font-bold text-[#29466F] font-mono">{session.difficulty}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-b border-[#E7EEF8] pb-3">
              <span className="text-[#8BA0BD]">完成句子总数</span>
              <span className="font-bold text-[#4F7DF3] font-mono">{session.totalCount} / {session.totalCount} 句</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8BA0BD]">训练核心能力</span>
              <span className="text-xs font-semibold text-[#29466F]">语块拆解拼装 + 整句主动输出</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/')}
              className="py-3.5 px-8 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl shadow-xs text-sm transition-all"
            >
              返回学习中心
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Active in-progress practice view
  const sentence = currentItem?.sentence;
  const totalPhrases = phrases.length;
  const isRebuildPhase = currentPhase === 'REBUILD';

  return (
    <div className="min-h-screen bg-[#F7FAFF] flex flex-col text-[#29466F]">
      {/* Immersive Learning Header */}
      <ImmersionHeader
        title="渐进句子"
        subtitle={isRebuildPhase ? '阶段二：完整长句重建' : '阶段一：短语逐步输入'}
        currentIndex={currentSentenceIndex + 1}
        totalCount={session.totalCount}
        onExit={handleExit}
        rightExtra={
          <span className="text-xs font-bold font-mono text-[#4F7DF3] bg-[#EBF2FE] px-2.5 py-1 rounded-lg">
            {session.difficulty}
          </span>
        }
      />

      {/* Main Spacious Immersive Practice Container */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-16 max-w-3xl w-full mx-auto animate-fadeIn text-center space-y-8 sm:space-y-10">
        {/* Phase Badge & Step Indicator */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3.5 py-1 rounded-full border ${
                isRebuildPhase
                  ? 'bg-[#EBF2FE] text-[#4F7DF3] border-[#D5E3FC]'
                  : 'bg-white text-[#29466F] border-[#E7EEF8]'
              }`}
            >
              {isRebuildPhase ? '✨ 完整句子' : `短语 ${currentPhraseIndex + 1} / ${totalPhrases}`}
            </span>
          </div>

          {/* Chinese Prompt as Primary Visual Focal Point (Font 32px ~ 42px) */}
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#29466F] tracking-tight leading-snug max-w-2xl mx-auto">
            {isRebuildPhase
              ? (sentence?.translation || '暂无译文')
              : (currentPhrase?.chinese || '暂无短语提示')}
          </h2>

          {/* Optional Phonetic & Speaker */}
          <div className="flex items-center justify-center gap-2.5 pt-1">
            {!isRebuildPhase && currentPhrase?.phonetic && (
              <span className="text-stone-400 font-mono text-sm sm:text-base">
                {currentPhrase.phonetic}
              </span>
            )}
            <button
              type="button"
              onClick={() => playAudio()}
              disabled={isSpeaking}
              className="w-8 h-8 rounded-full bg-white border border-[#E7EEF8] hover:bg-[#EBF2FE] text-[#4F7DF3] flex items-center justify-center transition-all shadow-2xs"
              title="播放标准发音"
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {/* Completed building blocks preview so far (helps context) */}
        {!isRebuildPhase && currentPhraseIndex > 0 && (
          <div className="bg-white border border-[#E7EEF8] rounded-2xl p-4 text-xs space-y-2 max-w-xl w-full shadow-2xs">
            <div className="text-[#8BA0BD] font-medium text-[11px] uppercase tracking-wide text-left">
              已构建的前置语块：
            </div>
            <div className="flex flex-wrap gap-2 text-left">
              {phrases.slice(0, currentPhraseIndex).map((p, idx) => (
                <span
                  key={p.id || idx}
                  className="bg-[#F7FAFF] border border-[#D5E3FC] text-[#29466F] font-mono px-3 py-1 rounded-xl text-xs font-semibold"
                >
                  ✓ {p.english}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Input Form (Width 420px ~ 600px, Height 54px ~ 60px) */}
        <form onSubmit={handleSubmit} className="max-w-xl w-full mx-auto space-y-5">
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
              className={`w-full h-14 sm:h-16 text-center text-xl sm:text-2xl font-medium px-5 rounded-2xl border-2 transition-all outline-none tracking-wide ${
                feedback?.isCorrect
                  ? 'border-emerald-400 bg-emerald-50/50 text-emerald-950'
                  : feedback && !feedback.isCorrect
                  ? 'border-rose-300 bg-rose-50/50 text-rose-950'
                  : 'border-[#E7EEF8] bg-white text-[#29466F] focus:border-[#4F7DF3] focus:ring-4 focus:ring-[#4F7DF3]/10'
              }`}
            />
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

          {/* Action Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!userInput.trim() || submitting}
              className="w-40 py-3.5 bg-[#4F7DF3] hover:bg-[#3D6CE5] active:scale-95 text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-40 select-none cursor-pointer mx-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>检查答案</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Grammatical Analysis on rebuild phase (clean collapsible info) */}
        {sentence && sentence.analyses && sentence.analyses.length > 0 && isRebuildPhase && (
          <div className="max-w-xl w-full bg-white border border-[#E7EEF8] rounded-3xl p-6 text-left space-y-3 shadow-2xs">
            <div className="text-xs font-bold text-[#8BA0BD] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#4F7DF3]" />
              <span>语法句法解析</span>
            </div>
            <div className="space-y-2">
              {sentence.analyses.map(a => (
                <div key={a.id} className="bg-[#F7FAFF] rounded-xl p-3 text-xs border border-[#E7EEF8]">
                  <div className="font-semibold text-[#29466F]">{a.text} ({a.type})</div>
                  <div className="text-[#8BA0BD] mt-0.5">{a.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="pt-6 flex items-center justify-center gap-6 text-[11px] text-[#8BA0BD] select-none">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-[#E7EEF8] rounded font-mono text-[10px] text-[#29466F]">Enter</kbd>
            <span>检查答案</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span>点击 🔊 播放发音</span>
          </span>
        </div>
      </main>
    </div>
  );
};
