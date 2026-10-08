import React, { useEffect, useState } from 'react';
import { X, Play, BookOpen, Shuffle, ListOrdered, RotateCcw, Check, Sparkles, Headphones } from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryItem, SessionMode, DictionaryConfig } from '../types/index.ts';

interface StudySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStarted: (sessionId: string) => void;
  initialDictionaryId?: string;
  initialMode?: SessionMode;
  config?: DictionaryConfig;
}

export const StudySetupModal: React.FC<StudySetupModalProps> = ({
  isOpen,
  onClose,
  onSessionStarted,
  initialDictionaryId,
  initialMode = 'LEARN_AND_WRITE',
  config
}) => {
  const [dictionaries, setDictionaries] = useState<DictionaryItem[]>([]);
  const [mode, setMode] = useState<SessionMode>(initialMode);
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
  const [latestConfig, setLatestConfig] = useState<DictionaryConfig | undefined>(config);

  // Explicit dictionary selection takes priority; otherwise use the latest saved Settings default.
  const selectedDictId = initialDictionaryId || latestConfig?.defaultDictionaryId || config?.defaultDictionaryId || '';

  useEffect(() => {
    if (!isOpen) return;

    setLatestConfig(config);
    if (initialMode) setMode(initialMode);

    // 合并辞书列表和最新配置请求，避免打开普通学习时连续发起两个请求。
    api.getSettingsBundle()
      .then((bundle) => {
        if (bundle?.dictionaries) setDictionaries(bundle.dictionaries);
        if (bundle?.config) setLatestConfig(bundle.config);
      })
      .catch((e) => console.warn('加载辞书设置失败，使用当前配置:', e));
  }, [isOpen, initialMode, config]);

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
        mode
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

  const currentDictName = dictionaries.find(d => d.id === selectedDictId)?.name;

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
          <div className="text-xs font-semibold text-[#4F7DF3] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>定制学习任务</span>
          </div>
          <h2 className="text-2xl font-bold text-[#29466F] tracking-tight">
            {mode === 'WRITE_ONLY' ? '单词听写设置' : '背单词设置'}
          </h2>
          <p className="text-xs text-[#8BA0BD]">
            {mode === 'WRITE_ONLY'
              ? '听发音看释义 · 闭卷英文默写训练'
              : '音形认知学习与汉译英背写一体化闭环'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          {/* Current Dictionary Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAFF] border border-[#E7EEF8]">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#4F7DF3]" />
              <div>
                <div className="text-[11px] text-[#8BA0BD]">当前使用辞书</div>
                <div className="text-sm font-bold text-[#29466F]">
                  {currentDictName || '默认辞书'}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-[#4F7DF3] bg-[#EBF2FE] px-2 py-0.5 rounded-full font-medium">
              设置中心可修改
            </span>
          </div>

          {/* 1. Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#29466F] uppercase">
              1. 学习模式
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('LEARN_AND_WRITE')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                  mode === 'LEARN_AND_WRITE'
                    ? 'bg-[#EBF2FE] border-[#4F7DF3] ring-2 ring-[#4F7DF3]/15'
                    : 'bg-white border-[#E7EEF8] hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${mode === 'LEARN_AND_WRITE' ? 'text-[#4F7DF3]' : 'text-[#8BA0BD]'}`} />
                  <span className={`text-xs font-bold ${mode === 'LEARN_AND_WRITE' ? 'text-[#29466F]' : 'text-stone-700'}`}>
                    普通学习
                  </span>
                </div>
                <p className="text-[11px] text-[#8BA0BD] leading-tight">
                  音形认知拆分 + 汉译英背写
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('WRITE_ONLY')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                  mode === 'WRITE_ONLY'
                    ? 'bg-[#EBF2FE] border-[#4F7DF3] ring-2 ring-[#4F7DF3]/15'
                    : 'bg-white border-[#E7EEF8] hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Headphones className={`w-4 h-4 ${mode === 'WRITE_ONLY' ? 'text-[#4F7DF3]' : 'text-[#8BA0BD]'}`} />
                  <span className={`text-xs font-bold ${mode === 'WRITE_ONLY' ? 'text-[#29466F]' : 'text-stone-700'}`}>
                    单词听写
                  </span>
                </div>
                <p className="text-[11px] text-[#8BA0BD] leading-tight">
                  纯听发音看释义 · 直接默写
                </p>
              </button>
            </div>
          </div>

          {/* 2. Count Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#29466F] uppercase">2. 单词数量</span>
              <span className="text-[#8BA0BD] font-mono">当前选择: {count} 词</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {countOptions.map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`py-2.5 rounded-xl border text-sm font-mono font-medium transition-all ${
                    count === num
                      ? 'bg-[#4F7DF3] border-[#4F7DF3] text-white shadow-xs'
                      : 'bg-white border-[#E7EEF8] text-[#29466F] hover:bg-[#F7FAFF]'
                  }`}
                >
                  {num} 词
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sort Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#29466F] uppercase block">
              3. 排序策略
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSortMode('RANDOM')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  sortMode === 'RANDOM'
                    ? 'bg-[#EBF2FE] border-[#4F7DF3] text-[#29466F] font-semibold'
                    : 'bg-white border-[#E7EEF8] text-[#8BA0BD] hover:bg-[#F7FAFF]'
                }`}
              >
                <Shuffle className="w-4 h-4 text-[#4F7DF3]" />
                <span>随机乱序</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('SEQUENCE')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  sortMode === 'SEQUENCE'
                    ? 'bg-[#EBF2FE] border-[#4F7DF3] text-[#29466F] font-semibold'
                    : 'bg-white border-[#E7EEF8] text-[#8BA0BD] hover:bg-[#F7FAFF]'
                }`}
              >
                <ListOrdered className="w-4 h-4 text-[#4F7DF3]" />
                <span>教材顺序</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('REVIEW_FIRST')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  sortMode === 'REVIEW_FIRST'
                    ? 'bg-[#EBF2FE] border-[#4F7DF3] text-[#29466F] font-semibold'
                    : 'bg-white border-[#E7EEF8] text-[#8BA0BD] hover:bg-[#F7FAFF]'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-[#4F7DF3]" />
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
              <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F7DF3]" />
            </label>
          </div>

          {/* Live Preview Information */}
          {preview && (
            <div className="p-3.5 rounded-xl bg-[#EBF2FE]/60 border border-[#D5E3FC] text-xs text-[#29466F] space-y-1">
              <div className="flex items-center justify-between font-medium">
                <span>辞书总词数: {preview.totalInDict} 词</span>
                <span>符合条件: {preview.matchingCount} 词</span>
              </div>
              {preview.matchingCount < count && (
                <div className="text-[#4F7DF3] text-[11px]">
                  💡 提示：符合条件的单词不足 {count} 个，本次将生成 {preview.matchingCount} 个单词的任务。
                </div>
              )}
            </div>
          )}

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={Boolean(submitting || (preview && preview.matchingCount === 0))}
            className="w-full py-3.5 bg-[#4F7DF3] hover:bg-[#3D6CE5] disabled:opacity-40 text-white rounded-2xl text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {submitting
                ? '正在生成任务...'
                : mode === 'WRITE_ONLY'
                ? '开启单词听写'
                : '开启背单词任务'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
