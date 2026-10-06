import React, { useState, useEffect } from 'react';
import {
  X,
  Headphones,
  BookOpen,
  RotateCcw,
  Check,
  Shuffle,
  ListOrdered,
  Sparkles,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryItem, WordItem } from '../types/index.ts';

interface DictationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStarted: (sessionId: string) => void;
  initialSource?: 'DICTIONARY' | 'WRONG_WORDS';
}

export const DictationSetupModal: React.FC<DictationSetupModalProps> = ({
  isOpen,
  onClose,
  onSessionStarted,
  initialSource = 'DICTIONARY'
}) => {
  const [source, setSource] = useState<'DICTIONARY' | 'WRONG_WORDS'>(initialSource);
  const [dictionaries, setDictionaries] = useState<DictionaryItem[]>([]);
  const [selectedDictId, setSelectedDictId] = useState<string>('');
  const [selectionType, setSelectionType] = useState<'RANDOM' | 'PICK_WORDS'>('RANDOM');
  const [count, setCount] = useState<number>(20);
  const [sortMode, setSortMode] = useState<'RANDOM' | 'SEQUENCE'>('RANDOM');

  // Pick specific words states
  const [dictWords, setDictWords] = useState<any[]>([]);
  const [loadingDictWords, setLoadingDictWords] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);

  // Wrong words list
  const [wrongWords, setWrongWords] = useState<WordItem[]>([]);
  const [loadingWrongWords, setLoadingWrongWords] = useState(false);
  const [selectedWrongWordIds, setSelectedWrongWordIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSource(initialSource);
      setErrorMsg('');
      loadDictionaries();
      loadWrongWords();
    }
  }, [isOpen, initialSource]);

  const loadDictionaries = async () => {
    try {
      const list = await api.getDictionaries();
      setDictionaries(list);
      if (list.length > 0 && !selectedDictId) {
        setSelectedDictId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadWrongWords = async () => {
    try {
      setLoadingWrongWords(true);
      const list = await api.getWrongWords();
      setWrongWords(list);
      // Default: select all wrong words
      setSelectedWrongWordIds(list.map(w => w.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWrongWords(false);
    }
  };

  // Load words of selected dictionary when pick words is enabled
  useEffect(() => {
    if (!isOpen || source !== 'DICTIONARY' || !selectedDictId) return;

    const fetchWords = async () => {
      try {
        setLoadingDictWords(true);
        const dict = await api.getDictionaryById(selectedDictId);
        const wordsList = dict?.words || [];
        setDictWords(wordsList);
        // Pre-select first 20 words or all
        const initialSelected = wordsList.slice(0, 20).map((dw: any) => dw.wordId || dw.word?.id).filter(Boolean);
        setSelectedWordIds(initialSelected);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDictWords(false);
      }
    };

    fetchWords();
  }, [isOpen, source, selectedDictId]);

  if (!isOpen) return null;

  const toggleSelectWord = (wordId: string) => {
    setSelectedWordIds(prev =>
      prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
    );
  };

  const handleSelectAllDictWords = () => {
    const allIds = dictWords.map(dw => dw.wordId || dw.word?.id).filter(Boolean);
    setSelectedWordIds(allIds);
  };

  const handleDeselectAllDictWords = () => {
    setSelectedWordIds([]);
  };

  const toggleSelectWrongWord = (wordId: string) => {
    setSelectedWrongWordIds(prev =>
      prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
    );
  };

  const handleSelectAllWrongWords = () => {
    setSelectedWrongWordIds(wrongWords.map(w => w.id));
  };

  const handleDeselectAllWrongWords = () => {
    setSelectedWrongWordIds([]);
  };

  const handleStartDictation = async () => {
    setErrorMsg('');
    try {
      setSubmitting(true);

      if (source === 'WRONG_WORDS') {
        if (selectedWrongWordIds.length === 0) {
          setErrorMsg('请至少选择一个错词进行听写');
          setSubmitting(false);
          return;
        }

        const session = await api.createStudySession({
          wordIds: selectedWrongWordIds,
          mode: 'WRITE_ONLY'
        });
        onClose();
        onSessionStarted(session.id);
        return;
      }

      // Source: DICTIONARY
      if (!selectedDictId) {
        setErrorMsg('请选择一个辞书');
        setSubmitting(false);
        return;
      }

      if (selectionType === 'PICK_WORDS') {
        if (selectedWordIds.length === 0) {
          setErrorMsg('请至少选择一个单词进行听写');
          setSubmitting(false);
          return;
        }

        const session = await api.createStudySession({
          dictionaryId: selectedDictId,
          wordIds: selectedWordIds,
          mode: 'WRITE_ONLY'
        });
        onClose();
        onSessionStarted(session.id);
      } else {
        // Random count
        const session = await api.createStudySession({
          dictionaryId: selectedDictId,
          count,
          sortMode,
          mode: 'WRITE_ONLY',
          excludeMastered: false
        });
        onClose();
        onSessionStarted(session.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || '开启听写任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E7EEF8] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7EEF8] flex items-center justify-between shrink-0 bg-[#F7FAFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF2FE] text-[#4F7DF3] flex items-center justify-center shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#29466F]">开启单词听写</h3>
              <p className="text-xs text-[#8BA0BD]">听音看释义，键盘盲打默写英文</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8BA0BD] hover:text-[#29466F] hover:bg-white border border-transparent hover:border-[#E7EEF8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Source Selector: 辞书库 vs 错词本 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8BA0BD] uppercase tracking-wider">
              听写词源
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSource('DICTIONARY')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  source === 'DICTIONARY'
                    ? 'border-[#4F7DF3] bg-[#EBF2FE] text-[#4F7DF3] shadow-xs'
                    : 'border-[#E7EEF8] bg-white text-[#29466F] hover:border-[#4F7DF3]/40'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">辞书词库</div>
                  <div className="text-[11px] opacity-75">系统或个人辞书</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSource('WRONG_WORDS')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  source === 'WRONG_WORDS'
                    ? 'border-[#4F7DF3] bg-[#EBF2FE] text-[#4F7DF3] shadow-xs'
                    : 'border-[#E7EEF8] bg-white text-[#29466F] hover:border-[#4F7DF3]/40'
                }`}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">错词本攻坚</div>
                  <div className="text-[11px] opacity-75">共 {wrongWords.length} 个易错词</div>
                </div>
              </button>
            </div>
          </div>

          {/* Condition A: 辞书模式 */}
          {source === 'DICTIONARY' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Select Dictionary */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8BA0BD] uppercase tracking-wider">
                  选择辞书
                </label>
                <select
                  value={selectedDictId}
                  onChange={e => setSelectedDictId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E7EEF8] rounded-xl text-sm font-medium text-[#29466F] outline-none focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/10"
                >
                  {dictionaries.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.wordCount || 0} 词) {d.isSystem ? '· 官方' : '· 我的'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Mode: 随机抽词 vs 自选指定单词 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8BA0BD] uppercase tracking-wider">
                  选择模式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectionType('RANDOM')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectionType === 'RANDOM'
                        ? 'border-[#4F7DF3] bg-[#EBF2FE] text-[#4F7DF3]'
                        : 'border-[#E7EEF8] text-[#8BA0BD] hover:text-[#29466F]'
                    }`}
                  >
                    🎲 随机/批量抽词
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionType('PICK_WORDS')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectionType === 'PICK_WORDS'
                        ? 'border-[#4F7DF3] bg-[#EBF2FE] text-[#4F7DF3]'
                        : 'border-[#E7EEF8] text-[#8BA0BD] hover:text-[#29466F]'
                    }`}
                  >
                    ☑ 自选指定单词
                  </button>
                </div>
              </div>

              {/* Sub-mode A: 随机抽词 */}
              {selectionType === 'RANDOM' && (
                <div className="space-y-4">
                  {/* Count Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8BA0BD] uppercase tracking-wider">
                      听写题量
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 20, 30, 50].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCount(c)}
                          className={`py-2.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                            count === c
                              ? 'border-[#4F7DF3] bg-[#4F7DF3] text-white'
                              : 'border-[#E7EEF8] bg-white text-[#29466F] hover:bg-[#F7FAFF]'
                          }`}
                        >
                          {c} 词
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8BA0BD] uppercase tracking-wider">
                      出词顺序
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSortMode('RANDOM')}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                          sortMode === 'RANDOM'
                            ? 'border-[#4F7DF3] bg-[#EBF2FE] text-[#4F7DF3]'
                            : 'border-[#E7EEF8] text-[#8BA0BD]'
                        }`}
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>随机乱序</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortMode('SEQUENCE')}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                          sortMode === 'SEQUENCE'
                            ? 'border-[#4F7DF3] bg-[#EBF2FE] text-[#4F7DF3]'
                            : 'border-[#E7EEF8] text-[#8BA0BD]'
                        }`}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span>辞书教材顺序</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-mode B: 自选单词 */}
              {selectionType === 'PICK_WORDS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#29466F]">
                      已选 <strong className="text-[#4F7DF3] font-mono text-sm">{selectedWordIds.length}</strong> / {dictWords.length} 个单词
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllDictWords}
                        className="text-[#4F7DF3] hover:underline"
                      >
                        全选
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllDictWords}
                        className="text-[#8BA0BD] hover:underline"
                      >
                        清空
                      </button>
                    </div>
                  </div>

                  {loadingDictWords ? (
                    <div className="py-8 text-center text-xs text-[#8BA0BD] flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#4F7DF3]" />
                      <span>正在读取辞书词库...</span>
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto border border-[#E7EEF8] rounded-2xl p-2 divide-y divide-[#E7EEF8]/60 bg-[#F7FAFF]">
                      {dictWords.map((item, idx) => {
                        const wid = item.wordId || item.word?.id;
                        const wordObj = item.word;
                        const isSelected = selectedWordIds.includes(wid);
                        return (
                          <div
                            key={wid || idx}
                            onClick={() => toggleSelectWord(wid)}
                            className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                              isSelected ? 'bg-white text-[#29466F] font-semibold' : 'text-[#8BA0BD] hover:bg-white/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#4F7DF3] shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-[#8BA0BD] shrink-0" />
                              )}
                              <span className="text-sm font-bold text-[#29466F] truncate">
                                {wordObj?.text || item.text || '单词'}
                              </span>
                              <span className="text-xs text-[#8BA0BD] truncate">
                                {wordObj?.meanings?.[0]?.definitionCn || ''}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-[#8BA0BD] shrink-0">
                              {wordObj?.phoneticUk || ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Condition B: 错词本模式 */}
          {source === 'WRONG_WORDS' && (
            <div className="space-y-4 animate-fadeIn">
              {loadingWrongWords ? (
                <div className="py-12 text-center text-xs text-[#8BA0BD] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#4F7DF3]" />
                  <span>正在读取错词本...</span>
                </div>
              ) : wrongWords.length === 0 ? (
                <div className="py-10 text-center bg-[#F7FAFF] rounded-2xl border border-[#E7EEF8] space-y-2">
                  <p className="text-sm font-semibold text-[#29466F]">暂无任何错词记录！</p>
                  <p className="text-xs text-[#8BA0BD]">你可以选择辞书词库进行听写挑战。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#29466F]">
                      已选 <strong className="text-[#4F7DF3] font-mono text-sm">{selectedWrongWordIds.length}</strong> / {wrongWords.length} 个错词
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllWrongWords}
                        className="text-[#4F7DF3] hover:underline"
                      >
                        全选
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllWrongWords}
                        className="text-[#8BA0BD] hover:underline"
                      >
                        清空
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-[#E7EEF8] rounded-2xl p-2 divide-y divide-[#E7EEF8]/60 bg-[#F7FAFF]">
                    {wrongWords.map(w => {
                      const isSelected = selectedWrongWordIds.includes(w.id);
                      return (
                        <div
                          key={w.id}
                          onClick={() => toggleSelectWrongWord(w.id)}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-white text-[#29466F] font-semibold' : 'text-[#8BA0BD] hover:bg-white/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#4F7DF3] shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-[#8BA0BD] shrink-0" />
                            )}
                            <span className="text-sm font-bold text-[#29466F] truncate">
                              {w.text}
                            </span>
                            <span className="text-xs text-[#8BA0BD] truncate">
                              {w.meanings?.[0]?.definitionCn || ''}
                            </span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 shrink-0 font-medium">
                            错 {w.progress?.wrongCount || 1} 次
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E7EEF8] bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 border border-[#E7EEF8] rounded-2xl text-sm font-semibold text-[#8BA0BD] hover:text-[#29466F] transition-colors"
          >
            取消
          </button>

          <button
            type="button"
            disabled={
              submitting ||
              (source === 'WRONG_WORDS' && selectedWrongWordIds.length === 0) ||
              (source === 'DICTIONARY' && selectionType === 'PICK_WORDS' && selectedWordIds.length === 0)
            }
            onClick={handleStartDictation}
            className="flex-1 py-3 px-6 bg-[#4F7DF3] hover:bg-[#3D6CE5] disabled:opacity-40 text-white text-sm font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在开启听写...</span>
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4" />
                <span>
                  {source === 'WRONG_WORDS'
                    ? `开始听写选中的 ${selectedWrongWordIds.length} 个错词`
                    : selectionType === 'PICK_WORDS'
                    ? `开始听写选中的 ${selectedWordIds.length} 个单词`
                    : `开始听写 (${count} 词)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
