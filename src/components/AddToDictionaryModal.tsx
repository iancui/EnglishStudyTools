import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Check,
  Plus,
  BookOpen,
  FolderPlus,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryItem, WordItem } from '../types/index.ts';

interface AddToDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: {
    id: string;
    text: string;
    phoneticUk?: string;
    phoneticUs?: string;
    meanings?: any[];
    pos?: string;
  } | null;
  onSaved?: (updatedDictionaryIds: string[]) => void;
}

export const AddToDictionaryModal: React.FC<AddToDictionaryModalProps> = ({
  isOpen,
  onClose,
  word,
  onSaved
}) => {
  const [dictionaries, setDictionaries] = useState<DictionaryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick create dictionary state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDictName, setNewDictName] = useState('');
  const [newDictDesc, setNewDictDesc] = useState('');
  const [creatingDict, setCreatingDict] = useState(false);

  useEffect(() => {
    if (isOpen && word) {
      loadData();
      setShowCreateForm(false);
      setNewDictName('');
      setNewDictDesc('');
      setError(null);
    }
  }, [isOpen, word?.id]);

  const loadData = async () => {
    if (!word) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch only the current user's owned dictionaries
      const myDicts = await api.getMyDictionaries();
      setDictionaries(myDicts || []);

      // 2. Fetch the dictionaries the current word is already added to
      const wordInfo = await api.getWordMyDictionaries(word.id);
      const containedIds = new Set(wordInfo.dictionaryIds || []);
      setSelectedIds(containedIds);
      setInitialIds(new Set(containedIds));
    } catch (err: any) {
      console.error('Failed to load user dictionaries:', err);
      setError(err.message || '加载用户辞书失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !word) return null;

  const handleToggle = (dictId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(dictId)) {
        next.delete(dictId);
      } else {
        next.add(dictId);
      }
      return next;
    });
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDictName.trim()) return;

    try {
      setCreatingDict(true);
      setError(null);

      // Create new user dictionary
      const created = await api.createDictionary({
        name: newDictName.trim(),
        description: newDictDesc.trim() || undefined
      });

      // Automatically add current word to the new dictionary
      await api.addWordToDictionary(created.id, word.id);

      // Refresh dictionaries and selection
      const updatedList = [created, ...dictionaries];
      setDictionaries(updatedList);
      const nextSelected = new Set(selectedIds);
      nextSelected.add(created.id);
      setSelectedIds(nextSelected);

      // Inform caller
      onSaved?.(Array.from(nextSelected));

      // Reset form
      setNewDictName('');
      setNewDictDesc('');
      setShowCreateForm(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '创建辞书失败');
    } finally {
      setCreatingDict(false);
    }
  };

  const handleSave = async () => {
    if (!word) return;

    try {
      setSaving(true);
      setError(null);

      const targetIds = Array.from(selectedIds);
      await api.syncWordMyDictionaries(word.id, targetIds);

      onSaved?.(targetIds);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const primaryMeaning = word.meanings && word.meanings[0];
  const phonetic = word.phoneticUk || word.phoneticUs || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Bookmark className="w-4 h-4 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 leading-tight">
                加入我的辞书
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                收藏生词到个人专属辞书，随时复习与针对性背诵
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Word Info Banner */}
        <div className="px-6 py-3.5 bg-amber-50/60 border-b border-amber-100/60 flex items-center justify-between">
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-bold font-serif text-stone-900">
              {word.text}
            </span>
            {phonetic && (
              <span className="text-xs font-mono text-stone-600">
                {phonetic}
              </span>
            )}
            {word.pos && (
              <span className="text-xs font-serif italic text-amber-800 font-medium">
                {word.pos}
              </span>
            )}
          </div>
          {primaryMeaning?.definitionCn && (
            <span className="text-xs font-medium text-stone-700 truncate max-w-[180px]">
              {primaryMeaning.definitionCn}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs text-stone-500">正在获取你的专属辞书列表...</p>
            </div>
          ) : dictionaries.length === 0 && !showCreateForm ? (
            /* Empty State: No User Dictionaries Yet */
            <div className="py-8 text-center space-y-4 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 p-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <FolderPlus className="w-6 h-6 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-900">
                  你还没有创建自己的辞书
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  创建专属辞书后，可将易错生词、核心考点分类保存，并支持单独设置针对性背诵任务。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>立即创建辞书</span>
              </button>
            </div>
          ) : (
            /* Dictionaries List (Multiple Selection Supported) */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>选择要加入的辞书（可多选）:</span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(prev => !prev)}
                  className="text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCreateForm ? '收起新建' : '新建辞书'}</span>
                </button>
              </div>

              {/* Quick Inline Creation Form */}
              {showCreateForm && (
                <form
                  onSubmit={handleCreateAndAdd}
                  className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3 animate-fadeIn"
                >
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>新建并加入当前单词</span>
                  </div>

                  <input
                    type="text"
                    required
                    value={newDictName}
                    onChange={e => setNewDictName(e.target.value)}
                    placeholder="辞书名称，如：雅思核心高频词 / 重点易错本"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-stone-900"
                  />

                  <input
                    type="text"
                    value={newDictDesc}
                    onChange={e => setNewDictDesc(e.target.value)}
                    placeholder="简介（选填）"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-stone-900"
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 text-xs font-medium"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={creatingDict || !newDictName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      {creatingDict ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>创建中...</span>
                        </>
                      ) : (
                        <span>创建并加入</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Dictionaries Checkbox Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {dictionaries.map(dict => {
                  const isChecked = selectedIds.has(dict.id);
                  const originallyHad = initialIds.has(dict.id);

                  return (
                    <div
                      key={dict.id}
                      onClick={() => handleToggle(dict.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        isChecked
                          ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      {/* Checkbox Icon & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-amber-600 text-white'
                              : 'border-2 border-stone-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 text-sm truncate">
                              {dict.name}
                            </span>
                            {originallyHad && (
                              <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md shrink-0">
                                ✓ 已加入
                              </span>
                            )}
                          </div>
                          {dict.description && (
                            <p className="text-xs text-stone-500 truncate mt-0.5 max-w-xs">
                              {dict.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Count Badge */}
                      <span className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded-full shrink-0">
                        {dict.wordCount || 0} 词
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            {selectedIds.size > 0 ? (
              <span>
                已选择 <strong className="text-stone-900 font-bold">{selectedIds.size}</strong> 本辞书
              </span>
            ) : (
              <span>未勾选任何辞书（将清空该词收藏）</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || dictionaries.length === 0}
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>正在保存...</span>
                </>
              ) : (
                <span>确认</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
