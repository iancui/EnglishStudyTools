import React, { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Loader2, AlertCircle, Compass } from 'lucide-react';
import { api } from '../api/client.ts';

interface SentencePracticeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStarted: (sessionId: string) => void;
}

const DIFFICULTIES = [
  { id: 'ALL', label: '全部难度', desc: '全库句子随机练习' },
  { id: 'A1', label: 'A1 入门', desc: '基础日常表达' },
  { id: 'A2', label: 'A2 初级', desc: '常用情境交际' },
  { id: 'B1', label: 'B1 中级', desc: '复合句与叙事' },
  { id: 'B2', label: 'B2 中高', desc: '较复杂观点与论述' }
];

const PRESET_COUNTS = [5, 10, 20];

export const SentencePracticeSetupModal: React.FC<SentencePracticeSetupModalProps> = ({
  isOpen,
  onClose,
  onSessionStarted
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [customCountInput, setCustomCountInput] = useState<string>('15');

  const [previewInfo, setPreviewInfo] = useState<{
    totalInDb: number;
    matchingCount: number;
    effectiveCount: number;
  } | null>(null);

  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPreview(selectedDifficulty, getEffectiveCount());
    }
  }, [isOpen, selectedDifficulty, selectedCount, isCustomCount, customCountInput]);

  const getEffectiveCount = (): number => {
    if (isCustomCount) {
      const parsed = parseInt(customCountInput, 10);
      return isNaN(parsed) || parsed < 1 ? 5 : parsed;
    }
    return selectedCount;
  };

  const loadPreview = async (difficulty: string, count: number) => {
    try {
      setLoadingPreview(true);
      setError(null);
      const res = await api.previewSentencePractice(difficulty, count);
      setPreviewInfo({
        totalInDb: res.totalInDb,
        matchingCount: res.matchingCount,
        effectiveCount: res.effectiveCount
      });
    } catch (e: any) {
      console.error('Preview error:', e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleStart = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const count = getEffectiveCount();
      const session = await api.createSentencePracticeSession({
        difficulty: selectedDifficulty,
        count
      });
      if (session?.id) {
        onClose();
        onSessionStarted(session.id);
      } else {
        setError('创建练习任务失败，请重试');
      }
    } catch (e: any) {
      setError(e.message || '开启练习失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const count = getEffectiveCount();
  const isShortage = previewInfo && count > previewInfo.matchingCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                渐进句子练习设置
              </h2>
              <p className="text-xs text-stone-500">
                从短语逐步输入到完整句子重建
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. 难度筛选 */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
            练习难度
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIFFICULTIES.map(d => {
              const isSelected = selectedDifficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-200'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="text-sm font-bold">{d.label}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{d.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 练习数量 */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
            本次句子数量
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COUNTS.map(cnt => {
              const isSelected = !isCustomCount && selectedCount === cnt;
              return (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setIsCustomCount(false);
                    setSelectedCount(cnt);
                  }}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  {cnt} 句
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCustomCount(true)}
              className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                isCustomCount
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              自定义
            </button>
          </div>

          {isCustomCount && (
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-stone-500">自定义数量：</span>
              <input
                type="number"
                min="1"
                max="100"
                value={customCountInput}
                onChange={e => setCustomCountInput(e.target.value)}
                className="w-24 px-3 py-1.5 border border-stone-300 rounded-lg text-sm font-bold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-stone-400">句 (建议 5 ~ 30)</span>
            </div>
          )}
        </div>

        {/* 3. 数量提示与短缺说明 */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-700 font-medium">
            <span>匹配句子情况：</span>
            {loadingPreview ? (
              <span className="text-stone-400">正在检查...</span>
            ) : (
              <span className="font-bold text-stone-900">
                可练习 {previewInfo?.effectiveCount ?? count} 句 (库中符合共 {previewInfo?.matchingCount ?? 0} 句)
              </span>
            )}
          </div>

          {isShortage && (
            <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] leading-relaxed">
              ⚠️ 当前 {selectedDifficulty} 难度仅有 {previewInfo?.matchingCount} 个句子，已为你自动设定创建 {previewInfo?.matchingCount} 个练习，可正常开启练习。
            </div>
          )}

          <div className="text-[11px] text-stone-400 pt-1">
            * 本次练习将随机抽取句子并固定顺序，学习中途刷新或离开首页后均可随时继续。
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={submitting || (previewInfo?.matchingCount === 0)}
            className="flex-2 py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在创建...</span>
              </>
            ) : (
              <>
                <span>开始练习 ({previewInfo?.effectiveCount ?? count} 句)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
