import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Volume2,
  Loader2,
  Sparkles,
  RotateCcw,
  CheckCircle,
  ChevronRight,
  Snail,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { SentencePracticeSession, SentenceProgressiveChunk } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';
import { ImmersionHeader } from '../components/ImmersionHeader.tsx';

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

interface WordToken {
  word: string;
  punctBefore: string;
  punctAfter: string;
}

/** 短句阈值：单词数不超过该值时跳过意群拆分，直接逐词默写整句 */
const SHORT_SENTENCE_MAX_WORDS = 4;

/** 把一段文本（整句或意群）拆成单词 + 前后标点；标点默认显示，无需输入 */
function parseWordTokens(text: string): WordToken[] {
  const decoded = decodeHtmlEntitiesFe(text || '');
  const out: WordToken[] = [];
  const regex = /([^A-Za-z]*?)([A-Za-z]+(?:'[A-Za-z]+)*)([^A-Za-z]*)/g;
  let m;
  while ((m = regex.exec(decoded)) !== null) {
    if (!m[2]) continue;
    out.push({
      word: m[2],
      punctBefore: (m[1] || '').replace(/\s+/g, ''),
      punctAfter: (m[3] || '').replace(/\s+/g, ''),
    });
  }
  return out;
}

/** 前端 HTML 实体解码（与后端 decodeHtmlEntities 保持一致） */
function decodeHtmlEntitiesFe(text: string): string {
  if (!text) return text;
  const map: Record<string, string> = {
    lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"',
    amp: '&', nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
    apos: "'", quot: '"', lt: '<', gt: '>',
  };
  return text.replace(/&([a-z]+);/gi, (_, name) => {
    const v = map[name.toLowerCase()];
    return v !== undefined ? v : '&' + name + ';';
  });
}

/**
 * 拆分句子为单词卡片：word 为干净单词（用于查词/发音），
 * display 为含前后标点的展示文本（如 'No,'）。
 * 缩写中间的撇号保留（I'm, don't），句首/句尾引号归为标点。
 */
function splitIntoWords(sentence: string): { word: string; display: string }[] {
  const tokens: { word: string; display: string }[] = [];
  const text = decodeHtmlEntitiesFe(sentence);
  const regex = /([^A-Za-z]*?)([A-Za-z]+(?:'[A-Za-z]+)*)([^A-Za-z]*)/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (!m[2]) continue;
    const before = (m[1] || '').replace(/\s+/g, '');
    const after = (m[3] || '').replace(/\s+/g, '');
    tokens.push({ word: m[2], display: before + m[2] + after });
  }
  return tokens;
}

/** 与后端 CONTRACTION_GLOSS 保持一致（结果页展示兜底） */
const CONTRACTION_GLOSS_FE: Record<string, string> = {
  "i'm": '我是', "you're": '你是；你们是', "we're": '我们是', "they're": '他们是',
  "he's": '他是', "she's": '她是', "it's": '它是', "that's": '那是', "here's": '这是',
  "what's": '是什么', "where's": '在哪里', "who's": '是谁', "how's": '怎样', "name's": '名字是',
  "let's": '让我们',
  "don't": '不；不要', "doesn't": '不', "didn't": '没有',
  "isn't": '不是', "aren't": '不是', "can't": '不能；不会', "won't": '不会',
};

/** 结果页单个词的释义：上下文译法 → 缩略式 → 句中大写专有名词 → 词典释义 */
function resolveMeaning(word: string, index: number, contextual: string, dictMeaning: string): string {
  if (contextual) return contextual;
  const lower = word.toLowerCase();
  if (CONTRACTION_GLOSS_FE[lower]) return CONTRACTION_GLOSS_FE[lower];
  if (index !== 0 && word !== 'I' && /^[A-Z][a-z']*$/.test(word)) return '（人名/专有名词）';
  return dictMeaning;
}

export const SentencePracticeView: React.FC<SentencePracticeViewProps> = ({
  sessionId,
  navigate,
  config,
}) => {
  const [session, setSession] = useState<SentencePracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chunkIndex, setChunkIndex] = useState(0);
  // BUILD 模式：CHUNK=逐意群逐词输入，FULL=最后逐词默写整句；短句直接进入 FULL
  const [phase, setPhase] = useState<'CHUNK' | 'FULL'>('CHUNK');
  const [wrong, setWrong] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sentenceDone, setSentenceDone] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [resultWordInfo, setResultWordInfo] = useState<Record<string, { phonetic: string; meaning: string }>>({});

  const nextSessionRef = useRef<SentencePracticeSession | null>(null);

  /* ---------- 整句阶段：逐词输入 ---------- */
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [focusedWordIdx, setFocusedWordIdx] = useState<number | null>(null);
  const [hoveredWordIdx, setHoveredWordIdx] = useState<number | null>(null);
  const wordInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fullPendingRef = useRef(false);

  /* ---------- 由配置决定的学习参数（可配置） ---------- */
  // 旧的 TYPE（逐词拼写）已并入 BUILD（意群递进输入）；只有跟读是另一种模式。
  const studyMode: 'LISTEN_READ' | 'BUILD' =
    config?.sentenceStudyMode === 'LISTEN_READ' ? 'LISTEN_READ' : 'BUILD';
  const autoplay = config?.sentenceAutoplay !== false;
  const showTranslation = config?.sentenceShowTranslation !== false;

  const currentSentenceIndex = session?.currentSentenceIndex ?? 0;
  const currentItem = session?.items?.[currentSentenceIndex];
  const sentence = currentItem?.sentence;
  const chunks: SentenceProgressiveChunk[] = currentItem?.chunks || [];
  const currentChunk = chunks[chunkIndex];
  const priorText = chunkIndex > 0 ? chunks[chunkIndex - 1]?.accumulatedText || '' : '';

  const wordTokens = useMemo(() => splitIntoWords(sentence?.content || ''), [sentence?.content]);
  // 整句默写阶段：每个单词一个输入框，前后标点（引号/逗号/句号等）默认显示，不用输入
  const fullTokens = useMemo(() => parseWordTokens(sentence?.content || ''), [sentence?.content]);
  // 短句（单词少，或意群切出来只有一块）直接逐词默写整句，不做意群拆分
  const isShortSentence = fullTokens.length > 0 &&
    (fullTokens.length <= SHORT_SENTENCE_MAX_WORDS || chunks.length <= 1);
  // 意群阶段：当前意群同样逐词输入
  const chunkTokens = useMemo(() => parseWordTokens(currentChunk?.newChunk || ''), [currentChunk?.newChunk]);
  const activeTokens: WordToken[] = phase === 'FULL' ? fullTokens : chunkTokens;
  const isLastSentence = currentSentenceIndex + 1 >= (session?.totalCount || 1);

  /* ---------- 加载 / 应用会话 ---------- */
  const applySession = useCallback((data: SentencePracticeSession) => {
    setSession(data);
    setChunkIndex(0);
    // 短句（单词少或意群只有一块）直接逐词默写整句，跳过意群阶段
    const firstItem = data.items?.[data.currentSentenceIndex ?? 0];
    const firstSentence = firstItem?.sentence?.content || '';
    const firstChunks = firstItem?.chunks || [];
    const firstTokens = parseWordTokens(firstSentence);
    const short = firstTokens.length > 0 &&
      (firstTokens.length <= SHORT_SENTENCE_MAX_WORDS || firstChunks.length <= 1);
    setPhase(short ? 'FULL' : 'CHUNK');
    setWrong(false);
    setSentenceDone(false);
    setResultWordInfo({});
    setWordStates([]);
    setFocusedWordIdx(null);
    nextSessionRef.current = null;
  }, []);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSentencePracticeSessionById(sessionId);
      if (!data) { setError('未找到该练习任务'); return; }
      applySession(data);
      setPracticeCompleted(data.status === 'COMPLETED');
    } catch (e: any) {
      setError(e.message || '加载练习任务失败');
    } finally {
      setLoading(false);
    }
  }, [sessionId, applySession]);

  useEffect(() => { loadSession(); }, [loadSession]);

  /* ---------- 发音 ---------- */
  const speak = useCallback(async (text?: string) => {
    const target = text || sentence?.content;
    if (!target) return;
    setIsSpeaking(true);
    try {
      const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
      const speechTarget = target.trim().toLowerCase() === 'i' ? 'I' : target;
      await SpeechPlayer.speak(speechTarget, { lang, rate: 0.95 });
    } catch (e) {
      console.warn('Speech error:', e);
    } finally {
      setIsSpeaking(false);
    }
  }, [sentence?.content, config]);

  /* ---------- 进入意群/整句阶段：自动播放发音（聚焦由逐词初始化 effect 负责） ---------- */
  useEffect(() => {
    if (loading || sentenceDone || !sentence) return;
    if (!autoplay) return;
    const target = studyMode === 'BUILD'
      ? (phase === 'FULL' ? sentence.content : currentChunk?.newChunk)
      : currentChunk?.newChunk;
    if (!target) return;
    const t = setTimeout(() => speak(target), 200);
    return () => clearTimeout(t);
  }, [chunkIndex, phase, loading, sentenceDone, currentChunk, sentence, studyMode, autoplay, speak]);

  /* ---------- BUILD：每个阶段（意群/整句）进入时初始化逐词输入并聚焦第一个词 ---------- */
  useEffect(() => {
    if (loading || sentenceDone || studyMode !== 'BUILD') return;
    if (activeTokens.length === 0) return;
    fullPendingRef.current = false;
    setWordStates(activeTokens.map(t => ({
      correctWord: t.word, userInput: '', submitted: false, correct: false, errorPos: -1,
    })));
    setFocusedWordIdx(null);
    const t = setTimeout(() => wordInputRefs.current[0]?.focus(), 250);
    return () => clearTimeout(t);
    // activeTokens 随 phase / chunkIndex / 句子变化而变化，无需列入依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, chunkIndex, sentence?.id, studyMode, loading, sentenceDone]);

  /* ---------- 结果页：每个单词的音标/释义 ---------- */
  useEffect(() => {
    if (!sentenceDone || wordTokens.length === 0) {
      if (!sentenceDone) setResultWordInfo({});
      return;
    }
    let cancelled = false;
    Promise.all(wordTokens.map(async (tok, index) => {
      try {
        const contextual = sentence?.words?.[index]?.translationCn || '';
        const data: any = await api.lookupWord(tok.word);
        const dictMeaning =
          data?.meanings?.find((m: any) => m?.definitionCn)?.definitionCn ||
          data?.meanings?.[0]?.definitionCn || '';
        const meaning = resolveMeaning(tok.word, index, contextual, dictMeaning);
        const phonetic = data?.activePhonetic || data?.phonetic || data?.phoneticUk || data?.phoneticUs || '';
        return [tok.word, { phonetic, meaning }] as const;
      } catch {
        const contextual = sentence?.words?.[index]?.translationCn || '';
        return [tok.word, {
          phonetic: '',
          meaning: resolveMeaning(tok.word, index, contextual, ''),
        }] as const;
      }
    })).then(entries => {
      if (!cancelled) setResultWordInfo(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [sentenceDone, wordTokens, sentence]);

  /* ---------- 完成整句：提交以保存进度并推进会话 ---------- */
  const completeSentence = useCallback(async () => {
    if (!session || !sentence || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.submitSentencePracticeAnswer(session.id, sentence.content);
      if (res.isCorrect) {
        nextSessionRef.current = res.session || session;
        setSentenceDone(true);
      } else {
        // 理论上不会发生：前端逐词已通过；兜底允许重新提交
        fullPendingRef.current = false;
        setWrong(true);
      }
    } catch (e) {
      console.error(e);
      fullPendingRef.current = false;
      setWrong(true);
    } finally {
      setSubmitting(false);
    }
  }, [session, sentence, submitting]);

  /* ---------- 跟读模式：下一步 ---------- */
  const advance = useCallback(() => {
    if (!currentChunk) return;
    if (chunkIndex < chunks.length - 1) {
      setWrong(false);
      setChunkIndex(chunkIndex + 1);
    } else {
      void completeSentence();
    }
  }, [currentChunk, chunkIndex, chunks.length, completeSentence]);

  /* ---------- BUILD 逐词输入：意群/整句通用，标点不用输，全对自动推进 ---------- */
  const handleWordInput = (idx: number, value: string) => {
    if (fullPendingRef.current) return;
    const current = wordStates[idx];
    if (!current || current.correct) return;
    const correct = current.correctWord;
    const clean = value.replace(/[^A-Za-z']/g, '');
    let errorPos = -1;
    let accepted = '';
    for (let i = 0; i < clean.length; i++) {
      if (i >= correct.length || clean[i].toLowerCase() !== correct[i].toLowerCase()) {
        errorPos = i;
        accepted = clean.slice(0, i + 1);
        break;
      }
      accepted += clean[i];
    }
    const isWordCorrect = errorPos === -1 && accepted.length === correct.length;
    const next = [...wordStates];
    next[idx] = {
      ...current,
      userInput: accepted,
      submitted: errorPos >= 0 || isWordCorrect,
      correct: isWordCorrect,
      errorPos: isWordCorrect ? -1 : errorPos,
    };
    setWordStates(next);
    if (errorPos >= 0) {
      setTimeout(() => wordInputRefs.current[idx]?.focus(), 10);
      return;
    }
    if (!isWordCorrect) return;
    const nextIdx = next.findIndex((w, i) => i !== idx && !w.correct);
    if (nextIdx >= 0) {
      // 输对一个词 → 自动聚焦下一个词（焦点只由程序按顺序移动）
      setTimeout(() => wordInputRefs.current[nextIdx]?.focus(), 80);
      return;
    }
    // 当前阶段所有词输完
    fullPendingRef.current = true;
    setTimeout(() => wordInputRefs.current[idx]?.blur(), 80);
    if (phase === 'FULL') {
      // 整句完成 → 提交原句
      setTimeout(() => void completeSentence(), 0);
    } else if (chunkIndex < chunks.length - 1) {
      // 意群完成 → 自动进入下一意群（逐词状态由 effect 重置并聚焦首词）
      setWrong(false);
      setTimeout(() => setChunkIndex(chunkIndex + 1), 350);
    } else {
      // 最后一意群完成 → 进入整句默写
      setTimeout(() => setPhase('FULL'), 350);
    }
  };

  const handleWordKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab 及任何会转移焦点的键都不允许跳出当前逐词输入序列
    if (e.key === 'Tab') { e.preventDefault(); return; }
    if (e.key === 'Enter') { e.preventDefault(); return; }
    // 空框按退格：回到上一个词修改（不跨意群回退，避免打乱递进顺序）
    if (e.key === 'Backspace' && wordStates[idx]?.userInput === '' && idx > 0) {
      e.preventDefault();
      const prevIdx = idx - 1;
      setWordStates(prev => {
        const nx = [...prev];
        nx[prevIdx] = { ...nx[prevIdx], submitted: false, correct: false, errorPos: -1 };
        return nx;
      });
      setTimeout(() => wordInputRefs.current[prevIdx]?.focus(), 10);
    }
  };

  const handleWordBlur = (idx: number) => {
    setWordStates(prev => {
      const nx = [...prev];
      const ws = nx[idx];
      if (ws && !ws.correct && ws.userInput.length > 0) {
        nx[idx] = {
          ...ws,
          submitted: true,
          correct: ws.errorPos === -1 && ws.userInput.length === ws.correctWord.length &&
            ws.userInput.toLowerCase() === ws.correctWord.toLowerCase(),
        };
      }
      return nx;
    });
    setFocusedWordIdx(null);
  };

  const allWordsCorrect = wordStates.length > 0 && wordStates.every(w => w.correct);

  /* ---------- 逐词输入框序列（意群阶段 / 整句阶段通用；标点灰色默认显示） ---------- */
  const renderWordBoxes = () => (
    <div className="flex flex-wrap justify-center items-end gap-x-3 gap-y-6">
      {activeTokens.map((tok, i) => {
        const ws = wordStates[i] || { correctWord: tok.word, userInput: '', submitted: false, correct: false, errorPos: -1 };
        const isBad = ws.submitted && !ws.correct;
        const isCorrect = ws.correct;
        const isFocused = focusedWordIdx === i;
        const width = Math.max(ws.correctWord.length, 2) * 22 + 8;
        const caretBottom = ws.userInput.length * (width - 8) / Math.max(ws.correctWord.length, 1);
        const borderColor = isCorrect ? '#10b981' : isBad ? '#f43f5e' : isFocused ? '#6366f1' : '#cbd5e1';
        const dotColor = isCorrect ? '#10b981' : isBad ? '#f43f5e' : '#6366f1';
        return (
          <div key={i} className="flex items-end gap-0 relative"
            onMouseEnter={() => setHoveredWordIdx(i)}
            onMouseLeave={() => setHoveredWordIdx(null)}>
            {/* 单词前的标点（如句首引号）默认显示 */}
            {tok.punctBefore && (
              <span className="text-2xl sm:text-3xl font-bold text-[#8BA0BD] pb-1 mr-0.5 select-none">{tok.punctBefore}</span>
            )}
            <div
              className="relative inline-block cursor-pointer"
              // 阻止点击单词区域时当前输入框失焦，保留原来的输入光标
              onMouseDown={e => e.preventDefault()}
              onClick={() => speak(tok.word)}
              title={`播放 ${tok.word} 发音`}
            >
              <div aria-hidden
                className="font-bold text-2xl sm:text-3xl pb-5 relative whitespace-nowrap select-none text-left"
                style={{ width: `${width}px`, borderBottom: `3px solid ${borderColor}`, lineHeight: 1.2 }}>
                {ws.userInput.split('').map((ch, ci) => (
                  <span key={ci} className={
                    ws.errorPos >= 0 && ci >= ws.errorPos ? 'text-rose-500'
                      : isCorrect ? 'text-emerald-500' : 'text-[#29466F]'
                  }>{ch}</span>
                ))}
                {ws.userInput.length === 0 && <span className="text-transparent select-none">&nbsp;</span>}
              </div>
              <input
                ref={el => { wordInputRefs.current[i] = el; }}
                type="text"
                value={ws.userInput}
                onChange={e => handleWordInput(i, e.target.value)}
                onKeyDown={e => handleWordKeyDown(i, e)}
                onBlur={() => handleWordBlur(i)}
                onFocus={() => setFocusedWordIdx(i)}
                // 输入框只接受当前焦点的键盘输入；鼠标事件交给外层单词容器播放发音
                // 这样浏览器无法通过鼠标点击改变输入框焦点或插入光标位置
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                readOnly={isCorrect}
                tabIndex={-1}
                className={`pointer-events-none absolute top-0 left-0 text-left font-bold text-2xl sm:text-3xl bg-transparent border-0 outline-none focus:ring-0 pb-5 p-0 m-0 box-border z-10 ${isBad ? 'animate-shake' : ''}`}
                style={{ width: `${width}px`, color: 'transparent', caretColor: isCorrect ? 'transparent' : '#6366f1', lineHeight: 1.2 }}
              />
              {!isCorrect && isFocused && (
                <div aria-hidden className="absolute bottom-[10px] w-1.5 h-1.5 rounded-full pointer-events-none transition-all duration-150"
                  style={{ left: `${1 + caretBottom}px`, backgroundColor: dotColor }} />
              )}
              {hoveredWordIdx === i && !isCorrect && (
                <div aria-hidden className="absolute top-0 left-0 font-bold text-2xl sm:text-3xl whitespace-nowrap pointer-events-none select-none text-[#CBD5E1] text-left"
                  style={{ width: `${width}px`, paddingBottom: '20px', borderBottom: '3px solid transparent', lineHeight: 1.2 }}>
                  <span className="text-transparent">{ws.userInput}</span>
                  <span>{ws.correctWord.slice(ws.userInput.length)}</span>
                </div>
              )}
            </div>
            {/* 单词后的标点（逗号/句号/引号等）默认显示，不用输入 */}
            {tok.punctAfter && (
              <span className="text-2xl sm:text-3xl font-bold text-[#8BA0BD] pb-1 ml-0.5 select-none">{tok.punctAfter}</span>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ---------- 继续下一句 / 完成 ---------- */
  const handleContinue = useCallback(() => {
    if (isLastSentence) {
      setSentenceDone(false);
      setPracticeCompleted(true);
      return;
    }
    const next = nextSessionRef.current;
    if (next) applySession(next);
  }, [isLastSentence, applySession]);

  /* ---------- 再来一遍 ---------- */
  const handleRetry = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const retry = await api.retrySentencePractice(session.id);
      if (retry) applySession(retry);
    } catch (e: any) {
      alert(e?.message || '重新练习失败');
    } finally {
      setSubmitting(false);
    }
  }, [session, submitting, applySession]);

  /* ---------- 全局快捷键 ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sentenceDone) {
        if (e.code === 'Space') {
          e.preventDefault();
          if (e.shiftKey) void speak(sentence?.content);
          else if (!submitting) handleContinue();
        }
        return;
      }
      if (studyMode === 'LISTEN_READ') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (e.shiftKey) void speak(sentence?.content);
          else void speak(currentChunk?.newChunk);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          advance();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sentenceDone, studyMode, submitting, speak, handleContinue, advance, currentChunk, sentence]);

  /* ===================== 渲染 ===================== */

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
      <div className="min-h-screen bg-[#F7FAFF] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 border border-[#E7EEF8]">
          <h2 className="text-xl font-bold text-[#29466F]">{error || '练习任务不存在'}</h2>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#4F7DF3] text-white rounded-xl text-sm font-semibold">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (practiceCompleted) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col">
        <ImmersionHeader title="学语句完成" currentIndex={session.totalCount} totalCount={session.totalCount} onExit={() => navigate('/')} />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-8 flex flex-col justify-center">
          <div className="w-20 h-20 bg-[#EBF2FE] text-[#4F7DF3] rounded-3xl mx-auto flex items-center justify-center">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#29466F]">学语句练习完成！</h1>
            <p className="text-sm text-[#8BA0BD]">你已完成本次 {session.totalCount} 个句子的循序渐进学习。</p>
          </div>
          <button onClick={() => navigate('/')} className="py-3.5 px-8 bg-[#4F7DF3] text-white font-bold rounded-2xl text-sm mx-auto">
            返回学习中心
          </button>
        </main>
      </div>
    );
  }

  /* ---------- 当前句结果页（完成所有块后） ---------- */
  if (sentenceDone && sentence) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col text-[#29466F]">
        <ImmersionHeader
          title="学语句"
          subtitle="完成本句"
          currentIndex={currentSentenceIndex + 1}
          totalCount={session.totalCount}
          onExit={() => navigate('/')}
          rightExtra={
            session.dictionary?.name ? (
              <span className="text-xs font-semibold text-[#29466F] bg-white border border-[#DDE7F5] px-2.5 py-1 rounded-lg">
                {session.dictionary.name}
              </span>
            ) : undefined
          }
        />
        <main className="flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-6 py-10">
          <div className="w-full max-w-5xl text-center">
            <h2 className="text-lg sm:text-2xl font-bold text-[#29466F] mb-8 max-w-2xl mx-auto">
              {sentence.translation || '暂无译文'}
            </h2>
            <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-6">
              {wordTokens.map((tok, i) => {
                const info = resultWordInfo[tok.word];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => speak(tok.word)}
                    className="min-w-[120px] sm:min-w-[140px] px-5 sm:px-7 py-4 sm:py-5 rounded-2xl bg-[#EBF2FE] border border-white shadow-sm hover:bg-white hover:border-[#C9D8F2] transition-all text-center"
                  >
                    <div className="text-xs sm:text-sm font-semibold text-[#8BA0BD] min-h-[1.25rem]">{info?.phonetic || ' '}</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#29466F] mt-1">
                      {tok.display}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-[#8BA0BD] mt-2 min-h-[1.25rem]">{info?.meaning || ' '}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-[#8BA0BD]">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px] text-[#29466F]">Space</kbd>
                <span>{isLastSentence ? '完成' : '下一句'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px] text-[#29466F]">Shift+Space</kbd>
                <span>播放整句</span>
              </span>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button type="button" onClick={handleRetry} disabled={submitting}
                className="px-7 py-3.5 bg-white border border-[#DCE6F5] hover:bg-[#EBF2FE] disabled:opacity-50 text-[#4F7DF3] font-bold rounded-2xl flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /><span>再来一遍</span>
              </button>
              <button type="button" onClick={handleContinue}
                className="min-w-[180px] px-8 py-3.5 bg-[#4F7DF3] hover:bg-[#3D6CE5] text-white font-bold rounded-2xl">
                {isLastSentence ? '完成' : '继续'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- 雪球式学习主屏 ---------- */
  if (!sentence || !currentChunk) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 text-center space-y-4 border border-[#E7EEF8]">
          <h2 className="text-xl font-bold text-[#29466F]">当前句子缺少学习步骤</h2>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#4F7DF3] text-white rounded-xl text-sm">返回首页</button>
        </div>
      </div>
    );
  }

  const modeLabel = studyMode === 'BUILD' ? (isShortSentence ? '整句默写' : '意群输入') : '跟读模式';
  const isFullPhase = studyMode === 'BUILD' && phase === 'FULL';

  return (
    <div className="min-h-screen bg-[#F7FAFF] flex flex-col text-[#29466F]">
      <ImmersionHeader
        title="学语句"
        subtitle={studyMode === 'BUILD'
          ? (isFullPhase
              ? (isShortSentence ? '短句 · 逐词默写整句' : '最后一步 · 默写整句')
              : '意群递进 · 逐词输入整句')
          : '逐块递进 · 组成整句'}
        currentIndex={currentSentenceIndex + 1}
        totalCount={session.totalCount}
        onExit={() => navigate('/')}
        rightExtra={
          <div className="flex items-center gap-2">
            {session.dictionary?.name && (
              <span className="hidden sm:inline text-xs font-semibold text-[#29466F] bg-white border border-[#DDE7F5] px-2.5 py-1 rounded-lg">
                {session.dictionary.name}
              </span>
            )}
            <span className="text-xs font-bold text-[#4F7DF3] bg-[#EBF2FE] px-2.5 py-1 rounded-lg">{modeLabel}</span>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center space-y-10">

        {studyMode === 'BUILD' && isFullPhase ? (
          /* ===================== BUILD · 最后一步：逐词默写整句（标点默认显示） ===================== */
          <>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#4F7DF3] bg-[#EBF2FE] px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isShortSentence ? '逐词默写整句（标点不用输入）' : '意群已完成 · 逐词默写整句（标点不用输入）'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#29466F]">
                {sentence.translation || '（暂无译文）'}
              </h2>
            </div>

            <div className="bg-white border border-[#E7EEF8] rounded-3xl shadow-xs px-6 sm:px-10 py-12 sm:py-16 text-center">
              {!allWordsCorrect && renderWordBoxes()}

              {allWordsCorrect && (
                wrong ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <p className="text-sm text-rose-500">提交未成功，请再试一次</p>
                    <button type="button" onClick={() => { setWrong(false); void completeSentence(); }}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl disabled:opacity-50">
                      重新提交
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                    <p className="text-lg font-bold text-emerald-600">整句全部正确</p>
                  </div>
                )
              )}

              <div className="mt-10 flex items-center justify-center gap-3">
                <button type="button" onClick={() => speak(sentence.content)}
                  className="px-5 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold flex items-center gap-2 hover:bg-amber-100">
                  <Volume2 className="w-4 h-4 text-amber-700" /><span>读整句</span>
                </button>
              </div>
            </div>

            {/* 进度点：意群 + 整句（短句没有意群阶段，只显示整句点） */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {!isShortSentence && chunks.map((c, i) => (
                <button key={i} type="button" onClick={() => { setPhase('CHUNK'); setChunkIndex(i); setWrong(false); }}
                  title={`第 ${i + 1} 意群`}
                  className="h-2 rounded-full w-2 bg-amber-400"
                />
              ))}
              <span title="默写整句" className="h-2 rounded-full w-6 bg-stone-900" />
            </div>

            <div className="text-center text-[11px] text-[#8BA0BD]">
              <span>逐词输入，输对自动跳下一个 · 标点已显示，无需输入 · 全部输完自动提交</span>
            </div>
          </>
        ) : (
          /* ===================== LISTEN_READ 跟读 / BUILD 意群输入 ===================== */
          <>
            {/* 提示区：本块中文 + 整句译文 */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#4F7DF3] bg-[#EBF2FE] px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {studyMode === 'BUILD'
                    ? `第 ${chunkIndex + 1} / ${chunks.length} 意群 · 逐词输入`
                    : `第 ${chunkIndex + 1} / ${chunks.length} 块`}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#29466F]">
                {currentChunk.meaning || '（功能词，见整句）'}
              </h2>
              {showTranslation && (
                <p className="text-sm sm:text-base text-[#8BA0BD]">整句：{sentence.translation}</p>
              )}
            </div>

            {/* 雪球句子 */}
            <div className="bg-white border border-[#E7EEF8] rounded-3xl shadow-xs px-6 sm:px-10 py-12 sm:py-16 text-center">
              {studyMode === 'LISTEN_READ' ? (
                <div className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-snug break-words">
                  {priorText && <span className="text-[#29466F]">{priorText} </span>}
                  <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg animate-fadeIn">
                    {currentChunk.newChunk}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center items-end gap-x-3 gap-y-6">
                  {priorText && (
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#29466F] pb-[3px] select-none">{priorText}</span>
                  )}
                  {renderWordBoxes()}
                </div>
              )}

              {currentChunk.phonetic && studyMode === 'LISTEN_READ' && (
                <div className="mt-5 font-mono text-sm text-[#8BA0BD]">{currentChunk.phonetic}</div>
              )}

              {studyMode === 'BUILD' && allWordsCorrect && (
                <p className="mt-6 text-sm font-bold text-emerald-600">本意群正确，自动继续…</p>
              )}

              {/* 发音按钮 */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <button type="button" onClick={() => speak(currentChunk.newChunk)}
                  className="px-5 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold flex items-center gap-2 hover:bg-amber-100">
                  <Volume2 className="w-4 h-4 text-amber-700" />
                  <span>{studyMode === 'BUILD' ? '读本意群' : '读本块'}</span>
                </button>
                <button type="button" onClick={() => speak(sentence.content)}
                  className="px-4 py-2.5 rounded-full border border-stone-200 text-stone-600 text-xs font-bold flex items-center gap-1.5 hover:bg-stone-50">
                  <Snail className="w-3.5 h-3.5" /><span>读整句</span>
                </button>
              </div>
            </div>

            {/* 进度点：意群 + 最后的整句阶段 */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {chunks.map((c, i) => (
                <button key={i} type="button" onClick={() => { if (studyMode === 'BUILD') { if (i <= chunkIndex) { setPhase('CHUNK'); setChunkIndex(i); setWrong(false); } } else if (i <= chunkIndex) setChunkIndex(i); }}
                  title={`第 ${i + 1} 块`}
                  className={`h-2 rounded-full transition-all ${
                    i === chunkIndex ? 'w-6 bg-stone-900' : i < chunkIndex ? 'w-2 bg-amber-400' : 'w-2 bg-stone-300'
                  }`}
                />
              ))}
              {studyMode === 'BUILD' && (
                <span title="默写整句" className="h-2 rounded-full w-2 bg-stone-300" />
              )}
            </div>

            {/* 主操作：跟读模式保留按钮；意群输入自动推进，无需提交 */}
            {studyMode === 'LISTEN_READ' && (
              <div className="flex items-center justify-center">
                <button type="button" onClick={advance} disabled={submitting}
                  className="px-10 py-4 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl flex items-center gap-2 disabled:opacity-50">
                  {chunkIndex < chunks.length - 1 ? <><span>下一块</span><ChevronRight className="w-5 h-5" /></> : <><CheckCircle className="w-5 h-5" /><span>完成本句</span></>}
                </button>
              </div>
            )}

            {/* 快捷键提示 */}
            <div className="text-center text-[11px] text-[#8BA0BD]">
              {studyMode === 'LISTEN_READ' ? (
                <span>Enter 下一块 · Space 读本块 · Shift+Space 读整句</span>
              ) : (
                <span>逐词输入本意群，输对自动进入下一意群 · 标点已显示无需输入 · Tab 等键不会切换输入位置</span>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
