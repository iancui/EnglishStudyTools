import React, { useEffect, useState } from 'react';
import {
  Settings,
  BookOpen,
  Volume2,
  Split,
  FolderPlus,
  User,
  LogOut,
  Save,
  Check,
  Sparkles,
  Layers,
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  Shield
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DictionaryConfig, DictionaryItem, DictionaryChapter } from '../types/index.ts';
import { SpeechPlayer } from '../utils/speech.ts';

interface SettingsViewProps {
  initialTab?: 'learning' | 'my-dictionaries' | 'account';
  user: any;
  onLogout: () => void;
  navigate: (route: string) => void;
  onConfigUpdated: (cfg: DictionaryConfig) => void;
  initialConfig: DictionaryConfig;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialTab = 'learning',
  user,
  onLogout,
  navigate,
  onConfigUpdated,
  initialConfig
}) => {
  const [activeTab, setActiveTab] = useState<'learning' | 'my-dictionaries' | 'account'>(initialTab);

  // Configuration State
  const [config, setConfig] = useState<DictionaryConfig>(initialConfig);
  const [allDictionaries, setAllDictionaries] = useState<DictionaryItem[]>([]);
  const [myDictionaries, setMyDictionaries] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dictionariesLoading, setDictionariesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Create dictionary modal/form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDictName, setNewDictName] = useState('');
  const [newDictDesc, setNewDictDesc] = useState('');
  const [creatingDict, setCreatingDict] = useState(false);
  const [selectedChapterDictId, setSelectedChapterDictId] = useState('');
  const [chapters, setChapters] = useState<DictionaryChapter[]>([]);
  const [chapterWords, setChapterWords] = useState<any[]>([]);
  const [chapterSentences, setChapterSentences] = useState<any[]>([]);
  const [chapterWordQuery, setChapterWordQuery] = useState('');
  const [chapterSentenceQuery, setChapterSentenceQuery] = useState('');
  const [chapterImportText, setChapterImportText] = useState('');
  const [chapterImportTargetId, setChapterImportTargetId] = useState('');
  const [importingChapterWords, setImportingChapterWords] = useState(false);
  const [wordStudyChapters, setWordStudyChapters] = useState<DictionaryChapter[]>([]);
  const [newChapterName, setNewChapterName] = useState('');
  const [creatingChapter, setCreatingChapter] = useState(false);

  // Audio testing
  const [isAuditioning, setIsAuditioning] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  useEffect(() => {
    loadSettingsData();
    loadCurrentConfig();
  }, []);

  useEffect(() => {
    const dictId = config.defaultDictionaryId;
    if (!dictId) { setWordStudyChapters([]); return; }
    api.getDictionaryChapters(dictId).then(setWordStudyChapters).catch(() => setWordStudyChapters([]));
  }, [config.defaultDictionaryId]);

  const loadCurrentConfig = async () => {
    try {
      const current = await api.getDictionaryConfig();
      if (current) {
        setConfig(current);
        onConfigUpdated(current);
      }
    } catch (e) {
      console.error('Failed to load current dictionary config:', e);
    }
  };

  const loadSettingsData = async () => {
    try {
      setDictionariesLoading(true);
      const bundle = await api.getSettingsBundle();
      if (bundle?.dictionaries) setAllDictionaries(bundle.dictionaries);
      if (bundle?.myDictionaries) setMyDictionaries(bundle.myDictionaries);
    } catch (e) {
      console.error('Failed to load settings dictionaries:', e);
    } finally {
      setDictionariesLoading(false);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.updateDictionaryConfig(config);
      setConfig(updated);
      onConfigUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save config:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAudition = async (type: 'UK' | 'US') => {
    setIsAuditioning(true);
    const lang = type === 'US' ? 'en-US' : 'en-GB';
    await SpeechPlayer.speak('Knowledge is power, learning makes progress.', { lang, rate: 1.0 });
    setIsAuditioning(false);
  };

  const handleCreateMyDict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDictName.trim()) return;

    try {
      setCreatingDict(true);
      const created = await api.createDictionary({
        name: newDictName.trim(),
        description: newDictDesc.trim() || undefined
      });
      setMyDictionaries(prev => [created, ...prev]);
      setAllDictionaries(prev => [created, ...prev]);
      setNewDictName('');
      setNewDictDesc('');
      setShowCreateModal(false);
    } catch (e: any) {
      alert(e.message || '创建辞书失败');
    } finally {
      setCreatingDict(false);
    }
  };

  const loadChapters = async (dictId: string) => {
    if (!dictId) { setChapters([]); setChapterWords([]); setChapterSentences([]); setChapterImportTargetId(''); return; }
    try {
      const [loadedChapters, dictionary] = await Promise.all([
        api.getDictionaryChapters(dictId),
        api.getDictionaryById(dictId)
      ]);
      setChapters(loadedChapters);
      setChapterImportTargetId(prev => loadedChapters.some(ch => ch.id === prev) ? prev : (loadedChapters[0]?.id || ''));
      setChapterWords(dictionary?.words || []);
      setChapterSentences(dictionary?.sentences || []);
    } catch (e) {
      console.error('加载章节内容失败:', e);
      setChapters([]);
      setChapterWords([]);
      setChapterSentences([]);
    }
  };

  const handleCreateChapter = async () => {
    if (!selectedChapterDictId || !newChapterName.trim()) return;
    try {
      setCreatingChapter(true);
      const chapter = await api.createDictionaryChapter(selectedChapterDictId, { name: newChapterName.trim() });
      setChapters(prev => [...prev, chapter].sort((a,b) => a.sequence-b.sequence));
      setChapterImportTargetId(prev => prev || chapter.id);
      if (config.defaultDictionaryId === selectedChapterDictId) setWordStudyChapters(prev => [...prev, chapter].sort((a,b) => a.sequence-b.sequence));
      setNewChapterName('');
    } catch (e:any) { alert(e.message || '创建章节失败'); }
    finally { setCreatingChapter(false); }
  };

  const handleRenameChapter = async (chapter: DictionaryChapter) => {
    const name = window.prompt('请输入新的章节名称', chapter.name)?.trim();
    if (!name || name === chapter.name) return;
    try {
      const updated = await api.updateDictionaryChapter(selectedChapterDictId, chapter.id, { name, sequence: chapter.sequence });
      setChapters(prev => prev.map(ch => ch.id === chapter.id ? updated : ch));
      setWordStudyChapters(prev => prev.map(ch => ch.id === chapter.id ? updated : ch));
    } catch (e:any) { alert(e.message || '修改章节失败'); }
  };

  const handleDeleteChapter = async (chapter: DictionaryChapter) => {
    if (!window.confirm(`确定删除章节“${chapter.name}”吗？章节中的单词和句子不会删除，只会变为未分章内容。`)) return;
    try {
      await api.deleteDictionaryChapter(selectedChapterDictId, chapter.id);
      setChapters(prev => prev.filter(ch => ch.id !== chapter.id));
      setChapterWords(prev => prev.map(item => item.chapterId === chapter.id ? { ...item, chapterId: undefined } : item));
      setChapterSentences(prev => prev.map(item => item.chapterId === chapter.id ? { ...item, chapterId: undefined } : item));
      setChapterImportTargetId(prev => prev === chapter.id ? (chapters.find(ch => ch.id !== chapter.id)?.id || '') : prev);
      setWordStudyChapters(prev => prev.filter(ch => ch.id !== chapter.id));
      if (config.wordStudyChapterId === chapter.id) setConfig(prev => { const updated = { ...prev, wordStudyChapterId: undefined }; onConfigUpdated(updated); return updated; });
    } catch (e:any) { alert(e.message || '删除章节失败'); }
  };

  const handleMoveChapter = async (chapter: DictionaryChapter, direction: -1 | 1) => {
    const index = chapters.findIndex(ch => ch.id === chapter.id);
    const target = chapters[index + direction];
    if (!target) return;
    try {
      await api.updateDictionaryChapter(selectedChapterDictId, chapter.id, { name: chapter.name, sequence: target.sequence });
      await api.updateDictionaryChapter(selectedChapterDictId, target.id, { name: target.name, sequence: chapter.sequence });
      await loadChapters(selectedChapterDictId);
      if (config.defaultDictionaryId === selectedChapterDictId) {
        setWordStudyChapters(await api.getDictionaryChapters(selectedChapterDictId));
      }
    } catch (e:any) { alert(e.message || '调整章节顺序失败'); }
  };

  const handleAssignWordChapter = async (wordId: string, chapterId: string) => {
    try {
      await api.assignWordToChapter(selectedChapterDictId, wordId, chapterId || undefined);
      setChapterWords(prev => prev.map(item => item.wordId === wordId ? { ...item, chapterId: chapterId || undefined } : item));
    } catch (e:any) { alert(e.message || '调整单词所属章节失败'); }
  };

  const handleAssignSentenceChapter = async (item: any, chapterId: string) => {
    const targetSequence = chapterId && chapterId !== item.chapterId
      ? Math.max(0, ...chapterSentences.filter(sentence => sentence.chapterId === chapterId && sentence.sentenceId !== item.sentenceId).map(sentence => Number(sentence.sequence) || 0)) + 1
      : Math.max(1, Number(item.sequence) || 1);
    try {
      await api.assignSentenceToChapter(selectedChapterDictId, item.sentenceId, chapterId || undefined, targetSequence);
      setChapterSentences(prev => prev.map(sentence => sentence.sentenceId === item.sentenceId ? { ...sentence, chapterId: chapterId || undefined, sequence: targetSequence } : sentence));
    } catch (e:any) { alert(e.message || '调整句子所属章节失败'); }
  };

  const handleSentenceSequenceChange = (sentenceId: string, value: string) => {
    const sequence = Math.max(1, Number(value) || 1);
    setChapterSentences(prev => prev.map(item => item.sentenceId === sentenceId ? { ...item, sequence } : item));
  };

  const handleSaveSentenceSequence = async (item: any) => {
    try {
      await api.assignSentenceToChapter(selectedChapterDictId, item.sentenceId, item.chapterId || undefined, Math.max(1, Number(item.sequence) || 1));
      const refreshed = await api.getDictionaryById(selectedChapterDictId);
      setChapterSentences(refreshed?.sentences || []);
    } catch (e:any) { alert(e.message || '保存句子顺序失败'); }
  };

  const handleImportChapterWords = async () => {
    if (!selectedChapterDictId || !chapterImportText.trim()) return;
    const chapter = chapters.find(ch => ch.id === chapterImportTargetId);
    if (!chapter) { alert('请先选择要导入的章节。'); return; }
    const words = chapterImportText.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const parts = line.split(/\t|,/).map(part => part.trim());
      return { text: parts[0], phoneticUk: parts[1] || undefined, pos: parts[2] || undefined, definitionCn: parts[3] || undefined };
    });
    try {
      setImportingChapterWords(true);
      const result = await api.importAdminWords(selectedChapterDictId, words, chapter.id);
      setChapterImportText('');
      await loadChapters(selectedChapterDictId);
      alert(`导入完成：新增到辞书 ${result.importedCount || 0} 个单词，其中新建词条 ${result.newWordsCount || 0} 个。`);
    } catch (e:any) { alert(e.message || '导入单词失败；请确认当前账号有词库导入权限。'); }
    finally { setImportingChapterWords(false); }
  };

  const handleDeleteMyDict = async (dictId: string) => {
    if (!window.confirm('确定要删除这本自建辞书吗？该操作不会删除系统词汇。')) return;
    try {
      await api.deleteDictionary(dictId);
      setMyDictionaries(prev => prev.filter(d => d.id !== dictId));
      setAllDictionaries(prev => prev.filter(d => d.id !== dictId));
      if (config.defaultDictionaryId === dictId) {
        setConfig(prev => ({ ...prev, defaultDictionaryId: 'dict-primary-6' }));
      }
    } catch (e: any) {
      alert(e.message || '删除辞书失败');
    }
  };

  if (loading) return null;

  const isAdmin = user?.role === 'ADMIN';
  const selectedChapterDictionary = allDictionaries.find(d => d.id === selectedChapterDictId);
  const canManageSelectedDictionary = isAdmin || (selectedChapterDictionary?.ownerType === 'USER' && selectedChapterDictionary.ownerUserId === user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          配置中心 · Preferences
        </div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mt-1 font-serif">
          系统设置
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          统一管理学习引擎、默认辞书、音标与发音偏好及个人自建词库。
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('learning')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'learning'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>学习与语音设置</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-dictionaries')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'my-dictionaries'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>我的辞书 ({myDictionaries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'account'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>个人账户</span>
        </button>
      </div>

      {activeTab === 'my-dictionaries' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-stone-900">辞书章节</h2>
                <p className="text-xs text-stone-500 mt-1">章节位于辞书下面，单词和句子都可以归属到具体章节。</p>
              </div>
              <Layers className="w-5 h-5 text-amber-700" />
            </div>
            <select value={selectedChapterDictId} onChange={e=>{setSelectedChapterDictId(e.target.value);loadChapters(e.target.value)}} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium">
              <option value="">选择一本辞书</option>
              {allDictionaries.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {selectedChapterDictId && <div className="mt-4 space-y-3">
              {chapters.map((ch,i)=><div key={ch.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="min-w-0"><span className="text-xs text-stone-400 mr-2">Chapter {i+1}</span><span className="font-semibold text-stone-800">{ch.name}</span><span className="ml-2 text-xs text-stone-400">顺序 {ch.sequence}</span></div>
                <div className="flex items-center gap-1">
                  {canManageSelectedDictionary && <>
                    <button type="button" disabled={i===0} onClick={()=>handleMoveChapter(ch,-1)} className="px-2 py-1 rounded border border-stone-200 text-xs disabled:opacity-30" title="上移">↑</button>
                    <button type="button" disabled={i===chapters.length-1} onClick={()=>handleMoveChapter(ch,1)} className="px-2 py-1 rounded border border-stone-200 text-xs disabled:opacity-30" title="下移">↓</button>
                    <button type="button" onClick={()=>handleRenameChapter(ch)} className="px-2 py-1 rounded border border-stone-200 text-xs">重命名</button>
                    <button type="button" onClick={()=>handleDeleteChapter(ch)} className="px-2 py-1 rounded border border-red-200 text-red-600 text-xs">删除</button>
                  </>}
                </div>
              </div>)}
              {chapters.length===0 && <div className="text-xs text-stone-400 py-3">还没有章节</div>}
              {canManageSelectedDictionary && <div className="flex gap-2 pt-2">
                <input value={newChapterName} onChange={e=>setNewChapterName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void handleCreateChapter();}}} placeholder="例如：Chapter 1 / Unit 1" className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm" />
                <button type="button" disabled={creatingChapter || !newChapterName.trim()} onClick={handleCreateChapter} className="px-5 py-3 rounded-xl bg-stone-900 text-white text-sm font-bold disabled:opacity-50">{creatingChapter?'创建中…':'新增章节'}</button>
              </div>}
              <div className="border-t border-stone-200 pt-4 mt-4 space-y-3">
                <div>
                  <h3 className="font-bold text-stone-800">章节单词归属</h3>
                  <p className="text-xs text-stone-500 mt-1">把辞书已有的单词分配到章节；选择“未分章”会将单词放回整本辞书的未分章范围。</p>
                </div>
                <input value={chapterWordQuery} onChange={e=>setChapterWordQuery(e.target.value)} placeholder="搜索单词或中文释义…" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm" />
                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-100">
                  {chapterWords.filter(item => {
                    const word = item.word || {};
                    const query = chapterWordQuery.trim().toLowerCase();
                    return !query || String(word.text || '').toLowerCase().includes(query) || (word.meanings || []).some((m:any)=>String(m.definitionCn || '').toLowerCase().includes(query));
                  }).slice(0,200).map(item => (
                    <div key={item.wordId} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-stone-800">{item.word?.text || item.wordId}</div>
                        <div className="text-xs text-stone-500 truncate">{(item.word?.meanings || []).map((m:any)=>m.definitionCn).filter(Boolean).join('；') || '暂无释义'}</div>
                      </div>
                      <select value={item.chapterId || ''} disabled={!canManageSelectedDictionary} onChange={e=>handleAssignWordChapter(item.wordId,e.target.value)} className="max-w-[48%] rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs disabled:opacity-60">
                        <option value="">未分章</option>
                        {chapters.map(ch=><option key={ch.id} value={ch.id}>{ch.sequence}. {ch.name}</option>)}
                      </select>
                    </div>
                  ))}
                  {chapterWords.length===0 && <div className="px-3 py-5 text-xs text-stone-400">这本辞书还没有单词。</div>}
                </div>
                {chapterWords.length>200 && <p className="text-xs text-stone-400">仅显示前 200 个匹配单词，请使用搜索缩小范围。</p>}
              </div>
              <div className="border-t border-stone-200 pt-4 mt-4 space-y-3">
                <div>
                  <h3 className="font-bold text-stone-800">章节句子归属与顺序</h3>
                  <p className="text-xs text-stone-500 mt-1">句子按章节顺序、章节内序号学习；修改序号后移开输入框即可保存。</p>
                </div>
                <input value={chapterSentenceQuery} onChange={e=>setChapterSentenceQuery(e.target.value)} placeholder="搜索英文句子或中文翻译…" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm" />
                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-100">
                  {chapterSentences.filter(item => {
                    const sentence = item.sentence || {};
                    const query = chapterSentenceQuery.trim().toLowerCase();
                    return !query || String(sentence.content || '').toLowerCase().includes(query) || String(sentence.translation || '').toLowerCase().includes(query);
                  }).slice(0,150).map(item => (
                    <div key={item.sentenceId} className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-stone-800">{item.sentence?.content || item.sentenceId}</div>
                        <div className="text-xs text-stone-500 mt-1">{item.sentence?.translation || '暂无翻译'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-stone-500">序号</label>
                        <input type="number" min={1} value={item.sequence || 1} disabled={!canManageSelectedDictionary} onChange={e=>handleSentenceSequenceChange(item.sentenceId,e.target.value)} onBlur={()=>handleSaveSentenceSequence(item)} className="w-16 rounded-lg border border-stone-200 px-2 py-2 text-xs disabled:opacity-60" />
                        <select value={item.chapterId || ''} disabled={!canManageSelectedDictionary} onChange={e=>handleAssignSentenceChapter(item,e.target.value)} className="max-w-[45%] rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs disabled:opacity-60">
                          <option value="">未分章</option>
                          {chapters.map(ch=><option key={ch.id} value={ch.id}>{ch.sequence}. {ch.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {chapterSentences.length===0 && <div className="px-3 py-5 text-xs text-stone-400">这本辞书还没有关联句子；管理员可以在“Gemini 句子入库工具”导入并指定章节。</div>}
                </div>
                {chapterSentences.length>150 && <p className="text-xs text-stone-400">仅显示前 150 条匹配句子，请使用搜索缩小范围。</p>}
              </div>
              {isAdmin && <div className="border-t border-stone-200 pt-4 space-y-2">
                <h3 className="font-bold text-stone-800">批量导入到章节</h3>
                <p className="text-xs text-stone-500">每行一个单词；也支持“单词、音标、词性、中文释义”四列，用 Tab 或英文逗号分隔。导入时会归入所选章节。</p>
                <select value={chapterImportTargetId} onChange={e=>setChapterImportTargetId(e.target.value)} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm">
                  {chapters.map(ch=><option key={ch.id} value={ch.id}>{ch.sequence}. {ch.name}</option>)}
                </select>
                <textarea value={chapterImportText} onChange={e=>setChapterImportText(e.target.value)} rows={5} placeholder={'apple\t/ˈæp.əl/\tn.\t苹果\nbook\t/bʊk/\tn.\t书'} className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm" />
                <button type="button" disabled={importingChapterWords || !chapters.length || !chapterImportText.trim()} onClick={handleImportChapterWords} className="px-4 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-bold disabled:opacity-50">{importingChapterWords?'正在导入…':'导入到章节'}</button>
              </div>}
            </div>}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: 学习与语音设置 (涵盖 1.学习设置 2.默认辞书 3.音标设置 4.发音设置 5.自然拼读) */}
      {/* ============================================================ */}
      {activeTab === 'learning' && (
        <form onSubmit={handleSaveConfig} className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
            {/* 1 & 2: 默认辞书 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-base font-bold text-stone-900 block">
                    1. 默认首选辞书
                  </label>
                  <p className="text-xs text-stone-500 mt-0.5">
                    开启快速背单词任务时，系统将默认以该辞书作为候选词库。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-dictionaries')}
                  className="text-xs text-amber-800 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>管理自建辞书 →</span>
                </button>
              </div>

              {dictionariesLoading && allDictionaries.length === 0 && (
                <div className="text-xs text-stone-400 mb-2">正在加载辞书列表…</div>
              )}
              <select
                value={config.defaultDictionaryId || 'dict-primary-6'}
                onChange={e => setConfig(prev => ({ ...prev, defaultDictionaryId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:bg-white focus:border-stone-900 outline-none transition-all cursor-pointer"
              >
                {allDictionaries.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.wordCount || 0} 词) {d.isSystem ? '· [系统辞书]' : '· [我的生词本]'}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. 背单词默认学习参数 */}
            <div className="space-y-4 pt-6 border-t border-stone-100">
              <div>
                <label className="text-base font-bold text-stone-900 block">2. 背单词默认学习参数</label>
                <p className="text-xs text-stone-500 mt-0.5">首页点击“开始背单词”后直接按这里的配置开始，不再弹出设置窗口。</p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <Sparkles className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-xs leading-relaxed text-amber-900">
                  <div className="font-bold">学习配置变更提醒</div>
                  <div className="mt-0.5 text-amber-800">保存后，当前正在进行的学习批次会重置，需要重新开始；已经学过或掌握的单词状态不会被清除。</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1.5">学习章节</label>
                  <select
                    value={config.wordStudyChapterId || ''}
                    onChange={e => setConfig(prev => ({ ...prev, wordStudyChapterId: e.target.value || undefined }))}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900"
                  >
                    <option value="">整本辞书</option>
                    {wordStudyChapters.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.sequence}. {ch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1.5">每次学习数量</label>
                  <select
                    value={config.wordStudyCount || 20}
                    onChange={e => setConfig(prev => ({ ...prev, wordStudyCount: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900"
                  >
                    {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n} 词</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1.5">背写与额外背写顺序</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['SEQUENCE', '顺序'],
                      ['RANDOM', '随机']
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, wordStudyWriteOrder: value as any }))}
                        className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                          (config.wordStudyWriteOrder || 'SEQUENCE') === value
                            ? 'border-amber-400 bg-amber-50 text-stone-900 ring-2 ring-amber-200'
                            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1.5">强化听写顺序</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['RANDOM', '随机'],
                      ['SEQUENCE', '顺序']
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, wordStudyDictationOrder: value as any }))}
                        className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                          (config.wordStudyDictationOrder || 'RANDOM') === value
                            ? 'border-amber-400 bg-amber-50 text-stone-900 ring-2 ring-amber-200'
                            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1.5">学习完成后进入</label>
                <p className="text-[11px] text-stone-400 mb-2">基础“学 → 背写”固定开启；可选是否追加一轮额外背写，以及是否进入强化听写。</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['wordStudyIncludeWrite', '额外背写', '基础背写完成后，再追加一轮中文释义拼写'],
                    ['wordStudyIncludeDictation', '强化听写', '播放发音后听音输入英文拼写']
                  ].map(([key, label, desc]) => {
                    const enabled = key === 'wordStudyIncludeWrite'
                      ? config.wordStudyIncludeWrite !== false
                      : config.wordStudyIncludeDictation !== false;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({ ...prev, [key]: !enabled } as DictionaryConfig));
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          enabled
                            ? 'border-amber-400 bg-amber-50 text-stone-900 ring-2 ring-amber-200'
                            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{label}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${enabled ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300 text-transparent'}`}>✓</span>
                        </div>
                        <div className="text-xs text-stone-500 mt-1">{desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* 2. 句子专用辞书 */}
            <div className="space-y-3 pt-6 border-t border-stone-100">
              <div>
                <label className="text-base font-bold text-stone-900 block">2. 句子练习辞书</label>
                <p className="text-xs text-stone-500 mt-0.5">句子练习使用独立辞书，不受“默认首选辞书”影响。</p>
              </div>
              <select
                value={config.sentenceDictionaryId || config.defaultDictionaryId || 'dict-primary-6'}
                onChange={e => setConfig(prev => ({ ...prev, sentenceDictionaryId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:bg-white focus:border-stone-900 outline-none transition-all cursor-pointer"
              >
                {allDictionaries.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.wordCount || 0} 词) {d.isSystem ? '· [系统辞书]' : '· [我的生词本]'}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. 句子练习设置 */}
            <div className="space-y-3 pt-6 border-t border-stone-100">
              <div>
                <label className="text-base font-bold text-stone-900 block">3. 每次句子练习数量</label>
                <p className="text-xs text-stone-500 mt-0.5">首页点击“渐进句子”后直接开始练习，不再弹出设置窗口。</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 30].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, sentencePracticeCount: count }))}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${(config.sentencePracticeCount || 5) === count
                      ? 'border-amber-400 bg-amber-50 text-stone-900 ring-2 ring-amber-200'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'}`}
                  >{count} 句</button>
                ))}
              </div>
            </div>

            {/* 4. 音标显示设置 */}
            <div className="space-y-3 pt-6 border-t border-stone-100">
              <div>
                <label className="text-base font-bold text-stone-900 block">
                  3. 音标显示偏好
                </label>
                <p className="text-xs text-stone-500 mt-0.5">
                  设定学单词、背写与学语句中的首选国际音标体系。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, phoneticType: 'UK' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    config.phoneticType === 'UK'
                      ? 'bg-amber-50/80 border-amber-400 text-stone-900 ring-2 ring-amber-300'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">英式音标 (UK / DJ)</span>
                    {config.phoneticType === 'UK' && <Check className="w-4 h-4 text-amber-700" />}
                  </div>
                  <div className="text-xs text-stone-500 mt-1 font-mono">
                    例如：/ˈhɒlədeɪ/ · 适合牛津/剑桥系学习者
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, phoneticType: 'US' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    config.phoneticType === 'US'
                      ? 'bg-amber-50/80 border-amber-400 text-stone-900 ring-2 ring-amber-300'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">美式音标 (US / KK)</span>
                    {config.phoneticType === 'US' && <Check className="w-4 h-4 text-amber-700" />}
                  </div>
                  <div className="text-xs text-stone-500 mt-1 font-mono">
                    例如：/ˈhɑːlədeɪ/ · 适合美语发音与托福考培
                  </div>
                </button>
              </div>
            </div>

            {/* 5. 发音朗读设置 */}
            <div className="space-y-3 pt-6 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-base font-bold text-stone-900 block">
                    4. 发音语音偏好
                  </label>
                  <p className="text-xs text-stone-500 mt-0.5">
                    采用 Web Speech API 原生母语者语音合成引擎。
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAuditioning}
                  onClick={() => handleAudition(config.audioType)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isAuditioning ? '朗读中...' : '试听当前口音'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, audioType: 'UK' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    config.audioType === 'UK'
                      ? 'bg-amber-50/80 border-amber-400 text-stone-900 ring-2 ring-amber-300'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">英音朗读 (British English)</span>
                    {config.audioType === 'UK' && <Check className="w-4 h-4 text-amber-700" />}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    标准 RP 伦敦音腔调 · en-GB
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, audioType: 'US' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    config.audioType === 'US'
                      ? 'bg-amber-50/80 border-amber-400 text-stone-900 ring-2 ring-amber-300'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">美音朗读 (American English)</span>
                    {config.audioType === 'US' && <Check className="w-4 h-4 text-amber-700" />}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    标准 GA 通用美语腔调 · en-US
                  </div>
                </button>
              </div>
            </div>

            {/* 6. 自然拼读开关 */}
            <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="text-base font-bold text-stone-900 block flex items-center gap-2">
                  <Split className="w-4 h-4 text-stone-700" />
                  <span>6. 启用自然拼读音节拆分</span>
                </label>
                <p className="text-xs text-stone-500">
                  开启后，在单词学习页面将提供可点击的音节卡片（如 hol-i-day），支持音素分步跟读。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, enablePhonics: !prev.enablePhonics }))}
                className={`w-12 h-7 rounded-full transition-colors relative shrink-0 p-1 ${
                  config.enablePhonics ? 'bg-stone-900' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    config.enablePhonics ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-stone-500">
              {saveSuccess && (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4" />
                  <span>设置已成功保存并立即生效！</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-7 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在保存...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存设置</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 2: 我的辞书 (涵盖 6.我的辞书 管理与创建) */}
      {/* ============================================================ */}
      {activeTab === 'my-dictionaries' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  我的自建辞书
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  你创建的私有生词本与专项词库。可随时在学词时一键加入。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>新建辞书</span>
              </button>
            </div>

            {/* List */}
            {myDictionaries.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <FolderPlus className="w-6 h-6 text-amber-700" />
                </div>
                <div className="font-bold text-stone-800 text-sm">暂无自建辞书</div>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  点击上方“新建辞书”，创建属于你自己的“雅思核心词”或“易错生词本”。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myDictionaries.map(dict => (
                  <div
                    key={dict.id}
                    className="p-5 rounded-2xl border border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-white transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-base">
                          {dict.name}
                        </span>
                        <span className="text-xs font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                          {dict.wordCount || 0} 词
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">
                        {dict.description || '暂无详细描述'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs">
                      <span className="text-stone-400">
                        {new Date(dict.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate('/dictionaries')}
                          className="text-stone-700 hover:text-stone-900 font-medium hover:underline flex items-center gap-1"
                        >
                          <span>查看词条</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMyDict(dict.id)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="删除辞书"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick inline create modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-stone-900">新建我的辞书</h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-stone-400 hover:text-stone-700 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateMyDict} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      辞书名称 *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDictName}
                      onChange={e => setNewDictName(e.target.value)}
                      placeholder="如：考研必考高频词 / 雅思写作好词"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      辞书描述（选填）
                    </label>
                    <textarea
                      rows={3}
                      value={newDictDesc}
                      onChange={e => setNewDictDesc(e.target.value)}
                      placeholder="添加简介或备忘..."
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={creatingDict || !newDictName.trim()}
                      className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-40"
                    >
                      {creatingDict ? '创建中...' : '确认创建'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: 个人账户 */}
      {/* ============================================================ */}
      {activeTab === 'account' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-50 flex items-center justify-center font-bold text-xl font-serif">
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900">
                  {user?.username || 'Learner'}
                </h2>
                {isAdmin && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {user?.email || 'learner@linguastep.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-stone-500">
              数据保存在本地会话与高保真持久层中。
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
