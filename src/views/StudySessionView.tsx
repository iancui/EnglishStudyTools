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
  BookOpen
} from 'lucide-react';
import { api } from '../api/client.ts';
import { StudySessionItem, StudySessionWordItem, WordItem } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';
import { PhonicsSplitter } from '../components/PhonicsSplitter.tsx';
import { AddToDictionaryButton } from '../components/AddToDictionaryButton.tsx';

interface StudySessionViewProps {
  sessionId: string;
  navigate: (route: string) => void;
  config: any;
}

export const StudySessionView: React.FC<StudySessionViewProps> = ({
  sessionId,
  navigate,
  config
}) => {
  const [session, setSession] = useState<StudySessionItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Current word state
  // Step in the current word: 'LEARN' vs 'WRITE'
  const [wordStep, setWordStep] = useState<'LEARN' | 'WRITE'>('LEARN');

  // Learn stage states
  const [showPhonics, setShowPhonics] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<'normal' | 'slow'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Write stage states
  const [showPhonetic, setShowPhonetic] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [writeResult, setWriteResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    phonetic?: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await api.getStudySessionById(sessionId);
      setSession(data);

      // Determine initial wordStep based on current word's progress
      const currentWordItem = data.words[data.currentWordIndex];
      if (currentWordItem && currentWordItem.learnStatus === 'LEARNED' && !currentWordItem.completed) {
        setWordStep('WRITE');
      } else {
        setWordStep('LEARN');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentSessionWord = session?.words[session.currentWordIndex];
  const wordData = currentSessionWord?.word;

  // Reset write form when word or step changes
  useEffect(() => {
    if (wordStep === 'WRITE') {
      setUserInput('');
      setHasSubmitted(false);
      setWriteResult(null);
      setShowPhonetic(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setShowPhonics(false);
      if (wordData) {
        playWordAudio('normal');
      }
    }
  }, [session?.currentWordIndex, wordStep]);

  const playWordAudio = useCallback(async (speed: 'normal' | 'slow' = audioSpeed) => {
    if (!wordData) return;
    setIsSpeaking(true);
    const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
    const rate = speed === 'slow' ? 0.75 : 1.0;
    await SpeechPlayer.speak(wordData.text, { lang, rate });
    setIsSpeaking(false);
  }, [wordData, config, audioSpeed]);

  // Transition from Learn to Write for current word
  const handleProceedToWrite = async () => {
    if (!session || !currentSessionWord) return;
    try {
      await api.learnSessionWord(session.id, currentSessionWord.wordId);
      setWordStep('WRITE');
    } catch (e) {
      console.error(e);
      setWordStep('WRITE');
    }
  };

  // Submit spelling in Write stage
  const handleSubmitSpelling = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session || !currentSessionWord || !userInput.trim() || hasSubmitted) return;

    try {
      const res = await api.writeSessionWord(
        session.id,
        currentSessionWord.wordId,
        userInput.trim()
      );

      setWriteResult({
        isCorrect: res.isCorrect,
        correctAnswer: res.correctAnswer,
        phonetic: res.phonetic
      });
      setHasSubmitted(true);

      // Play pronunciation on evaluation
      const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
      SpeechPlayer.speak(res.correctAnswer, { lang });

      // Refresh session object for updated completed count
      const updatedSession = await api.getStudySessionById(session.id);
      setSession(updatedSession);
    } catch (err) {
      console.error(err);
    }
  };

  // Move to next word in the session
  const handleNextWord = async () => {
    if (!session) return;

    if (session.currentWordIndex < session.totalCount - 1) {
      try {
        await api.nextSessionWord(session.id);
        const updated = await api.getStudySessionById(session.id);
        setSession(updated);
        setWordStep('LEARN');
      } catch (e) {
        console.error(e);
      }
    } else {
      // Completed last word
      const updated = await api.getStudySessionById(session.id);
      setSession(updated);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm">正在加载学习任务...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">未找到该学习任务</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    );
  }

  // Session Completed Summary Screen
  const isSessionFullyCompleted = session.status === 'COMPLETED' || session.completedCount >= session.totalCount;

  if (isSessionFullyCompleted && (currentSessionWord?.completed || session.currentWordIndex === session.totalCount - 1 && hasSubmitted)) {
    const correctWords = session.words.filter(w => w.isCorrect).length;
    const wrongWords = session.words.filter(w => w.isCorrect === false).length;
    const accuracy = session.totalCount > 0 ? Math.round((correctWords / session.totalCount) * 100) : 100;

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <Trophy className="w-10 h-10 text-amber-700" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-950 font-serif">
            学习任务完成！
          </h1>
          <p className="text-stone-500 text-sm">
            你已完整学完并背写了本次设定的全部 {session.totalCount} 个单词。
          </p>
        </div>

        {/* Results summary stats */}
        <div className="grid grid-cols-3 gap-3 bg-white border border-stone-200 rounded-2xl p-5 shadow-sm text-left">
          <div className="text-center">
            <div className="text-xs text-stone-400">学习总词数</div>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-0.5">
              {session.totalCount}
            </div>
          </div>
          <div className="text-center border-x border-stone-100">
            <div className="text-xs text-stone-400">拼写正确</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">
              {correctWords}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-stone-400">正确率</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-0.5">
              {accuracy}%
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            返回学习首页
          </button>
          <button
            onClick={() => navigate('/words/wrong')}
            className="px-6 py-3 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-sm font-medium transition-all"
          >
            查看错词本 ({wrongWords})
          </button>
        </div>
      </div>
    );
  }

  if (!wordData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">未找到单词数据</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm"
        >
          返回首页
        </button>
      </div>
    );
  }

  const activePhonetic = config?.phoneticType === 'US'
    ? (wordData.phoneticUs || wordData.phoneticUk)
    : (wordData.phoneticUk || wordData.phoneticUs);

  const primaryMeaning = wordData.meanings[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Task Metadata */}
      <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-stone-700 hover:text-stone-950 transition-colors flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs"
            title="退出当前学习，进度已实时自动暂存"
          >
            <ChevronLeft className="w-4 h-4 text-stone-500" />
            <span>暂存并返回</span>
          </button>
          <span className="text-stone-300">|</span>
          <span className="text-xs text-stone-600 font-medium">
            {session.dictionary?.name || '当前辞书'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Two-phase step pills: 学 vs 背写 */}
          <div className="flex items-center gap-1 text-xs font-medium">
            <span
              className={`px-2.5 py-1 rounded-md transition-colors ${
                wordStep === 'LEARN'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              1. 学
            </span>
            <span className="text-stone-300">→</span>
            <span
              className={`px-2.5 py-1 rounded-md transition-colors ${
                wordStep === 'WRITE'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              2. 背写
            </span>
          </div>

          <div className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
            {session.currentWordIndex + 1} / {session.totalCount}
          </div>
        </div>
      </div>

      {/* STAGE 1: 学单词 (LEARN) */}
      {wordStep === 'LEARN' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-14 text-center shadow-sm space-y-8 animate-fadeIn">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-amber-700 tracking-wider uppercase">
              第一阶段：学
            </div>
            {/* Dominant Word Typography */}
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-stone-950 font-serif">
              {wordData.text}
            </h1>

            {/* Phonetic & Accent indication */}
            <div className="flex items-center justify-center gap-3 text-stone-500 text-lg sm:text-xl font-mono">
              <span>{activePhonetic}</span>
              <span className="text-xs uppercase font-sans text-stone-400">
                ({config?.phoneticType || 'UK'})
              </span>
            </div>
          </div>

          {/* Audio Player Controls & Dictionary Bookmark */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => playWordAudio('normal')}
              className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 text-sm font-medium ${
                !isSpeaking
                  ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                  : 'bg-amber-400 border-amber-400 text-stone-950 scale-105'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>标准朗读</span>
            </button>

            <button
              onClick={() => {
                setAudioSpeed(s => (s === 'normal' ? 'slow' : 'normal'));
                playWordAudio(audioSpeed === 'normal' ? 'slow' : 'normal');
              }}
              className="px-4 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-all flex items-center gap-1.5 text-xs font-medium"
              title="慢速朗读"
            >
              <Snail className="w-3.5 h-3.5 text-stone-500" />
              <span>慢速 (0.75x)</span>
            </button>

            <button
              onClick={() => setShowPhonics(prev => !prev)}
              className={`px-4 py-2.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-medium ${
                showPhonics
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{showPhonics ? '收起拆分' : '自然拼读拆分'}</span>
            </button>

            {/* Add to user's personal dictionary */}
            <AddToDictionaryButton word={wordData} />
          </div>

          {/* Phonics Splitter Section */}
          {showPhonics && (
            <div className="pt-2">
              <PhonicsSplitter
                wordText={wordData.text}
                phonics={wordData.phonics}
                audioType={config?.audioType || 'UK'}
              />
            </div>
          )}

          {/* Meaning & Example Card */}
          <div className="pt-4 border-t border-stone-100 max-w-lg mx-auto text-left space-y-3">
            {wordData.meanings.map((m, idx) => (
              <div key={m.id || idx} className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif italic font-semibold text-amber-800 text-base">
                    {m.pos}
                  </span>
                  <span className="text-xl font-bold text-stone-800">
                    {m.definitionCn}
                  </span>
                </div>
                {m.exampleEn && (
                  <div className="bg-stone-50 rounded-xl p-3 text-xs space-y-1 mt-2 border border-stone-100">
                    <div className="text-stone-800 font-medium">{m.exampleEn}</div>
                    <div className="text-stone-500">{m.exampleCn}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action: Proceed to Write Step for this word */}
          <div className="pt-4">
            <button
              onClick={handleProceedToWrite}
              className="w-full max-w-md mx-auto py-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-base"
            >
              <span>我学会了，进入背写</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: 背写单词 (WRITE) */}
      {wordStep === 'WRITE' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-14 text-center shadow-sm space-y-8 animate-fadeIn">
          {/* Chinese Prompt & POS */}
          <div className="space-y-3">
            <span className="text-sm font-serif italic text-amber-800 font-semibold bg-amber-50 px-3 py-1 rounded-full">
              {primaryMeaning?.pos || wordData.pos}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight">
              {primaryMeaning?.definitionCn || '释义'}
            </h2>
          </div>

          {/* Optional Phonetic Reveal & Add to My Dictionary */}
          <div className="flex items-center justify-center gap-3">
            {!showPhonetic ? (
              <button
                type="button"
                onClick={() => setShowPhonetic(true)}
                className="text-xs text-stone-500 hover:text-stone-800 py-1.5 px-3 rounded-lg border border-dashed border-stone-300 hover:border-stone-400 transition-colors inline-flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>[显示音标提示]</span>
              </button>
            ) : (
              <div className="text-lg font-mono text-stone-600 animate-fadeIn">
                {activePhonetic}
              </div>
            )}

            <AddToDictionaryButton word={wordData} variant="compact" />
          </div>

          {/* User Input Form */}
          <form onSubmit={handleSubmitSpelling} className="max-w-md mx-auto space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={hasSubmitted}
                placeholder="输入英文单词..."
                className={`w-full text-center text-2xl font-medium px-4 py-3.5 rounded-2xl border-2 transition-all outline-none font-serif ${
                  !hasSubmitted
                    ? 'border-stone-200 focus:border-stone-900 bg-white'
                    : writeResult?.isCorrect
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                    : 'border-rose-400 bg-rose-50/50 text-rose-900'
                }`}
              />
            </div>

            {!hasSubmitted && (
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold rounded-xl transition-all shadow-sm text-base"
              >
                提交验证 (Enter)
              </button>
            )}
          </form>

          {/* Feedback & Result */}
          {hasSubmitted && writeResult && (
            <div className="animate-fadeIn max-w-md mx-auto space-y-5">
              {writeResult.isCorrect ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-base">回答正确！</div>
                    <div className="text-xs text-emerald-700 mt-0.5">
                      本词已顺利完成学与背写闭环
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-rose-700">
                    <XCircle className="w-5 h-5" />
                    <span>回答错误</span>
                  </div>
                  <div className="text-sm">
                    正确答案：
                    <span className="font-bold text-lg font-serif text-rose-950 ml-1">
                      {writeResult.correctAnswer}
                    </span>
                    <span className="text-stone-500 font-mono text-xs ml-2">
                      {writeResult.phonetic}
                    </span>
                  </div>
                  <div className="text-xs text-rose-600">已自动归入错词本与复习队列</div>
                </div>
              )}

              {/* Action buttons after submission */}
              <div className="flex gap-2">
                {!writeResult.isCorrect && (
                  <button
                    type="button"
                    onClick={() => {
                      setHasSubmitted(false);
                      setUserInput('');
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="flex-1 py-3.5 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>再试一次</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextWord}
                  className="flex-1 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <span>
                    {session.currentWordIndex === session.totalCount - 1
                      ? '完成本次学习任务'
                      : '下一个单词'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
