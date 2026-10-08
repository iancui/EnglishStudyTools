import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Split,
  Eye,
  CheckCircle2,
  XCircle,
  Snail,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  Check,
  Headphones
} from 'lucide-react';
import { api } from '../api/client.ts';
import { StudySessionItem, StudySessionWordItem, WordItem } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';
import { PhonicsSplitter } from '../components/PhonicsSplitter.tsx';
import { AddToDictionaryButton } from '../components/AddToDictionaryButton.tsx';
import { ImmersionHeader } from '../components/ImmersionHeader.tsx';

interface StudySessionViewProps {
  sessionId: string;
  navigate: (route: string) => void;
  config: any;
}

let renderCount = 0;
export const StudySessionView: React.FC<StudySessionViewProps> = ({
  sessionId,
  navigate,
  config
}) => {
  const [session, setSession] = useState<StudySessionItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [wordStep, setWordStep] = useState<'LEARN' | 'WRITE'>('LEARN');

  const [showPhonics, setShowPhonics] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<'normal' | 'slow'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [userInput, setUserInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [writeResult, setWriteResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    phonetic?: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const isPendingRef = useRef(false);
  const lastHandledIdxRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('[MOUNT] StudySessionView sessionId=', sessionId);
    return () => {
      isMountedRef.current = false;
      console.log('[UNMOUNT] StudySessionView sessionId=', sessionId);
    };
  }, [sessionId]);

  renderCount++;
  console.log(`[RENDER] #${renderCount}`, {
    sessionId, loading, hasSession: !!session, wordStep,
    mode: session?.mode, currentIdx: session?.currentWordIndex,
  });

  useEffect(() => {
    console.log('[LOAD] start sessionId=', sessionId);
    lastHandledIdxRef.current = null;
    let cancelled = false;
    const run = async () => {
      try {
        const data = await api.getStudySessionById(sessionId);
        if (cancelled || !isMountedRef.current) return;
        console.log('[LOAD] success', { mode: data.mode, idx: data.currentWordIndex });

        const currentWordItem = data.words[data.currentWordIndex];
        const initialStep: 'LEARN' | 'WRITE' =
          data.phase === 'DICTATION' ||
          data.mode === 'WRITE_ONLY' ||
          (currentWordItem?.learnStatus === 'LEARNED' && !currentWordItem.completed)
            ? 'WRITE' : 'LEARN';

        setSession(data);
        setWordStep(initialStep);
        setLoading(false);

        if (data.status === 'COMPLETED' && data.completedCount >= data.totalCount) {
          setShowCompletionScreen(true);
        }

        lastHandledIdxRef.current = data.currentWordIndex;
      } catch (e) {
        if (!cancelled && isMountedRef.current) {
          setLoading(false);
          console.error(e);
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [sessionId]);

  const currentSessionWord = session?.words[session.currentWordIndex];
  const wordData = currentSessionWord?.word;

  useEffect(() => {
    if (!session || !wordData) return;
    if (session.phase === 'DICTATION' || session.mode === 'WRITE_ONLY') {
      playWordAudio('normal');
    } else if (wordStep === 'LEARN') {
      playWordAudio('normal');
    }
  }, [session?.currentWordIndex]);

  useEffect(() => {
    if (!session) return;
    const idx = session.currentWordIndex;
    if (idx === lastHandledIdxRef.current) return;
    lastHandledIdxRef.current = idx;

    setUserInput('');
    setHasSubmitted(false);
    setWriteResult(null);
    setShowPhonics(false);

    const cw = session.words[idx];
    const nextStep: 'LEARN' | 'WRITE' =
      session.phase === 'DICTATION' ||
      session.mode === 'WRITE_ONLY' ||
      (cw?.learnStatus === 'LEARNED' && !cw.completed)
        ? 'WRITE' : 'LEARN';
    setWordStep(nextStep);

    if (nextStep === 'WRITE') {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [session?.currentWordIndex]);

  const playWordAudio = useCallback(async (speed: 'normal' | 'slow' = audioSpeed) => {
    if (!wordData) return;
    setIsSpeaking(true);
    const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
    const rate = speed === 'slow' ? 0.75 : 1.0;
    await SpeechPlayer.speak(wordData.text, { lang, rate });
    setIsSpeaking(false);
  }, [wordData, config, audioSpeed]);

  const handleProceedToWrite = async () => {
    if (!session || !currentSessionWord || isPendingRef.current) return;
    isPendingRef.current = true;
    try {
      const res = await api.learnSessionWord(session.id, currentSessionWord.wordId);
      if (!isMountedRef.current) return;
      if (res?.phaseChanged && res?.session) {
        setSession(res.session);
        setWordStep('WRITE');
        setUserInput('');
        setHasSubmitted(false);
        setWriteResult(null);
        setShowCompletionScreen(false);
        return;
      }
      if (res?.sessionCompleted && res?.session) {
        setSession(res.session);
        setShowCompletionScreen(true);
        return;
      }
      if (res?.session) {
        setSession(res.session);
        setWordStep('LEARN');
        setUserInput('');
        setHasSubmitted(false);
        setWriteResult(null);
        return;
      }
      setWordStep('WRITE');
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (e) {
      console.error(e);
      setWordStep('WRITE');
    } finally {
      isPendingRef.current = false;
    }
  };

  const handleSubmitSpelling = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (hasSubmitted) {
      if (writeResult?.isCorrect) {
        await handleNextWord();
      } else {
        setHasSubmitted(false);
        setUserInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return;
    }

    if (!session || !currentSessionWord || !userInput.trim()) return;
    if (isPendingRef.current) return;
    isPendingRef.current = true;

    const wordId = currentSessionWord.wordId;

    try {
      const res = await api.writeSessionWord(session.id, wordId, userInput.trim());
      if (!isMountedRef.current) return;

      if (res.phaseChanged && res.session) {
        // The write stage has just completed. The same batch now enters
        // reinforcement dictation without creating a new batch.
        setSession(res.session);
        setWordStep('WRITE');
        setUserInput('');
        setHasSubmitted(false);
        setWriteResult(null);
        setShowCompletionScreen(false);
        return;
      }

      setWriteResult({
        isCorrect: res.isCorrect,
        correctAnswer: res.correctAnswer,
        phonetic: res.phonetic
      });
      setHasSubmitted(true);

      const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
      SpeechPlayer.speak(res.correctAnswer, { lang });

      setSession(prev => {
        if (!prev) return prev;
        const updatedWords = prev.words.map(w =>
          w.wordId === wordId
            ? { ...w, ...res.sessionWord }
            : w
        );
        let updatedSession = {
          ...prev,
          words: updatedWords,
          completedCount: res.completedCount,
        };
        if (res.sessionCompleted) {
          updatedSession = {
            ...updatedSession,
            status: 'COMPLETED' as const,
          };
          setShowCompletionScreen(true);
        }
        return updatedSession;
      });
    } catch (err) {
      console.error(err);
    } finally {
      isPendingRef.current = false;
    }
  };

  const handleNextWord = async () => {
    if (!session || !writeResult?.isCorrect) return;
    if (isPendingRef.current) return;
    if (session.currentWordIndex >= session.totalCount - 1) {
      setShowCompletionScreen(true);
      return;
    }
    isPendingRef.current = true;
    try {
      const nextSession = await api.nextSessionWord(session.id);
      if (!isMountedRef.current) return;
      setSession(nextSession);
    } catch (err) {
      console.error(err);
    } finally {
      isPendingRef.current = false;
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (!session || showCompletionScreen) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;

      e.preventDefault();

      if (wordStep === 'LEARN') {
        handleProceedToWrite();
      } else if (wordStep === 'WRITE' && hasSubmitted && writeResult) {
        if (writeResult.isCorrect) {
          handleNextWord();
        } else {
          setHasSubmitted(false);
          setUserInput('');
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, showCompletionScreen, wordStep, hasSubmitted, writeResult]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#4F7DF3] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8BA0BD] text-sm">正在加载学习任务...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 border border-[#E7EEF8] shadow-xs">
          <h2 className="text-xl font-bold text-[#29466F]">未找到该学习任务</h2>
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

  // Session Completed Summary Screen: shown when explicitly reached end or when opening an already completed session
  const isSessionFullyCompleted =
    showCompletionScreen ||
    (session.status === 'COMPLETED' && (!hasSubmitted || !writeResult));

  if (isSessionFullyCompleted) {
    const correctWords = session.words.filter(w => w.completed && w.isCorrect).length;
    const wrongWords = session.words.filter(w => w.isCorrect === false).length;
    const accuracy = session.totalCount > 0 ? Math.round((correctWords / session.totalCount) * 100) : 100;

    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col">
        <ImmersionHeader
          title={session.phase === 'DICTATION' || session.mode === 'WRITE_ONLY' ? '强化听写完成' : '背单词完成'}
          currentIndex={session.totalCount}
          totalCount={session.totalCount}
          onExit={() => navigate('/')}
        />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn flex flex-col justify-center">
          <div className="w-20 h-20 rounded-3xl bg-[#EBF2FE] text-[#4F7DF3] flex items-center justify-center mx-auto shadow-xs">
            {session.phase === 'DICTATION' || session.mode === 'WRITE_ONLY' ? (
              <Headphones className="w-10 h-10 text-[#4F7DF3]" />
            ) : (
              <Trophy className="w-10 h-10 text-[#4F7DF3]" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#29466F]">
              {session.phase === 'DICTATION' || session.mode === 'WRITE_ONLY' ? '🎉 强化听写完成！' : '恭喜！学习任务顺利完成'}
            </h1>
            <p className="text-[#8BA0BD] text-sm">
              {session.phase === 'DICTATION' || session.mode === 'WRITE_ONLY'
                ? `本次强化听写共 ${session.totalCount} 个，正确 ${correctWords} 个，错误 ${wrongWords} 个。`
                : `你已完成本批次 ${session.totalCount} 个单词的学习与背写，接下来将进行强化听写。`}
            </p>
          </div>

          {/* Results summary stats */}
          <div className="grid grid-cols-3 gap-3 bg-white border border-[#E7EEF8] rounded-2xl p-6 shadow-2xs text-left">
            <div className="text-center">
              <div className="text-xs text-[#8BA0BD]">
                {session.mode === 'WRITE_ONLY' ? '听写总词数' : '学习总词数'}
              </div>
              <div className="text-2xl font-bold font-mono text-[#29466F] mt-1">
                {session.totalCount}
              </div>
            </div>
            <div className="text-center border-x border-[#E7EEF8]">
              <div className="text-xs text-[#8BA0BD]">拼写正确</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                {correctWords}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[#8BA0BD]">正确率</div>
              <div className="text-2xl font-bold font-mono text-[#4F7DF3] mt-1">
                {accuracy}%
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3.5 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white rounded-2xl text-sm font-bold transition-all shadow-xs cursor-pointer"
            >
              返回首页
            </button>
            <button
              onClick={() => navigate('/words/wrong')}
              className="px-6 py-3.5 border border-[#E7EEF8] bg-white hover:bg-[#F7FAFF] text-[#29466F] rounded-2xl text-sm font-semibold transition-all shadow-2xs cursor-pointer"
            >
              查看错词本 ({wrongWords})
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!wordData) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 border border-[#E7EEF8]">
          <h2 className="text-xl font-bold text-[#29466F]">未找到单词数据</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#4F7DF3] text-white rounded-xl text-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const activePhonetic = config?.phoneticType === 'US'
    ? (wordData.phoneticUs || wordData.phoneticUk)
    : (wordData.phoneticUk || wordData.phoneticUs);

  const primaryMeaning = wordData.meanings[0];

  return (
    <div className="min-h-screen bg-[#F7FAFF] flex flex-col text-[#29466F]">
      {/* Immersive Learning Header */}
      <ImmersionHeader
        title={session.phase === 'DICTATION' ? '强化听写' : session.mode === 'WRITE_ONLY' ? '单词听写' : (session.dictionary?.name || '背单词')}
        subtitle={
          session.phase === 'DICTATION'
            ? '阶段三：听音回忆 · 强化拼写'
            : session.mode === 'WRITE_ONLY'
            ? '听音看释义 · 默写拼写'
            : wordStep === 'LEARN'
            ? '阶段一：认知学习'
            : '阶段二：汉译英背写'
        }
        currentIndex={session.currentWordIndex + 1}
        totalCount={session.totalCount}
        onExit={() => navigate('/')}
        rightExtra={
          session.phase === 'DICTATION' ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold mr-1">
              <span className="px-3 py-1 rounded-lg bg-[#EBF2FE] text-[#4F7DF3] flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                <span>强化听写</span>
              </span>
            </div>
          ) : session.mode === 'WRITE_ONLY' ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold mr-1">
              <span className="px-3 py-1 rounded-lg bg-[#EBF2FE] text-[#4F7DF3] flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                <span>听写模式</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold mr-1">
              <span
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  wordStep === 'LEARN'
                    ? 'bg-[#EBF2FE] text-[#4F7DF3]'
                    : 'text-[#8BA0BD]'
                }`}
              >
                1. 学
              </span>
              <span className="text-[#8BA0BD]/40">·</span>
              <span
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  wordStep === 'WRITE'
                    ? 'bg-[#EBF2FE] text-[#4F7DF3]'
                    : 'text-[#8BA0BD]'
                }`}
              >
                2. 背写
              </span>
            </div>
          )
        }
      />

      {/* Main Spacious Learning Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-16 max-w-3xl w-full mx-auto animate-fadeIn">
        {/* ========================================================= */}
        {/* STAGE 1: 学单词 (LEARN) */}
        {/* ========================================================= */}
        {wordStep === 'LEARN' && (
          <div className="w-full text-center space-y-8 sm:space-y-10">
            {/* Word Typography & Phonetic with Audio */}
            <div className="space-y-4">
              {/* Dominant Word Typography */}
              <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[#29466F]">
                {wordData.text}
              </h1>

              {/* Phonetic & Audio Speaker */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg sm:text-xl font-mono text-[#8BA0BD]">
                  {activePhonetic}
                </span>

                <button
                  type="button"
                  onClick={() => playWordAudio('normal')}
                  disabled={isSpeaking}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isSpeaking
                      ? 'bg-[#4F7DF3] text-white scale-105 shadow-xs'
                      : 'bg-white border border-[#E7EEF8] text-[#4F7DF3] hover:bg-[#EBF2FE]'
                  }`}
                  title="播放发音"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Speed, Phonics Splitter & Bookmark */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAudioSpeed(s => (s === 'normal' ? 'slow' : 'normal'));
                  playWordAudio(audioSpeed === 'normal' ? 'slow' : 'normal');
                }}
                className="px-3.5 py-2 rounded-xl border border-[#E7EEF8] bg-white hover:bg-[#F7FAFF] text-[#8BA0BD] hover:text-[#29466F] transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="慢速发音"
              >
                <Snail className="w-3.5 h-3.5" />
                <span>{audioSpeed === 'slow' ? '0.75x' : '慢速'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPhonics(prev => !prev)}
                className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  showPhonics
                    ? 'bg-[#29466F] text-white border-[#29466F]'
                    : 'bg-white border-[#E7EEF8] text-[#8BA0BD] hover:text-[#29466F]'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>{showPhonics ? '收起拆分' : '自然拼读'}</span>
              </button>

              <AddToDictionaryButton word={wordData} />
            </div>

            {/* Phonics Splitter Section */}
            {showPhonics && (
              <div className="pt-2 max-w-lg mx-auto">
                <PhonicsSplitter
                  wordText={wordData.text}
                  phonics={wordData.phonics}
                  audioType={config?.audioType || 'UK'}
                />
              </div>
            )}

            {/* Definition (no examples here) */}
            <div className="max-w-lg mx-auto bg-white border border-[#E7EEF8] rounded-3xl p-6 sm:p-8 text-left space-y-3 shadow-2xs">
              {wordData.meanings.map((m, idx) => (
                <div key={m.id || idx} className="space-y-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-serif italic font-bold text-[#4F7DF3] text-base">
                      {m.pos}
                    </span>
                    <span className="text-xl font-bold text-[#29466F]">
                      {m.definitionCn}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA: Proceed to Write Step for this word */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <button
                onClick={handleProceedToWrite}
                className="w-48 py-4 bg-[#4F7DF3] hover:bg-[#3D6CE5] active:scale-95 text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-base mx-auto cursor-pointer"
              >
                <span>进入背写</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-[#8BA0BD] flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[#EBF2FE] text-[#4F7DF3] font-mono font-semibold">Space</kbd>
                快捷进入背写
              </span>
            </div>

            {/* Examples — moved below CTA */}
            {wordData.meanings.some(m => m.exampleEn) && (
              <div className="max-w-lg mx-auto space-y-2.5">
                {wordData.meanings
                  .filter(m => m.exampleEn)
                  .map((m, idx) => (
                    <div
                      key={`ex-${m.id || idx}`}
                      className="bg-white border border-[#E7EEF8] rounded-2xl p-4 text-xs space-y-1 shadow-2xs text-left"
                    >
                      <div className="text-[#29466F] font-semibold leading-relaxed">
                        {m.exampleEn}
                      </div>
                      <div className="text-[#8BA0BD]">
                        {m.exampleCn}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: 背写单词 (WRITE) - Reference Layout */}
        {/* ========================================================= */}
        {wordStep === 'WRITE' && (
          <div className="w-full text-center space-y-8 sm:space-y-10">
            {/* Chinese Prompt & POS */}
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#4F7DF3] bg-[#EBF2FE] px-3.5 py-1 rounded-full">
                {session.phase === 'DICTATION' ? '强化听写' : (primaryMeaning?.pos || wordData.pos || '请写出这个单词')}
              </span>

              {/* Chinese Meaning as Dominant Prompt */}
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#29466F] tracking-tight leading-snug">
                {primaryMeaning?.definitionCn || '根据释义回忆拼写'}
              </h2>

              {/* Phonetic & Audio beside it directly */}
              <div className="flex items-center justify-center gap-3 pt-1">
                {session.phase !== 'DICTATION' && (
                  <span className="text-base sm:text-lg font-mono text-[#8BA0BD]">
                    {activePhonetic}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => playWordAudio('normal')}
                  disabled={isSpeaking}
                  className="w-8 h-8 rounded-full bg-white border border-[#E7EEF8] hover:bg-[#EBF2FE] text-[#4F7DF3] flex items-center justify-center transition-all shadow-2xs"
                  title="播放发音"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                </button>

                <AddToDictionaryButton word={wordData} variant="compact" />
              </div>
            </div>

            {/* Input Form - Visual Center (Width 420-560px, Height 54-58px) */}
            <form onSubmit={handleSubmitSpelling} autoComplete="off" className="max-w-lg w-full mx-auto space-y-5">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="text"
                  enterKeyHint="done"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus={wordStep === 'WRITE' && !hasSubmitted}
                  data-form-type="other"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={hasSubmitted}
                  placeholder={session.phase === 'DICTATION' ? '听音输入英文单词...' : '输入对应英文单词...'}
                  className={`w-full h-14 text-center text-xl sm:text-2xl font-medium px-5 rounded-2xl border-2 transition-all outline-none tracking-wide ${
                    !hasSubmitted
                      ? 'border-[#E7EEF8] focus:border-[#4F7DF3] focus:ring-4 focus:ring-[#4F7DF3]/10 bg-white text-[#29466F]'
                      : writeResult?.isCorrect
                      ? 'border-emerald-400 bg-emerald-50/50 text-emerald-950'
                      : 'border-rose-300 bg-rose-50/50 text-rose-950'
                  }`}
                />
              </div>

              {/* Feedback Display */}
              {hasSubmitted && writeResult && (
                <div className="animate-fadeIn">
                  {writeResult.isCorrect ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>✓ 拼写正确！认知闭环达成</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-rose-700 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>拼写错误，请重新输入本词</span>
                      </div>
                      <div className="text-stone-600">
                        正确英文拼写：<span className="font-bold text-[#29466F] font-mono text-base ml-1">{writeResult.correctAnswer}</span>
                      </div>
                      <div className="text-[11px] text-[#8BA0BD]">
                        请认真记忆正确拼写，必须重新输入正确后方可进入下一词。
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-1">
                {!hasSubmitted ? (
                  <button
                    type="submit"
                    disabled={!userInput.trim()}
                    className="w-44 py-3.5 bg-[#4F7DF3] hover:bg-[#3D6CE5] active:scale-95 disabled:opacity-40 text-white font-bold rounded-2xl transition-all shadow-xs text-sm cursor-pointer"
                  >
                    检查答案 (Enter)
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-3 w-full">
                    {!writeResult?.isCorrect ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHasSubmitted(false);
                          setUserInput('');
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="py-3.5 px-6 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-2xl transition-all text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>重新输入本词 (Enter / Space)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextWord}
                        className="py-3.5 px-8 bg-[#4F7DF3] hover:bg-[#3D6CE5] active:scale-95 text-white font-bold rounded-2xl transition-all flex items-center gap-2 text-xs sm:text-sm shadow-xs cursor-pointer"
                      >
                        <span>
                          {session.currentWordIndex === session.totalCount - 1
                            ? (session.mode === 'WRITE_ONLY' ? '完成听写任务' : '完成学习任务')
                            : '下一个单词'}
                          <span className="ml-1 opacity-70">(Space)</span>
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Bottom Keyboard Hint Bar */}
            <div className="pt-8 flex items-center justify-center gap-6 text-[11px] text-[#8BA0BD] select-none">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#E7EEF8] rounded font-mono text-[10px] text-[#29466F]">Enter</kbd>
                <span>检查 / 下一个</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span>点击 🔊 播放发音</span>
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
