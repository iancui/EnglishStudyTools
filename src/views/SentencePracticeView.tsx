import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Volume2,
  ArrowRight,
  Loader2,
  Sparkles,
  RotateCcw,
  Plus
} from 'lucide-react';
import { api } from '../api/client.ts';
import { SentencePracticeSession, SentencePracticeItem } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';
import { ImmersionHeader } from '../components/ImmersionHeader.tsx';
import { AddToDictionaryButton } from '../components/AddToDictionaryButton.tsx';

interface SentencePracticeViewProps {
  sessionId: string;
  navigate: (route: string) => void;
  config?: any;
}

interface WordState {
  correctWord: string;
  userInput: string;
  submitted: boolean;
  correct: boolean;
  errorPos: number;
}

function splitIntoWords(sentence: string): { word: string; original: string; punctAfter: string }[] {
  const tokens: { word: string; original: string; punctAfter: string }[] = [];
  const regex = /([A-Za-z']+)([^A-Za-z']*)?/g;
  let m;
  while ((m = regex.exec(sentence)) !== null) {
    const word = m[1];
    const punct = m[2] || '';
    if (word) {
      tokens.push({ word: word.toLowerCase(), original: word, punctAfter: punct });
    }
  }
  return tokens;
}

export const SentencePracticeView: React.FC<SentencePracticeViewProps> = ({
  sessionId,
  navigate,
  config
}) => {
  const [session, setSession] = useState<SentencePracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hoveredWordIdx, setHoveredWordIdx] = useState<number | null>(null);
  const [focusedWordIdx, setFocusedWordIdx] = useState<number | null>(null);
  const [allCorrect, setAllCorrect] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [wordPopup, setWordPopup] = useState<{ word: string; meanings: Array<{ pos: string; cn: string }> } | null>(null);
  const [resultWordInfo, setResultWordInfo] = useState<Record<string, { phonetic: string; meaning: string }>>({});
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const currentSentenceRef = useRef<string>('');
  const isPendingRef = useRef(false);
  const handleCheckRef = useRef<() => void>(() => {});
  const autoCheckedRef = useRef(false);
  const pendingNextSessionRef = useRef<SentencePracticeSession | null>(null);

  const currentSentenceIndex = session?.currentSentenceIndex ?? 0;
  const currentItem: SentencePracticeItem | undefined = session?.items?.[currentSentenceIndex];
  const sentence = currentItem?.sentence;

  const wordTokens = useMemo(() => splitIntoWords(sentence?.content || ''), [sentence?.content]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, wordTokens.length);
  }, [wordTokens.length]);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setAllCorrect(false);
      autoCheckedRef.current = false;
      const data = await api.getSentencePracticeSessionById(sessionId);
      if (!data) {
        setError('未找到该练习任务');
        return;
      }
      setSession(data);
      setPracticeCompleted(data.status === 'COMPLETED');
      const s = data.items[data.currentSentenceIndex]?.sentence?.content || '';
      currentSentenceRef.current = s;
      const tokens = splitIntoWords(s);
      setWordStates(tokens.map(t => ({
        correctWord: t.word,
        userInput: '',
        submitted: false,
        correct: false,
        errorPos: -1,
      })));
    } catch (e: any) {
      setError(e.message || '加载练习任务失败');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = useCallback(async (text?: string) => {
    const target = text || sentence?.content;
    if (!target) return;
    setIsSpeaking(true);
    try {
      const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
      await SpeechPlayer.speak(target, { lang, rate: 0.95 });
    } catch (e) {
      console.warn('Speech error:', e);
    } finally {
      setIsSpeaking(false);
    }
  }, [sentence?.content, config]);

  // 点击单词：发音 + 显示词性/释义悬浮
  const handleWordClick = useCallback((word: string) => {
    playAudio(word);
    setWordPopup(null);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    api.lookupWord(word).then((data: any) => {
      if (!data || !data.meanings || data.meanings.length === 0) {
        setWordPopup({ word, meanings: [] });
      } else {
        setWordPopup({
          word: data.text || word,
          meanings: data.meanings.map((m: any) => ({ pos: m.pos || '', cn: m.definitionCn || '' }))
        });
      }
      popupTimerRef.current = setTimeout(() => setWordPopup(null), 4000);
    }).catch(() => {
      setWordPopup({ word, meanings: [] });
      popupTimerRef.current = setTimeout(() => setWordPopup(null), 2000);
    });
  }, [playAudio]);

  useEffect(() => {
    if (!loading && !allCorrect && wordStates.length > 0) {
      const firstEmptyIdx = wordStates.findIndex(w => !w.correct);
      setTimeout(() => {
        const idx = firstEmptyIdx >= 0 ? firstEmptyIdx : 0;
        inputRefs.current[idx]?.focus();
      }, 30);
    }
  }, [loading, currentSentenceIndex, allCorrect, wordStates.length]);

  useEffect(() => {
    if (!loading && wordStates.length > 0 && !allCorrect) {
      const t = setTimeout(() => playAudio(), 500);
      return () => clearTimeout(t);
    }
  }, [loading, currentSentenceIndex, wordStates.length, playAudio]);

  useEffect(() => {
    if (allCorrect && sentence) {
      const t = setTimeout(() => playAudio(), 300);
      return () => clearTimeout(t);
    }
  }, [allCorrect, sentence, playAudio]);

  const handleWordInput = (idx: number, value: string) => {
    if (allCorrect) return;
    const ws = wordStates[idx];
    const correct = ws.correctWord.toLowerCase();
    const clean = value.replace(/[^A-Za-z']/g, '').toLowerCase();

    let errorPos = -1;
    let accepted = '';
    for (let i = 0; i < clean.length; i++) {
      if (i >= correct.length || clean[i] !== correct[i]) {
        errorPos = i;
        accepted = clean.slice(0, i + 1);
        break;
      }
      accepted += clean[i];
    }
    if (errorPos === -1) accepted = clean;

    setWordStates(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        userInput: accepted,
        submitted: errorPos >= 0,
        correct: false,
        errorPos,
      };
      return next;
    });

    if (errorPos >= 0) {
      setTimeout(() => {
        inputRefs.current[idx]?.focus();
      }, 10);
    } else if (accepted.length === correct.length) {
      setWordStates(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], userInput: accepted, submitted: true, correct: true, errorPos: -1 };
        const nextIdx = next.findIndex((w, i) => i !== idx && !w.correct);
        if (nextIdx >= 0) {
          setTimeout(() => inputRefs.current[nextIdx]?.focus(), 80);
        } else {
          setTimeout(() => inputRefs.current[idx]?.blur(), 80);
        }
        return next;
      });
    }
  };

  const handleWordKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCheck();
    } else if (e.key === 'Backspace' && wordStates[idx].userInput === '' && idx > 0) {
      e.preventDefault();
      const prevIdx = idx - 1;
      setWordStates(prev => {
        const next = [...prev];
        next[prevIdx] = { ...next[prevIdx], submitted: false, correct: false, errorPos: -1 };
        return next;
      });
      setTimeout(() => inputRefs.current[prevIdx]?.focus(), 10);
    }
  };

  const handleWordBlur = (idx: number) => {
    setWordStates(prev => {
      const next = [...prev];
      const ws = next[idx];
      if (!ws.correct && ws.userInput.length > 0) {
        next[idx] = {
          ...ws,
          submitted: true,
          correct: ws.errorPos === -1 && ws.userInput.length === ws.correctWord.length,
        };
      }
      return next;
    });
  };

  const handleCheck = async () => {
    if (submitting || isPendingRef.current || allCorrect) return;
    if (wordStates.some(w => !w.submitted && w.userInput.length > 0)) {
      setWordStates(prev => prev.map(w => ({
        ...w,
        submitted: true,
        correct: w.errorPos === -1 && w.userInput.length === w.correctWord.length,
      })));
      return;
    }
    if (wordStates.some(w => !w.correct)) return;

    isPendingRef.current = true;
    setSubmitting(true);
    try {
      const fullAnswer = wordTokens.map((t, i) => {
        const ws = wordStates[i];
        const orig = t.original;
        const punct = t.punctAfter;
        return (ws?.correct ? orig : ws?.userInput || orig) + punct;
      }).join(' ').replace(/\s+([.,!?;:])/g, '$1').trim();

      const res = await api.submitSentencePracticeAnswer(session!.id, fullAnswer);

      if (res.isCorrect) {
        // The server is the source of truth for whether the whole practice
        // session is finished. Do not wait for "继续下一句" on the last item.
        const completed = Boolean(
          res.sessionCompleted || res.session?.status === 'COMPLETED'
        );

        if (completed) {
          if (res.session) {
            setSession(res.session);
          }
          pendingNextSessionRef.current = null;
          // 最后一题也先显示本句结果页，点击“完成”后再进入结算页。
          setPracticeCompleted(false);
          setAllCorrect(true);
          playAudio(sentence?.content);
          return;
        }

        // 保留当前句子显示答题结果，下一句等点击“继续下一句”再切换。
        if (res.session) {
          pendingNextSessionRef.current = res.session;
        }
        setAllCorrect(true);
        playAudio(sentence?.content);
      } else {
        setWordStates(prev => prev.map(w => ({
          ...w,
          submitted: true,
          correct: w.errorPos === -1 && w.userInput.length === w.correctWord.length,
        })));
      }
    } catch (e: any) {
      console.error(e);
      setWordStates(prev => prev.map(w => ({
        ...w,
        submitted: true,
        correct: w.errorPos === -1 && w.userInput.length === w.correctWord.length,
      })));
    } finally {
      setSubmitting(false);
      isPendingRef.current = false;
    }
  };

  // Keep ref in sync so useEffect can call latest version
  handleCheckRef.current = handleCheck;

  // 成功结果页：加载每个单词的音标和中文释义
  useEffect(() => {
    if (!allCorrect || wordTokens.length === 0) {
      if (!allCorrect) setResultWordInfo({});
      return;
    }
    let cancelled = false;
    Promise.all(wordTokens.map(async tok => {
      try {
        const data: any = await api.lookupWord(tok.word);
        const meaning = data?.meanings?.find((m: any) => m?.definitionCn)?.definitionCn || data?.meanings?.[0]?.definitionCn || '';
        const phonetic = data?.activePhonetic || data?.phonetic || data?.phoneticUk || data?.phoneticUs || '';
        return [tok.word, { phonetic, meaning }] as const;
      } catch {
        return [tok.word, { phonetic: '', meaning: '' }] as const;
      }
    })).then(entries => {
      if (!cancelled) setResultWordInfo(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [allCorrect, wordTokens]);

  // Auto-check when all words are submitted && correct
  useEffect(() => {
    if (
      !autoCheckedRef.current &&
      wordStates.length > 0 &&
      !allCorrect &&
      !submitting &&
      wordStates.every(w => w.submitted && w.correct)
    ) {
      autoCheckedRef.current = true;
      const t = setTimeout(() => handleCheckRef.current(), 200);
      return () => clearTimeout(t);
    }
  }, [wordStates, allCorrect, submitting]);

  const handleNext = async () => {
    if (!session) return;

    const pendingSession = pendingNextSessionRef.current;
    if (pendingSession) {
      pendingNextSessionRef.current = null;
      setSession(pendingSession);
      setAllCorrect(false);
      autoCheckedRef.current = false;
      const nextItem = pendingSession.items[pendingSession.currentSentenceIndex];
      const s = nextItem?.sentence?.content || '';
      currentSentenceRef.current = s;
      const tokens = splitIntoWords(s);
      setWordStates(tokens.map(t => ({
        correctWord: t.word,
        userInput: '',
        submitted: false,
        correct: false,
        errorPos: -1,
      })));
      return;
    }

    const nextIdx = session.currentSentenceIndex;

    // 已是完成状态：JSX 会渲染完成页，这里直接返回
    if (session.status === 'COMPLETED' || nextIdx >= session.totalCount) {
      setAllCorrect(false);
      setPracticeCompleted(true);
      return;
    }

    setAllCorrect(false);
    autoCheckedRef.current = false;
    setWordStates([]);

    const nextItem = session.items[nextIdx];
    if (nextItem) {
      const s = nextItem.sentence?.content || '';
      currentSentenceRef.current = s;
      const tokens = splitIntoWords(s);
      setWordStates(tokens.map(t => ({
        correctWord: t.word,
        userInput: '',
        submitted: false,
        correct: false,
        errorPos: -1,
      })));
    } else {
      // 防御性兜底：理论上不会进入，items[nextIdx] 不存在时重新拉取
      const fresh = await api.getSentencePracticeSessionById(session.id);
      if (fresh) {
        setSession(fresh);
        const ni = fresh.items[fresh.currentSentenceIndex];
        if (ni) {
          const s = ni.sentence?.content || '';
          currentSentenceRef.current = s;
          const tokens = splitIntoWords(s);
          setWordStates(tokens.map(t => ({
            correctWord: t.word,
            userInput: '',
            submitted: false,
            correct: false,
            errorPos: -1,
          })));
        }
      }
    }
  };

  const handleResetSentence = () => {
    setWordStates(prev => prev.map(w => ({
      ...w,
      userInput: '',
      submitted: false,
      correct: false,
      errorPos: -1,
    })));
    setAllCorrect(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 30);
  };

  const inputWidthForWord = (word: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '700 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const w = ctx.measureText(word).width;
      return Math.ceil(w) + 12;
    }
    return word.length * 20 + 24;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && allCorrect) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allCorrect, currentSentenceIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#4F7DF3]" />
        <p className="text-[#8BA0BD] text-sm">正在加载学语句...</p>
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

  // 答题成功后直接显示独立结果页，避免结果内容和输入界面同时存在。
  if (allCorrect && sentence?.content) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col text-[#29466F]">
        <ImmersionHeader
          title="学语句"
          subtitle="完成本句"
          currentIndex={currentSentenceIndex + 1}
          totalCount={session.totalCount}
          onExit={() => navigate('/')}
          rightExtra={
            <span className="text-xs font-bold font-mono text-[#4F7DF3] bg-[#EBF2FE] px-2.5 py-1 rounded-lg">
              {session.difficulty}
            </span>
          }
        />
        <main className="flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-6 py-10 animate-fadeIn">
          <div className="w-full max-w-5xl text-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#29466F] tracking-tight leading-snug mb-10">
              {sentence.translation || '暂无译文'}
            </h2>

            <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-6">
              {wordTokens.map((tok, i) => {
                const correctWord = tok.original;
                const info = resultWordInfo[tok.word];
                return (
                  <div
                    key={i}
                    className="min-w-[120px] sm:min-w-[140px] px-5 sm:px-7 py-4 sm:py-5 rounded-2xl bg-[#EBF2FE] border border-white shadow-sm"
                  >
                    <div className="text-xs sm:text-sm font-semibold text-[#8BA0BD] min-h-[1.25rem]">
                      {info?.phonetic || ' '}
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#29466F] tracking-tight mt-1">
                      {correctWord}{tok.punctAfter}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-[#8BA0BD] mt-2 min-h-[1.5rem]">
                      {info?.meaning || ' '}
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => playAudio(sentence?.content)}
                className="px-7 py-3.5 bg-white border border-[#DCE6F5] hover:bg-[#EBF2FE] text-[#4F7DF3] font-bold rounded-2xl transition-all shadow-xs text-base flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>再来一遍</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="min-w-[180px] px-8 py-3.5 bg-[#4F7DF3] hover:bg-[#3D6CE5] active:scale-95 text-white font-bold rounded-2xl transition-all shadow-xs text-base"
              >
                {currentSentenceIndex + 1 >= session.totalCount ? '完成' : '继续'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  if (practiceCompleted || session.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col">
        <ImmersionHeader
          title="学语句完成"
          currentIndex={session.totalCount}
          totalCount={session.totalCount}
          onExit={() => navigate('/')}
        />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn flex flex-col justify-center">
          <div className="w-20 h-20 bg-[#EBF2FE] text-[#4F7DF3] rounded-3xl mx-auto flex items-center justify-center shadow-xs">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#29466F]">
              学语句练习完成！
            </h1>
            <p className="text-sm text-[#8BA0BD] max-w-sm mx-auto">
              你已顺利完成本次 {session.totalCount} 个句子的逐词输入练习。
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="py-3.5 px-8 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl shadow-xs text-sm transition-all mx-auto"
          >
            返回学习中心
          </button>
        </main>
      </div>
    );
  }

  const allWordsCorrect = wordStates.length > 0 && wordStates.every(w => w.correct);


  return (
    <div className="min-h-screen bg-[#F7FAFF] flex flex-col text-[#29466F]">
      <ImmersionHeader
        title="学语句"
        subtitle="逐词拼写 · 完整句子"
        currentIndex={currentSentenceIndex + 1}
        totalCount={session.totalCount}
        onExit={() => navigate('/')}
        rightExtra={
          <span className="text-xs font-bold font-mono text-[#4F7DF3] bg-[#EBF2FE] px-2.5 py-1 rounded-lg">
            {session.difficulty}
          </span>
        }
      />

      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-16 max-w-4xl w-full mx-auto animate-fadeIn text-center space-y-10">
        {/* Chinese Prompt */}
        <div className="space-y-3 relative">
          {wordPopup && (
            <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-40 bg-[#29466F] text-white px-6 py-2 flex items-center gap-3 animate-fadeIn w-max max-w-[90vw] flex-nowrap">
              <span className="text-base font-extrabold whitespace-nowrap">{wordPopup.word}</span>
              {wordPopup.meanings.length > 0 ? (
                wordPopup.meanings.map((m, i) => (
                  <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                    {m.pos && (
                      <span className="text-xs font-semibold text-[#4F7DF3] bg-white/10 px-1.5 py-0.5 rounded">{m.pos}</span>
                    )}
                    <span className="text-sm text-white/90">{m.cn}</span>
                  </span>
                ))
              ) : (
                <span className="text-sm text-white/60">暂无释义</span>
              )}
            </div>
          )}
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#29466F] tracking-tight leading-snug max-w-3xl mx-auto">
            {sentence?.translation || '暂无译文'}
          </h2>
          <div className="flex items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => playAudio()}
              disabled={isSpeaking}
              className="w-9 h-9 rounded-full bg-white border border-[#E7EEF8] hover:bg-[#EBF2FE] text-[#4F7DF3] flex items-center justify-center transition-all shadow-2xs"
              title="播放整句发音"
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {/* INPUT STATE */}
        {!allCorrect && (
          <div className="w-full max-w-3xl">
            <div className="flex flex-wrap justify-center items-end gap-x-2 gap-y-6 py-8">
              {wordTokens.map((tok, i) => {
                const ws = wordStates[i] || { correctWord: tok.word, userInput: '', submitted: false, correct: false, errorPos: -1 };
                const isBad = ws.submitted && !ws.correct;
                const isCorrect = ws.correct;
                const isFocused = focusedWordIdx === i;
                const width = inputWidthForWord(tok.word);
                const showPunctAfter = tok.punctAfter && tok.punctAfter.trim();

                const caretBottom = ws.userInput.length * (width - 8) / Math.max(ws.correctWord.length, 1);

                const borderColor = isCorrect ? '#10b981' : isBad ? '#6366f1' : isFocused ? '#6366f1' : '#cbd5e1';
                const dotColor = isCorrect ? '#10b981' : isBad ? '#6366f1' : '#6366f1';

                return (
                  <div
                    key={i}
                    className="flex items-end gap-0 relative group"
                    onMouseEnter={() => setHoveredWordIdx(i)}
                    onMouseLeave={() => setHoveredWordIdx(null)}
                  >
                    <div className="relative inline-block">
                      <div
                        aria-hidden
                        className="font-bold text-2xl sm:text-3xl pb-5 relative whitespace-nowrap select-none text-left"
                        style={{
                          width: `${width}px`,
                          borderBottom: `3px solid ${borderColor}`,
                          lineHeight: 1.2,
                        }}
                      >
                        {ws.userInput.split('').map((ch, ci) => (
                          <span
                            key={ci}
                            className={
                              ws.errorPos >= 0 && ci >= ws.errorPos
                                ? 'text-rose-500'
                                : isCorrect
                                ? 'text-emerald-500'
                                : 'text-[#29466F]'
                            }
                          >{ch}</span>
                        ))}
                        {ws.userInput.length === 0 && (
                          <span className="text-transparent select-none">&nbsp;</span>
                        )}
                      </div>

                      <input
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        value={ws.userInput}
                        onChange={e => handleWordInput(i, e.target.value)}
                        onKeyDown={e => handleWordKeyDown(i, e)}
                        onBlur={() => { handleWordBlur(i); setFocusedWordIdx(null); }}
                        onFocus={() => setFocusedWordIdx(i)}
                        onMouseDown={(e) => { e.preventDefault(); handleWordClick(ws.correctWord); }}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        readOnly={isCorrect}
                        placeholder=""
                        className={`absolute top-0 left-0 text-left font-bold text-2xl sm:text-3xl bg-transparent border-0 outline-none focus:ring-0 pb-5 p-0 m-0 box-border transition-colors z-10 cursor-pointer ${
                          isBad ? 'animate-shake' : ''
                        }`}
                        style={{
                          width: `${width}px`,
                          color: 'transparent',
                          caretColor: isCorrect ? 'transparent' : '#6366f1',
                          lineHeight: 1.2,
                        }}
                      />

                      {!isCorrect && isFocused && (
                        <div
                          aria-hidden
                          className="absolute bottom-[10px] w-1.5 h-1.5 rounded-full pointer-events-none transition-all duration-150"
                          style={{
                            left: `${1 + caretBottom}px`,
                            backgroundColor: dotColor,
                          }}
                        />
                      )}

                      {hoveredWordIdx === i && !isCorrect && (
                        <div
                          aria-hidden
                          className="absolute top-0 left-0 font-bold text-2xl sm:text-3xl whitespace-nowrap pointer-events-none select-none text-[#CBD5E1] text-left"
                          style={{
                            width: `${width}px`,
                            paddingBottom: '20px',
                            borderBottom: '3px solid transparent',
                            lineHeight: 1.2,
                          }}
                        >
                          <span className="text-transparent">{ws.userInput}</span>
                          <span>{ws.correctWord.slice(ws.userInput.length)}</span>
                        </div>
                      )}
                    </div>

                    {showPunctAfter && (
                      <span className="text-2xl sm:text-3xl font-bold text-[#8BA0BD] pb-1 select-none">
                        {tok.punctAfter.trim()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-8">
              <button
                type="button"
                onClick={handleResetSentence}
                className="px-5 py-3 bg-white border border-[#E7EEF8] hover:bg-[#F7FAFF] text-[#8BA0BD] hover:text-[#29466F] rounded-2xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重置</span>
              </button>

              <button
                type="button"
                onClick={handleCheck}
                disabled={submitting || allCorrect}
                className="px-8 py-3 bg-[#4F7DF3] hover:bg-[#3D6CE5] disabled:opacity-40 text-white rounded-2xl text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
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
          </div>
        )}

        {/* Keyboard hints */}
        <div className="pt-2 flex items-center justify-center gap-6 text-[11px] text-[#8BA0BD] select-none">
          {allCorrect ? (
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E7EEF8] rounded font-mono text-[10px] text-[#29466F]">Space</kbd>
              <span>继续下一句</span>
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#E7EEF8] rounded font-mono text-[10px] text-[#29466F]">Enter</kbd>
                <span>检查答案</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#E7EEF8] rounded font-mono text-[10px] text-[#29466F]">Space</kbd>
                <span>跳到下一个词</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span>点击 🔊 播放整句</span>
              </span>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
