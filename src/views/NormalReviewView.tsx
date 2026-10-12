import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  CheckCircle2,
  CheckSquare,
  Square,
  Headphones,
  Shuffle,
  Loader2,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryConfig, WordItem } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';

interface NormalReviewViewProps {
  navigate: (route: string) => void;
  config: DictionaryConfig;
}

interface DictionarySummary {
  id: string;
  name: string;
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  learningWords: number;
  unlearnedWords: number;
}

interface PoolData {
  dictionaries: DictionarySummary[];
  selectedDictionaryId: string;
  dictionaryName: string;
  chapters: { id: string; name: string; sequence: number; words: WordItem[] }[];
  uncategorized: WordItem[];
}

export const NormalReviewView: React.FC<NormalReviewViewProps> = ({ navigate, config }) => {
  const [dictionaryId, setDictionaryId] = useState<string>(config.defaultDictionaryId || '');
  const [excludeMastered, setExcludeMastered] = useState(true);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [actionError, setActionError] = useState('');

  const playWordAudio = useCallback((text: string) => {
    const lang = config?.audioType === 'US' ? 'en-US' : 'en-GB';
    SpeechPlayer.speak(text, { lang });
  }, [config?.audioType]);

  // 加载所选词库的可复习单词池（按 excludeMastered 过滤）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.getReviewWordPool(dictionaryId, excludeMastered);
        if (cancelled) return;
        setPool(data);
        if (!dictionaryId && data.selectedDictionaryId) {
          setDictionaryId(data.selectedDictionaryId);
        }
      } catch (e) {
        console.error('加载普通复习词池失败:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dictionaryId, excludeMastered]);

  // 加载该词库进行中的复习任务（用于恢复）
  useEffect(() => {
    let cancelled = false;
    if (!dictionaryId) { setActiveSession(null); return; }
    api.getActiveStudySession(dictionaryId, '')
      .then(s => { if (!cancelled) setActiveSession(s); })
      .catch(() => { if (!cancelled) setActiveSession(null); });
    return () => { cancelled = true; };
  }, [dictionaryId]);

  const allWords = useMemo<WordItem[]>(() => {
    if (!pool) return [];
    return [...pool.chapters.flatMap(c => c.words), ...pool.uncategorized];
  }, [pool]);

  const handleSelectDictionary = (id: string) => {
    if (id === dictionaryId) return;
    setDictionaryId(id);
    setSelectedWordIds([]);
    setActiveSession(null);
  };

  const handleToggleSelect = (wordId: string) => {
    setSelectedWordIds(prev =>
      prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
    );
  };

  const handleSelectAll = () => setSelectedWordIds(allWords.map(w => w.id));
  const handleDeselectAll = () => setSelectedWordIds([]);

  const handleRandomSelect = (count: number) => {
    if (allWords.length === 0) return;
    const shuffled = [...allWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSelectedWordIds(shuffled.slice(0, Math.min(count, shuffled.length)).map(w => w.id));
  };

  // 背写：学 -> 发音 -> 释义 -> 背写；听写：直接听音拼写
  const handleStartSelected = async (mode: 'LEARN_AND_WRITE' | 'WRITE_ONLY') => {
    if (selectedWordIds.length === 0) return;
    if (activeSession && !window.confirm('当前有未完成的复习任务，开始新任务会结束当前任务，是否继续？')) return;
    try {
      setStartingSession(true);
      setActionError('');
      const session = await api.createStudySession({
        wordIds: selectedWordIds,
        dictionaryId,
        mode
      });
      navigate('/study/' + session.id);
    } catch (err: any) {
      setActionError(err?.message || '创建复习任务失败');
      setStartingSession(false);
    }
  };

  const selectedIdSet = useMemo(() => new Set(selectedWordIds), [selectedWordIds]);

  const renderWordCard = (w: WordItem) => {
    const isSelected = selectedIdSet.has(w.id);
    const mastered = w.progress?.status === 'MASTERED';
    const meaning = w.meanings?.[0];
    return (
      <div
        key={w.id}
        onClick={() => handleToggleSelect(w.id)}
        className={`border rounded-2xl p-4 transition-all space-y-2.5 cursor-pointer select-none ${
          isSelected
            ? 'bg-white border-[#4F7DF3] shadow-xs ring-2 ring-[#4F7DF3]/10'
            : 'bg-white/70 border-[#E7EEF8] hover:border-stone-300'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="pt-1 text-[#4F7DF3] shrink-0">
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-[#4F7DF3]" />
              ) : (
                <Square className="w-5 h-5 text-[#8BA0BD]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#29466F] font-serif truncate">{w.text}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); playWordAudio(w.text); }}
                  className="p-1 rounded-full text-[#8BA0BD] hover:text-[#4F7DF3] hover:bg-[#F7FAFF] transition-colors shrink-0"
                  title="朗读"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs font-mono text-[#8BA0BD] mt-0.5 truncate">
                {w.activePhonetic || w.phoneticUk}
              </div>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
            mastered
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-[#EBF2FE] text-[#4F7DF3] border-[#D5E3FC]'
          }`}>
            {mastered ? '已掌握' : '已学未掌握'}
          </span>
        </div>
        <div className="text-sm text-[#29466F] font-medium pl-8">
          {meaning ? `${meaning.pos || ''} ${meaning.definitionCn || ''}`.trim() : '—'}
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#8BA0BD] pl-8">
          <span>掌握度 {w.progress?.mastery ?? 0}%</span>
          <span>错误 {w.progress?.wrongCount ?? 0} 次</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#4F7DF3] tracking-wider">WORD REVIEW</div>
          <h1 className="text-3xl font-extrabold text-[#29466F] tracking-tight mt-1">普通复习</h1>
          <p className="text-sm text-[#8BA0BD] mt-2">
            选择词库，勾选已学单词或随机抽词，进行背写 / 听写巩固。
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/review')}
          className="self-start px-4 py-2 rounded-xl border border-[#D5E3FC] bg-white text-[#4F7DF3] text-xs font-bold hover:bg-[#F7FAFF] transition-colors"
        >
          返回复习中心
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
          {actionError}
        </div>
      )}

      {/* 词库选择 */}
      <div className="bg-white border border-[#E7EEF8] rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#29466F]">
          <BookOpen className="w-4 h-4 text-[#4F7DF3]" />
          选择词库
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
          {(pool?.dictionaries || []).map(d => {
            const isActive = d.id === dictionaryId;
            const pct = d.totalWords > 0 ? Math.round((d.learnedWords / d.totalWords) * 100) : 0;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleSelectDictionary(d.id)}
                className={`text-left border rounded-2xl p-3.5 transition-all ${
                  isActive
                    ? 'border-[#4F7DF3] bg-[#F7FAFF] ring-2 ring-[#4F7DF3]/10'
                    : 'border-[#E7EEF8] bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#29466F] truncate">{d.name}</span>
                  <span className="text-xs font-mono text-[#8BA0BD] shrink-0">{d.totalWords} 词</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[#EEF2F7] overflow-hidden">
                  <div className="h-full bg-[#4F7DF3] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-emerald-600 font-semibold">掌握 {d.masteredWords}</span>
                  <span className="text-[#4F7DF3] font-semibold">未掌握 {d.learningWords}</span>
                  <span className="text-[#8BA0BD] font-semibold">未学习 {d.unlearnedWords}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 恢复进行中任务 */}
      {activeSession && (
        <div className="bg-[#EBF2FE] border border-[#D5E3FC] rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-[#29466F]">
            <span className="font-bold">发现未完成的复习任务</span>
            <span className="mx-2 text-[#8BA0BD]">·</span>
            <span>{activeSession.phase === 'DICTATION' ? '单词听写' : '单词背写'}</span>
            <span className="ml-2 font-mono font-bold">{activeSession.completedCount}/{activeSession.totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/study/' + activeSession.id)}
              className="px-4 py-2 rounded-xl bg-[#4F7DF3] text-white text-xs font-bold flex items-center gap-1.5"
            >
              恢复学习 <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSession(null)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D5E3FC] text-[#29466F] text-xs font-bold hover:bg-[#F7FAFF]"
            >
              重新开始选词
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#4F7DF3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8BA0BD] text-sm">正在加载可复习单词...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 控制面板 */}
          <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-[#E7EEF8] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EEF8]/80 pb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <span className="text-[#8BA0BD]">当前已选：</span>
                  <span className="font-extrabold text-[#4F7DF3] font-mono text-lg">{selectedWordIds.length}</span>
                  <span className="text-[#8BA0BD]">/ {allWords.length} 词</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#29466F] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={excludeMastered}
                    onChange={e => {
                      setExcludeMastered(e.target.checked);
                      setSelectedWordIds([]);
                    }}
                    className="w-4 h-4 accent-[#4F7DF3]"
                  />
                  排除已掌握
                </label>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={selectedWordIds.length === 0 || startingSession}
                  onClick={() => handleStartSelected('LEARN_AND_WRITE')}
                  className="flex-1 sm:flex-initial py-2.5 px-5 bg-white hover:bg-[#F7FAFF] border border-[#4F7DF3] text-[#4F7DF3] disabled:opacity-40 disabled:border-[#E7EEF8] disabled:text-[#8BA0BD] font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                  title="学 -> 发音 -> 释义 -> 背写"
                >
                  {startingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>背写选中 ({selectedWordIds.length})</span>
                </button>
                <button
                  type="button"
                  disabled={selectedWordIds.length === 0 || startingSession}
                  onClick={() => handleStartSelected('WRITE_ONLY')}
                  className="flex-1 sm:flex-initial py-2.5 px-5 bg-[#4F7DF3] hover:bg-[#3D6CE5] disabled:opacity-40 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                  title="播放发音，直接听写"
                >
                  {startingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
                  <span>听写选中 ({selectedWordIds.length})</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#8BA0BD] font-medium mr-1">快捷选择:</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-xl border border-[#E7EEF8] bg-[#F7FAFF] hover:bg-white text-[#29466F] font-semibold transition-colors"
              >
                全选 ({allWords.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={selectedWordIds.length === 0}
                className="px-3 py-1.5 rounded-xl border border-[#E7EEF8] bg-white hover:bg-[#F7FAFF] disabled:opacity-40 text-[#8BA0BD] hover:text-[#29466F] transition-colors"
              >
                取消全选
              </button>

              <span className="text-stone-300 mx-1">|</span>
              <span className="text-[#8BA0BD] flex items-center gap-1 mr-0.5">
                <Shuffle className="w-3.5 h-3.5 text-[#4F7DF3]" />
                随机:
              </span>
              {[10, 20, 30].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleRandomSelect(n)}
                  disabled={allWords.length === 0}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D5E3FC] bg-[#EBF2FE] hover:bg-[#DCEBFE] text-[#4F7DF3] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  随机 {n} 词
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleRandomSelect(selectedWordIds.length || 10)}
                disabled={allWords.length === 0}
                className="px-2.5 py-1.5 rounded-xl border border-[#E7EEF8] bg-white hover:bg-[#F7FAFF] text-[#8BA0BD] hover:text-[#29466F] transition-all disabled:opacity-40"
              >
                换一批
              </button>
            </div>
          </div>

          {allWords.length === 0 ? (
            <div className="bg-white border border-[#E7EEF8] rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#29466F]">该词库暂无可复习单词</h3>
              <p className="text-[#8BA0BD] text-sm max-w-sm mx-auto">
                {excludeMastered
                  ? '当前已排除已掌握单词，或该词库还没有学过的单词。可取消“排除已掌握”或先去学习。'
                  : '该词库还没有已学单词，先去学习一批单词吧。'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pool?.chapters.map(ch => (
                <div key={ch.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#29466F]">{ch.name}</span>
                    <span className="text-xs text-[#8BA0BD]">{ch.words.length} 词</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ch.words.map(renderWordCard)}
                  </div>
                </div>
              ))}
              {pool && pool.uncategorized.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#29466F]">未分单元</span>
                    <span className="text-xs text-[#8BA0BD]">{pool.uncategorized.length} 词</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pool.uncategorized.map(renderWordCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
