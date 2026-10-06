import React, { useEffect, useState } from 'react';
import { X, Play, BookOpen, Shuffle, ListOrdered, RotateCcw, Check, Sparkles } from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryItem } from '../types/index.ts';

interface StudySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStarted: (sessionId: string) => void;
  initialDictionaryId?: string;
}

export const StudySetupModal: React.FC<StudySetupModalProps> = ({
  isOpen,
  onClose,
  onSessionStarted,
  initialDictionaryId
}) => {
  const [dictionaries, setDictionaries] = useState<DictionaryItem[]>([]);
  const [selectedDictId, setSelectedDictId] = useState<string>(initialDictionaryId || '');
  const [count, setCount] = useState<number>(20);
  const [excludeMastered, setExcludeMastered] = useState<boolean>(true);
  const [sortMode, setSortMode] = useState<'RANDOM' | 'SEQUENCE' | 'REVIEW_FIRST'>('RANDOM');
  const [preview, setPreview] = useState<{
    matchingCount: number;
    totalInDict: number;
    excludedMasteredCount: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDictionaries();
    }
  }, [isOpen]);

  const loadDictionaries = async () => {
    try {
      const list = await api.getDictionaries();
      setDictionaries(list);
      if (list.length > 0 && !selectedDictId) {
        setSelectedDictId(initialDictionaryId || list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update preview whenever parameters change
  useEffect(() => {
    if (!selectedDictId) return;
    const fetchPreview = async () => {
      try {
        setLoadingPreview(true);
        setErrorMsg('');
        const res = await api.previewStudySession({
          dictionaryId: selectedDictId,
          count,
          excludeMastered,
          sortMode
        });
        setPreview(res);
      } catch (err: any) {
        setErrorMsg(err.message || '获取预览失败');
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [selectedDictId, count, excludeMastered, sortMode]);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (!selectedDictId) return;
    try {
      setSubmitting(true);
      setErrorMsg('');
      const session = await api.createStudySession({
        dictionaryId: selectedDictId,
        count,
        excludeMastered,
        sortMode,
        mode: 'LEARN_AND_WRITE'
      });
      onClose();
      onSessionStarted(session.id);
    } catch (err: any) {
      setErrorMsg(err.message || '创建学习任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const countOptions = [10, 20, 30, 50];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 mb-6">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>定制学习任务</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            背单词设置
          </h2>
          <p className="text-xs text-stone-500">
            自定义本次任务的词库来源、单词数量与筛选策略
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          {/* 1. Dictionary Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900 uppercase">
              1. 选择学习辞书
            </label>
            <div className="relative">
              <select
                value={selectedDictId}
                onChange={e => setSelectedDictId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:bg-white focus:border-stone-900 outline-none transition-all cursor-pointer"
              >
                {dictionaries.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.wordCount || 0} 词) {d.isSystem ? '· [系统辞书]' : '· [我的辞书]'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Count Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-900 uppercase">2. 单词数量</span>
              <span className="text-stone-500 font-mono">当前选择: {count} 词</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {countOptions.map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`py-2.5 rounded-xl border text-sm font-mono font-medium transition-all ${
                    count === num
                      ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {num} 词
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sort Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900 uppercase block">
              3. 排序策略
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSortMode('RANDOM')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  sortMode === 'RANDOM'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Shuffle className="w-4 h-4 text-amber-700" />
                <span>随机乱序</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('SEQUENCE')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  sortMode === 'SEQUENCE'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <ListOrdered className="w-4 h-4 text-amber-700" />
                <span>教材顺序</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('REVIEW_FIRST')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  sortMode === 'REVIEW_FIRST'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>优先复习</span>
              </button>
            </div>
          </div>

          {/* 4. Exclude Mastered Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-100">
            <div>
              <div className="font-semibold text-xs text-stone-900">排除已掌握单词</div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                自动剔除状态为 MASTERED 或记忆熟练度大于 90% 的词
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={excludeMastered}
                onChange={e => setExcludeMastered(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          {/* Live Preview Information (Section 18) */}
          {preview && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between font-medium">
                <span>辞书总词数: {preview.totalInDict} 词</span>
                <span>符合条件: {preview.matchingCount} 词</span>
              </div>
              {preview.matchingCount < count && (
                <div className="text-amber-800 text-[11px]">
                  💡 提示：符合条件的单词不足 {count} 个，本次将生成 {preview.matchingCount} 个单词的学习任务。
                </div>
              )}
            </div>
          )}

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={Boolean(submitting || (preview && preview.matchingCount === 0))}
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{submitting ? '正在生成学习任务...' : '开始学习任务'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
