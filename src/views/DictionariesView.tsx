import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  FolderLock,
  Layers,
  ChevronRight,
  X,
  Search,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryItem, WordItem } from '../types/index.ts';

interface DictionariesViewProps {
  navigate: (route: string) => void;
  onOpenStudySetup: (dictId?: string) => void;
  user: any;
  defaultDictId?: string;
  onDefaultDictChanged?: (dictId: string) => void;
}

export const DictionariesView: React.FC<DictionariesViewProps> = ({
  navigate,
  onOpenStudySetup,
  user,
  defaultDictId,
  onDefaultDictChanged
}) => {
  const [dictionaries, setDictionaries] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SYSTEM' | 'USER'>('ALL');

  // Create dictionary modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Dictionary words detail drawer/modal state
  const [detailDict, setDetailDict] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add word to dict state
  const [allCandidateWords, setAllCandidateWords] = useState<WordItem[]>([]);
  const [wordSearchQuery, setWordSearchQuery] = useState('');
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      setLoading(true);
      const list = await api.getDictionaries();
      setDictionaries(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      await api.createDictionary({ name: newName.trim(), description: newDesc.trim() });
      setIsCreateOpen(false);
      setNewName('');
      setNewDesc('');
      await loadDictionaries();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDict = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除自定义辞书 "${name}" 吗？`)) return;
    try {
      await api.deleteDictionary(id);
      if (detailDict?.id === id) setDetailDict(null);
      await loadDictionaries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewDetail = async (dict: DictionaryItem) => {
    try {
      setLoadingDetail(true);
      const res = await api.getDictionaryById(dict.id);
      setDetailDict(res);
      // Preload available words for adding
      if (!dict.isSystem && allCandidateWords.length === 0) {
        const words = await api.getTodayWords(50);
        setAllCandidateWords(words);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRemoveWordFromDict = async (wordId: string) => {
    if (!detailDict) return;
    try {
      await api.removeWordFromDictionary(detailDict.id, wordId);
      const refreshed = await api.getDictionaryById(detailDict.id);
      setDetailDict(refreshed);
      loadDictionaries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddWordToDict = async (wordId: string) => {
    if (!detailDict) return;
    try {
      await api.addWordToDictionary(detailDict.id, wordId);
      const refreshed = await api.getDictionaryById(detailDict.id);
      setDetailDict(refreshed);
      loadDictionaries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (dictId: string) => {
    try {
      await api.updateDictionaryConfig({ defaultDictionaryId: dictId });
      if (onDefaultDictChanged) onDefaultDictChanged(dictId);
      alert('已设为默认学习辞书！');
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = dictionaries.filter(d => {
    if (activeTab === 'SYSTEM') return d.isSystem;
    if (activeTab === 'USER') return !d.isSystem;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-700 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>词库生态 · 多维分类</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-1">
            辞书库管理
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            自由挑选系统内置权威词库，或创建并维护个人生词本与专业词汇表。
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>创建我的辞书</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl max-w-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'ALL' ? 'bg-white text-stone-900 shadow-sm font-bold' : 'text-stone-600'
          }`}
        >
          全部辞书
        </button>
        <button
          onClick={() => setActiveTab('SYSTEM')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'SYSTEM' ? 'bg-white text-stone-900 shadow-sm font-bold' : 'text-stone-600'
          }`}
        >
          系统辞书
        </button>
        <button
          onClick={() => setActiveTab('USER')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'USER' ? 'bg-white text-stone-900 shadow-sm font-bold' : 'text-stone-600'
          }`}
        >
          我的生词本
        </button>
      </div>

      {/* Dictionaries Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(dict => {
            const isDefault = defaultDictId === dict.id;
            return (
              <div
                key={dict.id}
                className="bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-stone-900">
                        {dict.name}
                      </span>
                      {isDefault && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          默认使用中
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        dict.isSystem
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {dict.isSystem ? '系统内置' : '用户自定义'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                    {dict.description || '暂无说明'}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-stone-500">
                    收录 <strong className="text-stone-900 font-bold">{dict.wordCount || 0}</strong> 个单词
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(dict)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors"
                    >
                      查看单词
                    </button>

                    <button
                      onClick={() => onOpenStudySetup(dict.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
                    >
                      开始学习
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dictionary Detail Drawer/Modal */}
      {detailDict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-stone-900">{detailDict.name}</h3>
                  <span className="text-xs text-stone-400">({detailDict.words?.length || 0} 词)</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{detailDict.description}</p>
              </div>

              <button
                onClick={() => setDetailDict(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions on this dict */}
            <div className="flex items-center justify-between pb-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetDefault(detailDict.id)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium"
                >
                  设为默认辞书
                </button>
                {!detailDict.isSystem && (
                  <button
                    onClick={() => setIsAddWordOpen(prev => !prev)}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加词汇</span>
                  </button>
                )}
              </div>

              {!detailDict.isSystem && (
                <button
                  onClick={() => handleDeleteDict(detailDict.id, detailDict.name)}
                  className="text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除此辞书</span>
                </button>
              )}
            </div>

            {/* Quick add word section for custom dictionary */}
            {isAddWordOpen && !detailDict.isSystem && (
              <div className="p-3 bg-stone-50 rounded-xl mb-3 border border-stone-200 text-xs space-y-2">
                <div className="font-semibold text-stone-800">从词库中挑选添加单词：</div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {allCandidateWords
                    .filter(w => !detailDict.words.some((dw: any) => dw.wordId === w.id))
                    .slice(0, 15)
                    .map(cw => (
                      <div
                        key={cw.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-100 hover:bg-stone-50"
                      >
                        <span className="font-serif font-bold text-stone-900">{cw.text}</span>
                        <span className="text-stone-500">{cw.meanings[0]?.definitionCn}</span>
                        <button
                          onClick={() => handleAddWordToDict(cw.id)}
                          className="px-2 py-0.5 rounded bg-stone-900 text-white text-[11px]"
                        >
                          + 添加
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Words list in this dict */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 pr-1">
              {detailDict.words?.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">辞书中暂无单词</div>
              ) : (
                detailDict.words.map((item: any, idx: number) => {
                  const w = item.word;
                  if (!w) return null;
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-stone-400 text-[11px] w-5">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-serif font-bold text-sm text-stone-900 mr-2">
                            {w.text}
                          </span>
                          <span className="font-mono text-stone-400 text-[11px] mr-2">
                            {w.phoneticUk}
                          </span>
                          <span className="text-stone-600">
                            {w.meanings[0]?.definitionCn}
                          </span>
                        </div>
                      </div>

                      {!detailDict.isSystem && (
                        <button
                          onClick={() => handleRemoveWordFromDict(w.id)}
                          className="p-1 text-stone-300 hover:text-rose-600 transition-colors"
                          title="移出此辞书"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => {
                  const dictId = detailDict.id;
                  setDetailDict(null);
                  onOpenStudySetup(dictId);
                }}
                className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800"
              >
                以此辞书开始背诵任务 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dictionary Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-stone-900 mb-1">新建个人辞书</h3>
            <p className="text-xs text-stone-500 mb-5">
              创建后可随意向其中添加生词或重点复习词组
            </p>

            <form onSubmit={handleCreateDict} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">辞书名称</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如: 我的考研核心词"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">描述备注 (选填)</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="例如: 每日阅读与做题遇到的重点词汇"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all mt-2"
              >
                {creating ? '正在创建...' : '确认创建'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
